from flask import Flask, Response, render_template, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

frame_dimensions = {
    'width': None,
    'height': None
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

@app.route('/get_point')
def get_point():
    if frame_dimensions['width'] is None or frame_dimensions['height'] is None:
        return jsonify({'error': 'Dimensiones no establecidas'})
    
    # Generar 3 puntos aleatorios dentro de las dimensiones del frame
    points = [
        {'x': frame_dimensions['width']/3, 'y': frame_dimensions['height']/2},
        {'x': frame_dimensions['width'], 'y': frame_dimensions['height']},
        {'x': 0, 'y': 0}
    ]

    return jsonify({
        'points': points
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)