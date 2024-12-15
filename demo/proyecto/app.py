from flask import Flask, Response, render_template, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

frame_dimensions = {
    'width': None,
    'height': None
}

device_orientation = {
    'alpha': 0,
    'beta': 0,
    'gamma': 0
}
initial_orientation = {
    'alpha': 0,
    'beta': 0,
    'gamma': 0
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/set_dimensions', methods=['POST'])
def set_dimensions():
    data = request.json
    frame_dimensions['width'] = data.get('width')
    frame_dimensions['height'] = data.get('height')
    return jsonify({
        'status': 'success',
        'dimensions': frame_dimensions
    })

@app.route('/get_point', methods=['POST'])
def get_point():
    if frame_dimensions['width'] is None or frame_dimensions['height'] is None:
        return jsonify({'error': 'Dimensiones no establecidas'})
    
    # Get orientation data from request
    data = request.json
    if data and 'orientation' in data:
        device_orientation.update(data['orientation'])
        print(device_orientation['alpha'])

    # Save initial orientation on first request
    if not hasattr(app, 'initial_orientation'):
        initial_orientation = {
            'alpha': device_orientation['alpha'],
            'beta': device_orientation['beta'], 
            'gamma': device_orientation['gamma']
        }
    
    # You can now use device_orientation to modify your points logic
    # For example:
    new_y = (device_orientation['alpha'] - 90)/0.13
    new_y_2  = (device_orientation['alpha'] - 180)/0.13
    new_y_3 = (device_orientation['alpha'])/0.13
    points = [
        {
            'x': 200, 
            'y': new_y,
        },
        {
            'x': 200, 
            'y': new_y_2
        },
        {
            'x': 200, 
            'y': new_y_3
        }
    ]

    return jsonify({
        'points': points
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)