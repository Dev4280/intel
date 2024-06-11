from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

base_rates = {
    'Car': 0.65,
    'Light Commercial Vehicle': 1.05,
    'Bus or Truck (Two axles)': 2.20,
    'Three-axle commercial vehicles': 2.40,
    'Heavy Construction Machinery': 3.45,
    'Oversized Vehicles': 4.20
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate_toll', methods=['POST'])
def calculate_toll():
    data = request.get_json()
    distance = data['distance']
    vehicle_type = data['vehicle_type']
    toll = calculate_toll_cost(distance, vehicle_type)
    return jsonify({'toll': toll})

def calculate_toll_cost(distance, vehicle_type):
    base_rate = base_rates.get(vehicle_type, 0.65)  # Default to Car rate if vehicle type not found
    return distance * base_rate

if __name__ == '__main__':
    app.run(debug=True)
