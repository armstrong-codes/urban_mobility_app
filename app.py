# main_app.py

from flask import Flask, Blueprint, jsonify, render_template, request
# import MySQLdb # Assuming you use a library like mysqlclient or PyMySQL

# --- Database Connection Logic (from your connection.py) ---
# For this script to work, you need a way to establish a database connection.
# Replace this placeholder with your actual connection code.
# Example using mysqlclient (pip install mysqlclient):
#
# import MySQLdb
#
# def get_db_connection():
#     try:
#         conn = MySQLdb.connect(
#             host="your_host",
#             user="your_username",
#             passwd="your_password",
#             db="your_database"
#         )
#         return conn
#     except MySQLdb.Error as e:
#         print(f"Error connecting to MySQL: {e}")
#         return None
#
# connection = get_db_connection()
#
# --- End of Placeholder ---

# For demonstration, let's create a mock connection object if you don't have one.
# REMOVE/REPLACE THIS MOCK SECTION WITH YOUR ACTUAL CONNECTION CODE.
class MockCursor:
    def execute(self, query):
        print(f"Executing query: {query}")
    def fetchall(self):
        # Return some dummy data to simulate a database response
        return [
            (1, 'VTS', '2024-10-15 09:00:00', '2024-10-15 09:15:00', 1, -73.98, 40.76, -73.99, 40.75, 'N', 900, '09:00:00', 'Tuesday', 10, 1.5, 6.0, 'Short')
        ]
    def close(self):
        print("Cursor closed.")
class MockConnection:
    def cursor(self):
        return MockCursor()
connection = MockConnection()
# --- End of Mock Section ---

# 1. Initialize the Flask App
app = Flask(__name__)

# 2. Check if the database connection was successful
if connection:
    print("Connection to the database was successful")
else:
    print("Connection to MySQL DB failed")
    exit(1)

# 3. Create Blueprints
home = Blueprint('home', __name__)
api = Blueprint('api', __name__)

# 4. Define Routes for the 'home' Blueprint
@home.route('/')
def index():
    # This route will render an HTML file from a 'templates' folder.
    # Make sure you have a 'templates' directory with an 'index.html' file in it.
    return render_template('index.html')

# 5. Define Routes for the 'api' Blueprint
@api.route('/')
def api_home():
    return "Welcome to the Urban Mobility App REST APIs!"

@api.route('/trips', methods=['GET'])
def get_data():
    """Fetches all trips from the database and returns them as JSON."""
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM trips LIMIT 1000")
    rows = cursor.fetchall()
    cursor.close()

    # Convert fetched data to a list of dictionaries for proper JSON representation
    trips = []
    for row in rows:
        trips.append({
            'trip_id': row[0],
            'vendor_id': row[1],
            'pickup_datetime': str(row[2]),
            'dropoff_datetime': str(row[3]),
            'passenger_count': row[4],
            'pickup_longitude': float(row[5]),
            'pickup_latitude': float(row[6]),
            'dropoff_longitude': float(row[7]),
            'dropoff_latitude': float(row[8]),
            'store_and_fwd_flag': row[9],
            'trip_duration': int(row[10]),
            'pickup_time': str(row[11]),
            'pickup_day_of_week': row[12],
            'pickup_month': int(row[13]),
            'trip_distance_km': float(row[14]),
            'trip_speed_kmh': float(row[15]),
            'trip_distance_category': row[16]
        })

    return jsonify(trips)

# 6. Register the Blueprints with the App
app.register_blueprint(home, url_prefix='/')
app.register_blueprint(api, url_prefix='/api')

# 7. Run the App
if __name__ == '__main__':
    # The app will run on http://127.0.0.1:3000
    app.run(debug=True, port=3000)