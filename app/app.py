import datetime

from constants import *
from DateTimeEncoder import DateTimeEncoder
from flask import Flask, jsonify, render_template, request
from flask_bootstrap import Bootstrap
from grove_gsr_sensor import GroveGSRSensor
import json
from lib.max_sensor import max30102
import logging
import mysql.connector
import time


app = Flask(__name__)
Bootstrap(app)

log = logging.getLogger('werkzeug')
log.disabled = True

# Global variables to control sensors

# Galvanic Skin Response / Skin Conductivity
read_gsr = False
# Heart Rate
read_hr = False
# Blood oxygen saturation levels
read_spo2 = False

# Debug switch
DEBUG_SQL = False


@app.route("/", methods=["GET"])
def home():
    return render_template("index.html", timestamp=datetime.datetime.now(), name="Jordan Bourdeau")

@app.route("/polygraph", methods=["GET"])
def polygraph():
    # Initialize the database
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    select_users = """SELECT user_id, name FROM Users;"""
    if globals()['DEBUG_FUNCTONS']:
        print(select_users)
    cursor.execute(select_users)
    user_records = cursor.fetchall()
    cursor.close()
    database.commit()
    database.close()

    return render_template("polygraph.html", users=user_records, timestamp=time.time(), name="Jordan Bourdeau")

@app.route("/tests", methods=["GET"])
def tests():
    # Initialize the database
    users = fetch_users()
    return render_template("tests.html", users=users, name="Jordan Bourdeau")

@app.route("/gsr_test", methods=["GET"])
def gsr_test():
    users = fetch_users()
    return render_template("gsr.html", users=users, name="Jordan Bourdeau")

# This function takes in a connection to a database and fetches all the test records in JSON format
def fetch_users():
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )

    cursor = database.cursor()
    # Select all users
    cursor.execute("SELECT user_id, name FROM Users ORDER BY name DESC;")
    if DEBUG_SQL:
        print(cursor.statement)
    user_records = cursor.fetchall()

    # create dictionary to store user data
    users = {}

    # loop through user records
    for user_record in user_records:
        user_id = user_record[0]
        user_name = user_record[1]

        # retrieve tests for this user
        select_tests = """SELECT test_id, date FROM Tests WHERE user_id = %s;"""
        args = (user_id,)
        cursor.execute(select_tests, args)
        if DEBUG_SQL:
            print(cursor.statement)
        test_records = cursor.fetchall()

        # create dictionary to store test data
        tests = {}

        # loop through test records
        for test_record in test_records:
            test_id = test_record[0]
            test_date = test_record[1]

            # retrieve questions for this test
            select_question = """SELECT question_id, question, pass FROM Test_Questions WHERE test_id = %s;"""
            args = (test_id,)
            cursor.execute(select_question, args)

            if DEBUG_SQL:
                print(cursor.statement)
            question_records = cursor.fetchall()

            # create list to store question data
            questions = []

            # loop through question records
            for question_record in question_records:
                question_id = question_record[0]
                question_text = question_record[1]
                question_pass = question_record[2]

                select_spo2 = """SELECT spo2_id, question_id, reading, timestamp FROM SPO2_Data WHERE question_id = %s;"""
                select_gsr = """SELECT gsr_id, question_id, reading, timestamp FROM GSR_Data WHERE question_id = %s;"""
                select_heart_rate = """SELECT hr_id, question_id, reading, timestamp FROM HR_Data WHERE question_id = %s;"""
                args = (question_id,)

                # retrieve data for this question
                cursor.execute(select_spo2, args)
                if DEBUG_SQL:
                    print(cursor.statement)
                bp_records = cursor.fetchall()

                cursor.execute(select_gsr, args)
                if DEBUG_SQL:
                    print(cursor.statement)
                gsr_records = cursor.fetchall()

                cursor.execute(select_heart_rate, args)
                if DEBUG_SQL:
                    print(cursor.statement)
                hr_records = cursor.fetchall()



                # create dictionary to store question data and data records
                question_data = {
                    "text": question_text,
                    "pass": question_pass,
                    "bp_data": [{"bp_id": bp_record[0],
                                 "question_id": bp_record[1],
                                 "reading": bp_record[2],
                                 "timestamp": str(bp_record[3])} for bp_record in bp_records],
                    "gsr_data": [{"gsr_id": gsr_record[0],
                                  "question_id": gsr_record[1],
                                  "reading": gsr_record[2],
                                  "timestamp": str(gsr_record[3])} for gsr_record in gsr_records],
                    "hr_data": [{"hr_id": hr_record[0],
                                 "question_id": hr_record[1],
                                 "reading": hr_record[2],
                                 "timestamp": str(hr_record[3])} for hr_record in hr_records]
                }

                # add question data to list of questions
                questions.append(question_data)

            # add test data to dictionary of tests
            tests[test_id] = {
                "date": str(test_date),
                "questions": questions
            }

        # add user data to dictionary of users
        users[user_id] = {
            "name": user_name,
            "tests": tests
        }

    cursor.close()
    database.close()

    return users

@app.route('/stop_reading', methods=['POST'])
def stop_reading():
    globals()['read_gsr'] = False
    globals()['read_hr'] = False
    globals()['read_spo2'] = False

    print("Stopped reading!")
    return ""

@app.route('/start_reading', methods=['POST'])
def start_reading():
    # Read in JSON data to parse the user and question text
    data = request.get_json()
    user_id = data['user_id']
    question = data['question']
    globals()['read_gsr'] = True
    globals()['read_hr'] = True
    globals()['read_spo2'] = True

    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    test_id = create_test(user_id)
    question_id = create_question(test_id, question)

    max30102_sensor = max30102.MAX30102()
    gsr_sensor = GroveGSRSensor(0)

    print("Started reading!")
    while globals()['read_gsr']:
        insert_gsr_data(gsr_sensor, question_id)
        # insert_heart_rate_data(database, max30102_sensor, question_id)
        # insert_sp02_data(database, max30102_sensor, question_id)
        time.sleep(1)

    return "Stopped reading"

@app.route("/create_user", methods=['POST'])
def create_user():
    data = request.get_json()
    user = data['user']
    return jsonify(user_id=create_user(user))

# Returns user_id of newly created user
def create_user(user):

    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()

    insert_user = """INSERT INTO Users (name) VALUES (%s);"""

    args = (user,)
    cursor.execute(insert_user, args)
    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    get_user_id = """SELECT user_id FROM Users WHERE name=%s ORDER BY user_id DESC LIMIT 1;"""
    cursor.execute(get_user_id, args)
    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    data = cursor.fetchall()

    cursor.close()
    database.commit()
    database.close()

    if data != []:
        # Return the user_id
        return data[0][0]
    else:
        return 0

@app.route("/delete_user", methods=['POST'])
def delete_user():
    data = request.get_json()
    user = data['user']
    return delete_user(user)

# Returns user_id of newly created user
def delete_user(user):

    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()

    # Attempt to delete the user
    delete_user = """DELETE FROM Users WHERE user_id=%s;"""
    args = (user,)
    cursor.execute(delete_user, args)

    # Verify the user is no longer there
    select_user = """SELECT name FROM Users WHERE user_id=%s;""";
    cursor.execute(select_user, args)

    # User was deleted successfully
    if cursor.fetchall() == []:
        delete_successful = True
    else:
        delete_successful = False

    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    cursor.close()
    database.commit()
    database.close()

    if delete_successful:
        return "Succeeded"
    else:
        return "Failed"


# Attempts to create a new test if one doesn't already exist
# Returns either the existing test_id or the newly returned one
def create_test(user_id):
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    date = datetime.date.today()

    # Check if test already exists for this user and date
    select_test = """SELECT test_id FROM Tests WHERE user_id = %s AND date = %s;"""
    args = (user_id, date,)
    cursor.execute(select_test, args)
    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    result = cursor.fetchone()
    if result is not None:
        # Test already exists, return its ID
        test_id = result[0]
    else:
        # Test does not exist, insert new test and return its ID
        insert_test = """INSERT INTO Tests (user_id, date) VALUES (%s, %s);"""
        args = (user_id, date,)
        cursor.execute(insert_test, args)
        if globals()['DEBUG_SQL']:
            print(cursor.statement)

        test_id = cursor.lastrowid

    cursor.close()
    database.commit()
    database.close()
    return test_id

# Creates a question for a test and then returns the question id
def create_question(test_id, question):
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    insert_question = """
    INSERT INTO Test_Questions (test_id, question, pass)
    VALUES(%s, %s, 1);
    """
    args = (test_id, question,)
    cursor.execute(insert_question, args)
    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    question_id = cursor.lastrowid
    cursor.close()
    database.commit()
    database.close()
    return question_id

# To be implemented
def insert_spo2_data(max30102_sensor, question_id):
    return


def insert_heart_rate_data(max30102_sensor, question_id):
    return

def insert_gsr_data(gsr_sensor, question_id):
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    timestamp = datetime.datetime.now()
    insert_gsr_data = """
    INSERT INTO GSR_Data (question_id, reading, timestamp)
    VALUES (%s, %s, %s);
    """
    args = (question_id, gsr_sensor.GSR, timestamp,)
    cursor.execute(insert_gsr_data, args)

    if globals()['DEBUG_SQL']:
        print(cursor.statement)


    cursor.close()
    database.commit()
    database.close()

@app.route('/gsr', methods=['GET'])
def update_gsr():
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )

    cursor=database.cursor()

    since_timestamp = request.args.get("since")
    print(since_timestamp)
    if since_timestamp is None:
        since_timestamp = "0"
    select_gsr_data = """SELECT gsr_id, question_id, reading, timestamp FROM GSR_Data WHERE timestamp > %s;"""
    args = (since_timestamp,)
    cursor.execute(select_gsr_data, args)
    if globals()['DEBUG_SQL']:
        print(cursor.statement)


    data = cursor.fetchall()
    print(data)

    cursor.close()
    database.commit()
    database.close()
    return json.dumps(data, cls=DateTimeEncoder)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)