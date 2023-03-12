from flask import Flask, render_template, request
from flask_bootstrap import Bootstrap
from led_controls import *

app = Flask(__name__)
Bootstrap(app)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


@app.route("/", methods=["GET"])
def home():
    return render_template("button.html", title="Button", name="Jordan Bourdeau")