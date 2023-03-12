import RPi.GPIO as GPIO
import time

def turn_on_led(pin):
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.HIGH)

def turn_off_led(pin):
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.LOW)

def cycle_led(seconds, pin):
    turn_on_led(pin)
    time.sleep(seconds)
    turn_off_led(pin)
