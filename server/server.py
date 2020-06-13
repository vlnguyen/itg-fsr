from flask import Flask, request
from flask_cors import CORS
import serial
import sqlite3
from sqlite3 import Error

# Constants
SERVER_PORT = 5555
SERVER_HOST = '0.0.0.0'
P1_PORT = "COM5"
P2_PORT = "COM3"

# Initialize app
app = Flask(__name__)
CORS(app)

# Initialize serial
serial_p1 = serial.Serial()
serial_p1.port = P1_PORT
serial_p1.baudrate = 9600
serial_p1.setDTR(False)
serial_p1.open()

# If not using two pads, comment these initializations out
serial_p2 = serial.Serial()
serial_p2.port = P2_PORT
serial_p2.baudrate = 9600
serial_p2.setDTR(False)
serial_p2.open()


# Routes
@app.route('/', methods=['GET'])
def index():
    conn = db_create_connection()
    p1_pad = db_select_pad_by_id(conn, 1)
    p2_pad = db_select_pad_by_id(conn, 2)
    profiles = db_select_all_profiles(conn)
    conn.close()

    return {
        'message': 'Loaded current pad and profile.',
        'success': True,
        'p1': {
            'id': p1_pad[0][0],
            'name': p1_pad[0][1],
            'profile': {
                'id': p1_pad[0][3],
                'name': p1_pad[0][4],
                'values': p1_pad[0][5:]
            }
        },
        'p2': {
            'id': p2_pad[0][0],
            'name': p2_pad[0][1],
            'profile': {
                'id': p2_pad[0][3],
                'name': p2_pad[0][4],
                'values': p2_pad[0][5:]
            }
        },
        'profiles': [
            {
                'id': profile[0],
                'name': profile[1],
                'values': profile[2:]
            }
            for profile in profiles
        ],
    }


@app.route('/thresholds', methods=['POST'])
def set_thresholds():
    message = ''
    success = False

    req_data = request.get_json()
    pad_side = int(req_data['padSide'])

    if pad_side == 1 or pad_side == 2:
        try:
            if pad_side == 1:
                serial = serial_p1
            else:
                serial = serial_p2
            # Serial input to the controller to apply new thresholds
            values = ','.join(str(x) for x in request.get_json()['values']) + '\n'
            serial.write(values.encode())
            # Serial call to get the current thresholds back
            serial.write("thresholds".encode())
            serial_response = f'New Thresholds: {serial.readline().decode().strip()}'

            # Update the pad to associate with given profile
            conn = db_create_connection()
            success = db_update_pad_by_id(conn, pad_side, req_data['profile']['id'])
            conn.close()

            if success:
                message = f"Applied P{pad_side} profile: {req_data['profile']['name']} ({serial_response})"
            else:
                message = f'Could not apply profile to pad. Check current thresholds.'
        except Exception as e:
            message = str(e),
            success = False
    else:
        message = 'Must specify pad side 1 or 2.'

    return {
        'message': message,
        'success': success
    }


@app.route('/thresholds', methods=['GET'])
def get_thresholds():
    message = ''
    values = []
    success = False

    pad_side = int(request.args.get('padSide'))
    if pad_side == 1 or pad_side == 2:
        try:
            if pad_side == 1:
                serial = serial_p1
            else:
                serial = serial_p2
            serial.write("thresholds".encode())
            s_resp = serial.readline().decode().strip()
            message = f"P{pad_side} Thresholds: {s_resp}"
            values = [int(x) for x in s_resp.split(',')]
            success = True
        except Exception as e:
            message = str(e)
    else:
        message = 'Must specify pad side 1 or 2.'

    return {
        'message': message,
        'values': values,
        'success': success
    }


@app.route('/pressures', methods=['GET'])
def get_pressures():
    message = ''
    success = False
    
    pad_side = int(request.args.get('padSide'))
    if pad_side == 1 or pad_side == 2: 
        try:
            if pad_side == 1:
                serial = serial_p1
            if pad_side == 2:
                serial = serial_p2
            serial.write("pressures".encode())
            message = f'P{pad_side} Pressures: {serial.readline().decode().strip()}'
            success = True
        except Exception as e:
            message = str(e)
    else:
        message = 'Must specify pad side 1 or 2.'

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
        if not profiles:
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


def db_create_default_profiles_if_empty(conn):
    profiles = db_select_all_profiles(conn)
    if not profiles:
        try:
            values = [200, 200, 200, 200]
            db_insert_new_profile(conn, 'P1 Default', values)
            print(f"Created default profile: P1 Default {values}")
            db_insert_new_profile(conn, 'P2 Default', values)
            print(f"Created default profile: P2 Default {values}")
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


def db_create_default_pads_if_empty(conn):
    pads = db_select_all_pads(conn)
    if not pads:
        try:
            db_insert_new_pad(conn, 'P1 Pad', 1)
            print(f"Created default pad: P1 Pad (Profile ID: 1)")
            db_insert_new_pad(conn, 'P2 Pad', 2)
            print(f"Created default pad: P2 Pad (Profile ID: 2)")
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
        if not values:
            query_update_existing_profile_name = '''UPDATE profiles SET name = ?, WHERE id = ?;'''
            c.execute(query_update_existing_profile_name, (name, profile_id,))
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
        c.execute(query_select_pad_by_id, (pad_id,))

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
    if conn is None:
        print("Error establishing connection to profiles database.")
        exit()
    db_initialize_profiles_table_if_empty(conn)
    db_create_default_profiles_if_empty(conn)
    db_initialize_pads_table_if_empty(conn)
    db_create_default_pads_if_empty(conn)
    # Close the connection, open as needed
    conn.close()

    # Run the server
    app.run(host=SERVER_HOST, port=SERVER_PORT)
