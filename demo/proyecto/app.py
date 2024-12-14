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
        print(device_orientation)
    
    # You can now use device_orientation to modify your points logic
    # For example:
    points = [
        {
            'x': frame_dimensions['width']/3 + device_orientation['gamma'] * 10, 
            'y': frame_dimensions['height']/2 + device_orientation['beta'] * 10
        },
        # {
        #     'x': frame_dimensions['width'] + device_orientation['gamma'] * 10, 
        #     'y': frame_dimensions['height'] + device_orientation['beta'] * 10
        # },
        # {
        #     'x': device_orientation['gamma'] * 10, 
        #     'y': device_orientation['beta'] * 10
        # }
    ]

    return jsonify({
        'points': points
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)