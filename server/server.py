from flask import Flask, request, jsonify
import serial

# Constants
SERVER_PORT = 5555
SERVER_HOST = '0.0.0.0'

# Initialize app
app = Flask(__name__)

# Initialize serial
s = serial.Serial()
s.port = "COM3"
s.baudrate = 9600
s.setDTR(False)
s.open()


# Routes
@app.route('/')
def index():
    return { 'message': "Vincent's FSR sensitivity tools" }

@app.route('/thresholds', methods=['POST'])
def set_thresholds():
    try:
        values = ','.join(str(x) for x in request.get_json()['values']) + '\n'
        s.write(values.encode())
        
        s.write("thresholds".encode())
        serial_response = s.readline()
        return { 'message': "New Thresholds: " + serial_response.decode().strip() }
    except Exception as e:
        return jsonify({ 'message': str(e) })

@app.route('/thresholds', methods=['GET'])
def get_thresholds():
    try:
        s.write("thresholds".encode())
        serial_response = s.readline()
        return { 'message': "Current Thresholds: " + serial_response.decode().strip() }
    except Exception as e:
        return jsonify({ 'message': str(e) })

@app.route('/pressures', methods=['GET'])
def get_pressures():
    try:
        s.write("pressures".encode())
        serial_response = s.readline()
        return { 'message': "Current Pressures: " + serial_response.decode().strip() }
    except Exception as e:
        return jsonify({ 'message': str(e) })

# Run the server
app.run(host=SERVER_HOST, port=SERVER_PORT)