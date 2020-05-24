from flask import Flask, request, jsonify
from flask_cors import CORS
import serial
import sqlite3
from sqlite3 import Error

# Constants
SERVER_PORT = 5555
SERVER_HOST = '0.0.0.0'

# Initialize app
app = Flask(__name__)
CORS(app)

# Initialize serial
s = serial.Serial()
s.port = "COM3"
s.baudrate = 9600
s.setDTR(False)
s.open()


# Routes
@app.route('/', methods=['GET'])
def index():
    conn = db_create_connection()
    
    pad_id = request.args.get('padId')
    invalid_pad = {
        'id': 0,
        'name': '',
        'profile': {
            'id': 0,
            'name': '',
            'values': []
        }
    }

    if pad_id:
        pads = db_select_pad_by_id(conn, pad_id)
        profiles = db_select_all_profiles(conn)
        conn.close()

        if pads == [] or profiles == []:
            message = ''
            if pads == []:
                message = f"{message} No pad found with id = {pad_id}."
            if profiles == []:
                message = f"{message} No profiles found on the database."
            return {
                'message': message,
                'success': False,
                'pad': invalid_pad,
                'profiles': [],
            }
        else:
            return {
                'message': 'Loaded current pad and profile.',
                'success': True,
                'pad': {
                    'id': pads[0][0],
                    'name': pads[0][1],
                    'profile': {
                        'id': pads[0][3],
                        'name': pads[0][4],
                        'values': pads[0][5:]
                    },
                },
                'profiles':[
                    {
                        'id': profile[0],
                        'name': profile[1],
                        'values': profile[2:]
                    } 
                    for profile in profiles
                ],
            } 
    return {
        'message': "Must supply a padId",
        'success': False,
        'pad': invalid_pad,
        'profiles': [],
    }

@app.route('/thresholds', methods=['POST'])
def set_thresholds():
    message = ''
    success = False
    
    req_data = request.get_json()
    try:
        ## Serial input to the controller to apply new thresholds
        values = ','.join(str(x) for x in request.get_json()['values']) + '\n'
        s.write(values.encode())
        ## Serial call to get the current thresholds back
        s.write("thresholds".encode())
        serial_response = f'New Thresholds: {s.readline().decode().strip()}'

        ## Update the pad to associate with given profile
        conn = db_create_connection()
        success = db_update_pad_by_id(conn, req_data['padId'], req_data['profile']['id'])
        conn.close()
        
        if success:
            message = f"Applied profile: {req_data['profile']['name']} ({serial_response})"
        else:
            message = f'Could not apply profile to pad. Check current thresholds.'
    except Exception as e:
        message = str(e),
        success = False
    
    return {
        'message': message,
        'success': success
    }

@app.route('/thresholds', methods=['GET'])
def get_thresholds():
    message = ''
    values = []
    success = False
    try:
        s.write("thresholds".encode())
        s_resp = s.readline().decode().strip()
        message = "Current Thresholds: " + s_resp
        values = [int(x) for x in s_resp.split(',')]
        success = True
    except Exception as e:
        message = str(e)
    
    return {
        'message': message,
        'values': values,
        'success': success
    }

@app.route('/pressures', methods=['GET'])
def get_pressures():
    message = ''
    success = False
    try:
        s.write("pressures".encode())        
        message = 'Current pressures: ' + s.readline().decode().strip()
        success = True
    except Exception as e:
        message = str(e)
    
    return {
        'message': message,
        'success': success
    }

@app.route('/profiles', methods=['GET'])
def get_all_profiles():
    conn = db_create_connection()
    
    message = ''

    profile_id = request.args.get('id')
    if profile_id:
        profiles = db_select_profile_by_id(conn, profile_id)
        if profiles == []:
            message = f'No profile found with id = {profile_id}.'
        else:
            message = f'Retrieved profile: {profiles[0][1]}.'
    else:
        profiles = db_select_all_profiles(conn)
        message = "Retrieved all profiles."
    conn.close()

    return {
        'message': message,
        'success': True,
        'profiles': [
            {
                'id': profile[0],
                'name': profile[1],
                'values': profile[2:]
            } 
            for profile in profiles
        ]
    }

@app.route('/profiles', methods=['POST'])
def update_profile():
    req_data = request.get_json()
    if not req_data:
        return {
            'message': 'Profile request body required.',
            'success': False
        }
    conn = db_create_connection()
    profile_name = req_data['name']
    db_update_existing_profile(conn, req_data['id'], profile_name, req_data['values'])
    conn.close()
    return { 
        'message': f'Saved profile: {profile_name}',
        'success': True,
    }

@app.route('/profiles', methods=['PUT'])
def add_profile():
    req_data = request.get_json()
    print(req_data)
    profile = {
        'id': 0,
        'name': '',
        'values': []
    }

    if not req_data:
        return {
            'message': 'Profile request body required.',
            'success': False,
            'profile': profile
        }

    profile_name = req_data['name']
    values = req_data['values']
    
    conn = db_create_connection()
    new_profile_id = db_insert_new_profile(conn, profile_name, values)
    conn.close()

    message = ''
    success = False

    if new_profile_id == 0:
        message = f'Failed to create new profile: {profile_name}'
    else:
        message = f'Created new profile: {profile_name}'
        success = True
        profile = {
            'id': new_profile_id,
            'name': profile_name,
            'values': req_data['values']
        }

    return { 
        'message': message,
        'success': success,
        'profile': profile
    }

@app.route('/profiles', methods=['DELETE'])
def delete_profile():
    profile_id = request.args.get('id')
    if not profile_id:
        return {
            'message': 'Must provide a profile id.',
            'success': False
        }
    conn = db_create_connection()
    rows_affected = db_delete_profile(conn, profile_id)
    conn.close()

    message = ''
    success = False

    if rows_affected == 1:
        message = 'Successfully deleted profile'
        success = True
    else:
        message = 'Failed to delete profile'

    return {
        'message': message,
        'success': success
    }

@app.route('/pads', methods=['GET'])
def get_all_pads():
    conn = db_create_connection()
    
    message = ''
    success = True

    pad_id = request.args.get('id')
    if pad_id:
        pads = db_select_pad_by_id(conn, pad_id)
        if pads == []:
            message = f'No pad found with id = {pad_id}.'
            success = False
        else:
            message = f'Retrieved pad: {pads[0][1]}.'
    else:
        pads = db_select_all_pads(conn)
        message = "Retrieved all pads."
    conn.close()

    return {
        'message': message,
        'success': success,
        'pads': [
            {
                'id': pad[0],
                'name': pad[1],
                'profileId': pad[2],
                'thresholds': pad[5:]
            } 
            for pad in pads
        ]
    } 

# Database functions
def db_create_connection():
    """ create a database connection to a SQLite database """
    conn = None
    try:
        conn = sqlite3.connect('./profiles.db')
    except Error as e:
        print(e)
    return conn      

def db_initialize_profiles_table_if_empty(conn):
    query_create_profiles_table = """
        CREATE TABLE IF NOT EXISTS profiles (
            id integer PRIMARY KEY AUTOINCREMENT,
            name text NOT NULL,
            pin0 integer NOT NULL,
            pin1 integer NOT NULL,
            pin2 integer NOT NULL,
            pin3 integer NOT NULL
        ); 
    """
    # create projects table
    try:
        c = conn.cursor()
        c.execute(query_create_profiles_table)
        conn.commit()
        return True
    except Error as e:
        print(e)
        return False

def db_create_default_profile_if_empty(conn):
    profiles = db_select_all_profiles(conn)
    if profiles == []:
        thresholds_response = get_thresholds() 
        try:
            db_insert_new_profile(conn, 'Default', thresholds_response['values'])
            print(f"Created default profile: Default {thresholds_response['values']}")
            return True
        except Error as e:
            print(e)
            return False

def db_initialize_pads_table_if_empty(conn):
    query_create_pads_table = """
        CREATE TABLE IF NOT EXISTS pads (
            id integer PRIMARY KEY AUTOINCREMENT,
            name text NOT NULL,
            profileId integer NOT NULL,
            FOREIGN KEY(profileId) REFERENCES profiles(id)
        ); 
    """
    # create pads table
    try:
        c = conn.cursor()
        c.execute(query_create_pads_table)
        conn.commit()
        return True
    except Error as e:
        print(e)
        return False

def db_create_default_pad_if_empty(conn):
    pads = db_select_all_pads(conn)
    if pads == []:
        try:
            db_insert_new_pad(conn, 'Default Pad', 1)
            print(f"Created default pad: Default Pad (Profile ID: 1)")
            return True
        except Error as e:
            print(e)
            return False        

def db_insert_new_profile(conn, name, values):
    query_insert_new_profile = """
        INSERT INTO profiles (name, pin0, pin1, pin2, pin3)
            VALUES (?,?,?,?,?);
    """
    try:
        c = conn.cursor()
        c.execute(query_insert_new_profile, (name, values[0], values[1], values[2], values[3],))
        conn.commit()
        return c.lastrowid
    except Error as e:
        print(e)
        return 0

def db_select_profile_by_id(conn, profile_id):
    query_select_profile_by_id = '''SELECT id, name, pin0, pin1, pin2, pin3 FROM profiles WHERE id = ?'''
    rows = []
    try:
        c = conn.cursor()
        c.execute(query_select_profile_by_id, (profile_id,))

        rows = c.fetchall()
    except Error as e:
        print(e)
    return rows

def db_select_all_profiles(conn):
    query_get_all_profiles = '''SELECT * FROM profiles ORDER BY name'''
    rows = []
    try:
        c = conn.cursor()
        c.execute(query_get_all_profiles)

        rows = c.fetchall()
    except Error as e:
        print(e)
    return rows

def db_update_existing_profile(conn, profile_id, name, values):
    try:
        c = conn.cursor()
        if values == []:
            query_update_existing_profile_name = '''UPDATE profiles SET name = ?, WHERE id = ?;'''
            c.execute(query_update_existing_profile_name (name, profile_id,))
        else:
            query_update_existing_profiles = ''' 
            UPDATE profiles
                SET name = ?, pin0 = ?, pin1 = ?, pin2 = ?, pin3 = ?
                WHERE id = ?;
            '''
            c.execute(query_update_existing_profiles, (name, values[0], values[1], values[2], values[3], profile_id,))
        conn.commit()
        return True
    except Error as e:
        print(e)
        return False

def db_delete_profile(conn, profile_id):
    query_delete_profile = '''DELETE FROM profiles WHERE id = ?;'''
    try:
        c = conn.cursor()
        c.execute(query_delete_profile, (profile_id,))
        conn.commit()
        return c.rowcount
    except Error as e:
        print(e)
        return 0

def db_select_all_pads(conn):
    query_select_all_pads = '''
        SELECT * FROM pads PA
            JOIN profiles PR ON PR.id = PA.profileId;
    '''
    rows = []
    try:
        c = conn.cursor()
        c.execute(query_select_all_pads)
        
        rows = c.fetchall()
        return rows
    except Error as e:
        print(e)
    return rows

def db_select_pad_by_id(conn, pad_id):
    query_select_pad_by_id = '''
        SELECT * FROM pads PA
            JOIN profiles PR ON PR.id = PA.profileId
        WHERE PA.id = ?;
    '''
    rows = []
    try:
        c = conn.cursor()
        c.execute(query_select_pad_by_id, (pad_id))

        rows = c.fetchall()
    except Error as e:
        print(e)
    return rows

def db_insert_new_pad(conn, name, profile_id):
    query_insert_new_pad = """INSERT INTO pads (name, profileId) VALUES (?,?);"""
    try:
        c = conn.cursor()
        c.execute(query_insert_new_pad, (name, profile_id,))
        conn.commit()
        return True
    except Error as e:
        print(e)
        return False

def db_update_pad_by_id(conn, pad_id, profile_id):
    try:
        query_update_pad = '''
            UPDATE pads
                SET profileId = ?
                WHERE id = ?
        '''
        c = conn.cursor()
        c.execute(query_update_pad, (profile_id, pad_id,))
        conn.commit()
        return True
    except Error as e:
        print(str(e))
        return False
    
# Main function
if __name__ == '__main__':
    # Create connection to database
    conn = db_create_connection()
    if conn == None:
        print("Error establishing connection to profiles database.")
        exit()
    db_initialize_profiles_table_if_empty(conn)
    db_create_default_profile_if_empty(conn)
    db_initialize_pads_table_if_empty(conn)
    db_create_default_pad_if_empty(conn)
    # Close the connection, open as needed
    conn.close()

    # Run the server
    app.run(host=SERVER_HOST, port=SERVER_PORT)