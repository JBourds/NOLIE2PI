import datetime

from constants import *
from datetime import date
from DateTimeEncoder import DateTimeEncoder
from flask import Flask, jsonify, render_template, request
from flask_bootstrap import Bootstrap
from grove_gsr_sensor import GroveGSRSensor
import json
from lib.max_sensor import hrcalc, max30102
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
# Heart rate and SPO2
read_max30102 = False

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
    users, tests, questions = fetch_todays_test_data()
    return render_template("gsr.html", users=users, tests=tests, questions=questions, name="Jordan Bourdeau")

def fetch_todays_test_data():
    # All data needed for test questions
    users = {}
    tests = {}
    questions = {}

    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )

    cursor = database.cursor()

    select_users = """SELECT Users.user_id, name 
                        FROM Users 
                        ORDER BY name DESC;"""
    select_tests = """SELECT test_id, name 
                        FROM Tests 
                        LEFT JOIN Users 
                        ON Users.user_id = Tests.user_id 
                        WHERE date = %s  
                        ORDER BY name DESC;"""
    select_questions = """SELECT question_id, Test_Questions.test_id, question, pass
                            FROM Test_Questions
                            LEFT JOIN Tests
                            ON Tests.test_id = Test_Questions.test_id
                            WHERE date = %s
                            ORDER BY test_id ASC"""

    args = (date.today(),)

    cursor.execute(select_users)
    user_records = cursor.fetchall()
    for user_record in user_records:
        users[user_record[0]] = {
            "name": user_record[1]
        }

    cursor.execute(select_tests, args)
    test_records = cursor.fetchall()
    for test_record in test_records:
        tests[test_record[0]] = {
            "name": test_record[1],
            "date": str(date.today())
        }

    cursor.execute(select_questions, args)
    question_records = cursor.fetchall()
    for question_record in question_records:
        questions[question_record[0]] = {
            "test_id" : question_record[1],
            "question_text" : question_record[2],
            "pass" : question_record[3]
        }


    cursor.close()
    database.commit()
    database.close()

    return users, tests, questions

# This function will collect every test conducted today
def fetch_todays_tests():
    tests = {}
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )

    cursor = database.cursor()
    select_tests = """SELECT test_id, name 
                        FROM Tests 
                        INNER JOIN  Users 
                        ON Users.user_id = Tests.user_id 
                        WHERE date = %s  
                        ORDER BY name DESC;"""
    args = (date.today(),)
    # Select all tests and the name of the associated user
    cursor.execute(select_tests, args)
    if DEBUG_SQL:
        print(cursor.statement)
    test_records = cursor.fetchall()

    # loop through user records
    for test_record in test_records:
        test_id = test_record[0]
        name = test_record[1]

        # add user data to dictionary of users
        tests[test_id] = {
            "name": name,
            "date": str(date.today())
        }

    cursor.close()
    database.commit()
    database.close()

    return tests

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

        # add user data to dictionary of users
        users[user_id] = {
            "name": user_name
        }

    cursor.close()
    database.commit()
    database.close()

    return users

@app.route('/stop_reading', methods=['POST'])
def stop_reading():
    globals()['read_gsr'] = False
    globals()['read_max30102'] = False

    print("Stopped reading!")
    return ""

@app.route('/start_reading', methods=['POST'])
def start_reading():
    # Read in JSON data to parse the user and question text
    data = request.get_json()
    question_id = data['question_id']
    globals()['read_gsr'] = True
    globals()['read_max30102'] = True

    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )

    max30102_sensor = max30102.MAX30102()
    gsr_sensor = GroveGSRSensor(0)

    print("Started reading!")
    while globals()['read_gsr']:
        insert_gsr_data(gsr_sensor.GSR, question_id)
        # Read
        red, ir = max30102_sensor.read_sequential()
        hr, hr_valid, spo2, spo2_valid = hrcalc.calc_hr_and_spo2(ir, red, 115, 95)

        print(hr)
        print(hr_valid)
        print(spo2)
        print(spo2_valid)

        # Only insert values if they are deemed valid
        if hr_valid:
            insert_heart_rate_data(hr, question_id)

        if spo2_valid:
            insert_spo2_data(spo2, question_id)

    return ""

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

@app.route('/create_test', methods=['POST'])
def create_test():
    data = request.get_json()
    user_id = data['user_id']
    return jsonify(test_id=create_test(user_id))

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

@app.route('/delete_test', methods=['POST'])
def delete_test():
    data = request.get_json()
    test_id = data['test_id']
    return jsonify(rows_deleted=delete_test(test_id))

def delete_test(test_id):
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    date = datetime.date.today()

    # Check if test already exists for this user and date
    delete_test = """DELETE FROM Tests WHERE test_id = %s AND date = %s;"""
    args = (test_id, date,)
    cursor.execute(delete_test, args)
    rows_deleted = cursor.rowcount
    if globals()['DEBUG_SQL']:
        print(cursor.statement)


    cursor.close()
    database.commit()
    database.close()
    return rows_deleted

@app.route('/create_question', methods=['POST'])
def create_question():
    data = request.get_json()
    test_id = data['test_id']
    question_text = data['question_text']
    return create_question(test_id, question_text)

# Creates a question for a test and then returns the question id as a JSON object
# By default, all questions are marked as pass
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
    return jsonify(question_id=question_id)

@app.route('/delete_question', methods=['POST'])
def delete_question():
    data = request.get_json()
    question_id = data['question_id']
    return jsonify(rows_deleted=delete_question(question_id))

def delete_question(question_id):
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    delete_question = """DELETE FROM Test_Questions WHERE question_id=%s"""
    args = (question_id,)
    cursor.execute(delete_question, args)
    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    rows_deleted = cursor.rowcount
    cursor.close()
    database.commit()
    database.close()

    return rows_deleted

@app.route("/reset_question", methods=['POST'])
def reset_question():
    data = request.get_json()
    question_id = data['question_id']

    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    delete_gsr = """DELETE FROM GSR_Data WHERE question_id=%s;"""
    delete_hr = """DELETE FROM HR_Data WHERE question_id=%s;"""
    delete_spo2 = """DELETE FROM SPO2_Data WHERE question_id=%s;"""
    args = (question_id,)

    rows_deleted = 0

    cursor.execute(delete_gsr, args)
    rows_deleted += cursor.rowcount
    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    cursor.execute(delete_hr, args)
    rows_deleted += cursor.rowcount
    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    cursor.execute(delete_spo2, args)
    rows_deleted += cursor.rowcount
    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    cursor.close()
    database.commit()
    database.close()

    return jsonify(rows_deleted=rows_deleted)

@app.route("/question_pass", methods=['POST'])
def question_pass():
    data = request.get_json()
    question_id = data['question_id']

    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    question_pass = """UPDATE Test_Questions SET pass=%s WHERE question_id=%s"""
    args = (1, question_id,)
    cursor.execute(question_pass, args)
    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    # Should be 1 on successful update
    rows_updated = cursor.rowcount

    cursor.close()
    database.commit()
    database.close()

    if rows_updated == 1:
        return jsonify(status="Succeeded")
    else:
        return jsonify(status="Failure")

@app.route("/question_fail", methods=['POST'])
def question_fail():
    data = request.get_json()
    question_id = data['question_id']

    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    question_fail = """UPDATE Test_Questions SET pass=%s WHERE question_id=%s"""
    args = (0, question_id,)
    cursor.execute(question_fail, args)
    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    # Should be 1 on successful update
    rows_updated = cursor.rowcount

    cursor.close()
    database.commit()
    database.close()

    if rows_updated == 1:
        return jsonify(status="Succeeded")
    else:
        return jsonify(status="Failure")


# To be implemented
def insert_spo2_data(spo2, question_id):
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    timestamp = datetime.datetime.now()
    insert_spo2_data = """
        INSERT INTO SPO2_Data (question_id, reading, timestamp)
        VALUES (%s, %s, %s);
        """
    args = (question_id, spo2/100.0, timestamp,)
    cursor.execute(insert_spo2_data, args)

    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    cursor.close()
    database.commit()
    database.close()


def insert_heart_rate_data(hr, question_id):
    database = mysql.connector.connect(
        host=DATABASE_HOST,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        database=DATABASE_NAME
    )
    cursor = database.cursor()
    timestamp = datetime.datetime.now()
    insert_hr_data = """
        INSERT INTO HR_Data (question_id, reading, timestamp)
        VALUES (%s, %s, %s);
        """
    args = (question_id, hr, timestamp,)
    cursor.execute(insert_hr_data, args)

    if globals()['DEBUG_SQL']:
        print(cursor.statement)

    cursor.close()
    database.commit()
    database.close()

def insert_gsr_data(gsr, question_id):
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
    args = (question_id, gsr, timestamp,)
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

@app.route('/hr', methods=['GET'])
def update_hr():
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
    select_hr_data = """SELECT hr_id, question_id, reading, timestamp FROM HR_Data WHERE timestamp > %s;"""
    args = (since_timestamp,)
    cursor.execute(select_hr_data, args)
    if globals()['DEBUG_SQL']:
        print(cursor.statement)


    data = cursor.fetchall()
    print(data)

    cursor.close()
    database.commit()
    database.close()
    return json.dumps(data, cls=DateTimeEncoder)

@app.route('/spo2', methods=['GET'])
def update_spo2():
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
    select_spo2_data = """SELECT spo2_id, question_id, reading, timestamp FROM SPO2_Data WHERE timestamp > %s;"""
    args = (since_timestamp,)
    cursor.execute(select_spo2_data, args)
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