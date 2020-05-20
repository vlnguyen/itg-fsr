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
@app.route('/')
def index():
    return { 
        'message': "Vincent's FSR sensitivity tools",
        'success': True
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

        message = "Current Thresholds: " + s.readline().decode().strip()
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
        message = s.readline().decode().strip()
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

# Database functions
def db_create_connection():
    """ create a database connection to a SQLite database """
    conn = None
    try:
        conn = sqlite3.connect('./profiles.db')
    except Error as e:
        print(e)
    return conn      

def initialize_database_schema_if_empty(conn):
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
    

# Main function
if __name__ == '__main__':
    # Create connection to database
    conn = db_create_connection()
    if conn == None:
        print("Error establishing connection to profiles database.")
        exit()
    initialize_database_schema_if_empty(conn)

    # Close the connection, open as needed
    conn.close()

    # Run the server
    app.run(host=SERVER_HOST, port=SERVER_PORT)