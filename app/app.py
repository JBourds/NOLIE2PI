from flask import Flask, render_template, request
from flask_bootstrap import Bootstrap
from chartjs import *
# from lib.max30102 import *
# from lib.grove.grove import *
from led_controls import *
from database import *
from constants import *
app = Flask(__name__)
Bootstrap(app)

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html", name="Jordan Bourdeau")

@app.route("/test", methods=["GET"])
def polygraph():
    # Initialize the database
    database = Database(DATABSE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME)
    database.cur.execute("SELECT user_id, name FROM Users")
    user_records = database.cur.fetchall()
    return render_template("test.html", users=user_records, name="Jordan Bourdeau")

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)