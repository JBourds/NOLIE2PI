from grove_gsr_sensor import GroveGSRSensor

# Initialize the GSR sensor to its default channel (0)
sensor = GroveGSRSensor(0)

def get_gsr_data():
    data = sensor.GSR
    return data



