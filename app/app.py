from chartjs import *
from constants import *
from database import *
from flask import Flask, render_template, request
from flask_bootstrap import Bootstrap
import json
# from lib.max30102 import *
# from lib.grove.grove import *
import time

app = Flask(__name__)
Bootstrap(app)

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html", timestamp = time.time(), name="Jordan Bourdeau")

@app.route("/polygraph", methods=["GET"])
def polygraph():
    # Initialize the database
    database = Database(DATABSE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME)
    database.cur.execute("SELECT user_id, name FROM Users")
    user_records = database.cur.fetchall()

    return render_template("polygraph.html", users=user_records, timestamp = time.time(), name="Jordan Bourdeau")

@app.route("/tests", methods=["GET"])
def tests():
    # Initialize the database
    database = Database(DATABSE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME)
    tests = fetch_tests(database)
    return render_template("polygraph.html", tests=tests, timestamp=time.time(), name="Jordan Bourdeau")

# This function takes in a connection to a database and fetches all the records in a JSON format
# users { key: user_id
#   tests: { [ key: test_id
#       date: ""
#       questions: { key: question_id [
#                   text: ""
#                   pass: ""
#                   gsr_data: { key: gsr_id
#                       reading: "", timestamp: ""
#                   }
#                   hr_data: { key: gsr_id
#                       reading: "", timestamp: ""
#                   }
#                   bp_data: { key: gsr_id
#                       reading: "", timestamp: ""
#                   }
#       ]}
#   ]}
# }
def fetch_tests(db_connection):
    # Select all users
    db_connection.cur.execute("SELECT user_id, name FROM Users")
    user_records = db_connection.cur.fetchall()

    # create dictionary to store user data
    users = {}

    # loop through user records
    for user_record in user_records:
        user_id = user_record[0]
        user_name = user_record[1]

        # retrieve tests for this user
        db_connection.cur.execute("SELECT test_id, date FROM Tests WHERE user_id = ?", (user_id,))
        test_records = db_connection.cur.fetchall()

        # create dictionary to store test data
        tests = {}

        # loop through test records
        for test_record in test_records:
            test_id = test_record[0]
            test_date = test_record[2]

            # retrieve questions for this test
            db_connection.cur.execute("SELECT question_id, question, pass FROM Questions WHERE test_id = ?", (test_id,))
            question_records = db_connection.cur.fetchall()

            # create list to store question data
            questions = []

            # loop through question records
            for question_record in question_records:
                question_id = question_record[0]
                question_text = question_record[2]
                question_pass = question_record[3]

                # retrieve data for this question
                db_connection.cur.execute("SELECT reading, timestamp FROM GSR_Data WHERE question_id = ?", (question_id,))
                gsr_records = db_connection.cur.fetchall()

                db_connection.cur.execute("SELECT reading, timestamp FROM HR_Data WHERE question_id = ?", (question_id,))
                hr_records = db_connection.cur.fetchall()

                db_connection.cur.execute("SELECT reading, timestamp FROM BP_Data WHERE question_id = ?", (question_id,))
                bp_records = db_connection.cur.fetchall()

                # create dictionary to store question data and data records
                question_data = {
                    "text": question_text,
                    "pass": question_pass,
                    "gsr_data": [{"reading": gsr_record[2], "timestamp": str(gsr_record[3])} for gsr_record in
                                 gsr_records],
                    "hr_data": [{"reading": hr_record[2], "timestamp": str(hr_record[3])} for hr_record in hr_records],
                    "bp_data": [{"reading": bp_record[2], "timestamp": str(bp_record[3])} for bp_record in bp_records]
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

        # convert data to JSON
        data = json.dumps(users)

        return data

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)