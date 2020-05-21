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
        'padId': 0,
        'padName': '',
        'profileId': 0,
        'profileName': '',
        'thresholds': []
    }

    if pad_id:
        pads = db_select_pad_by_id(conn, pad_id)
        conn.close()
        if pads == []:
            return {
                'message': f'No pad found with id = {pad_id}.',
                'success': False,
                'pad': invalidPad
            }
        else:
            return {
                'message': 'Loaded current pad and profile.',
                'success': True,
                'pad': {
                    'padId': pads[0][0],
                    'padName': pads[0][1],
                    'profileId': pads[0][2],
                    'profileName': pads[0][3],
                    'thresholds': pads[0][5:]
                }
            } 
    return {
        'message': "Must supply a padId",
        'success': False,
        'pad': invalid_pad
    }

@app.route('/thresholds', methods=['POST'])
def set_thresholds():
    message = ''
    success = False
    try:
        values = ','.join(str(x) for x in request.get_json()['values']) + '\n'
        s.write(values.encode())
        
        s.write("thresholds".encode())
        serial_response = s.readline()
        
        message = "New Thresholds: " + serial_response.decode().strip(),
        success = True
    except Exception as e:
       message = str(e)
    
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
        return True
    except Error as e:
        print(e)
        return False

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
    query_get_all_profiles = '''SELECT * FROM profiles'''
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
            c.execute(query_update_existing_profile_name (str(name), profile_id,))
        else:
            query_update_existing_profiles = ''' 
            UPDATE profiles
                SET name = ?, pin0 = ?, pin1 = ?, pin2 = ?, pin3 = ?
                WHERE id = ?;
            '''
            c.execute(query_update_existing_profiles (str(name), values[0], values[1], values[2], values[3], profile_id,))
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
        return True
    except Error as e:
        print(e)
        return False

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