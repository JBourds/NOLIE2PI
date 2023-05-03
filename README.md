# Raspberry Pi Polygraph (NOLIE2PI)

## Disclaimers: 
This project uses code taken from the following repositories. All credit for the GSR and MAX30102 sensor code goes to them and anyone else whose code they may have used.
    - GSR Sensor: https://github.com/Seeed-Studio/grove.py
    - MAX30102 Sensor: https://github.com/doug-burrell/max30102 and originally https://github.com/vrano714/max30102-tutorial-raspberrypi

## Demonstration Video
https://www.youtube.com/watch?v=LBQNEgR-zzg&ab_channel=JordanBourdeau

## Required Materials:
    - Raspberry Pi (Model 4 used originally)
        - Charging cable
        - Ethernet cable & necessary adapters to plug into computer
        - Jumper Cables (Female to Female if connecting directly to GPIO pins, Male to Female if using a breadboard)
    - Seeed Studio Grove Base Hat: https://wiki.seeedstudio.com/Grove_Base_Hat_for_Raspberry_Pi/
    - Seeed Studio GSR Sensor: https://wiki.seeedstudio.com/Grove-GSR_Sensor/
    - MAX30102 Pulse Oximeter: https://www.amazon.com/MAX30102-Detection-Concentration-Compatible-Arduino/dp/B07ZQNC8XP
        - Will need to solder the VIN, SDA, SCL, and GND pins. Original vrano714 library also required the INT pin
    - (Optional) Neoprene finger brace to secure MAX30102 sensor: https://www.amazon.com/dp/B01AFV2D08?psc=1&ref=ppx_yo2ov_dt_b_product_details
        - I poked the MAX30102 header pins through the neoprene and sealed one end with duct tape in order to get a secure hold and allow minimal ambient light to affect readings.

## Dependencies: 
Use the provided requirements.txt file with the following when in the same directory:
```pip install -r requirements.txt```
All other libraries (GSR and MAX30102) are included in the project. If you encounter any issues with conflicts, you may need to manually install packages using: ```pip install <package_name>```.


## Software Setup:
    - Install Raspberry Pi OS (or any other equivalent OS, this is just what I used here) to your Raspberry Pi from here: https://www.raspberrypi.org/downloads/.
    - Run the following command in the terminal to update all packages
        ```sudo apt update && sudo apt upgrade```
    - Install Apache Web Server following instructions from here: https://www.raspberrypi.com/documentation/computers/remote-access.html
    - Install Python3 and pip with the following command: 
        ```sudo apt install python3 python3-pip```
    - Verify the installation using the following commands: 
        ```python3 --version```
        ```pip3 --version```
    - Navigate into the directory where the "requirements.txt" file is in and run the following command to install all project dependencies. (Note: If there are any conflicts, you may need to manually install packages) 
        ```sudo pip install -r requirements.txt```  
        ```pip install <package_name>``` (In case you need to manually install packages)

## Setting up MariaDB
    - Run the following set of commands to enter MariaDB, create the database, and create all the tables:
```
    sudo mysql
    CREATE DATABASE nolie2pi;
    source nolie2pi_schema.sql;
```

    - Run these commands to create a user to access the database and grant them permissions:
```
    CREATE USER '<user's name>'@'localhost' IDENTIFIED BY '<input password here>';
    GRANT ALL PRIVILEGES ON nolie2pi.* TO '<user's name>'@'localhost';
    FLUSH PRIVILEGES;
    EXIT;
```

### constants.py
    - Create a file titled "constants.py" in the same directory as app.py with the following contents:
```
   DATABASE_USER = "<user's name>"
   DATABASE_PASSWORD = "<password>"
   DATABASE_HOST = "localhost"
   DATABASE_PORT = 3306
   DATABASE_NAME = "nolie2pi"
```

## Hardware Setup:
    - Install the Grove Base Hat to the Raspberry Pi.
    - Connect the GSR sensor to the "A0" port on the base hat (used by default)
    - Using the standard 40-pin Raspberry Pi 4 layout, create the following circuit:
        - VIN in pin 1
        - SDA in pin 3
        - SCL in pin 5
        - GND in pin 9
    - Check the connections using the command below. If done correctly, the GSR sensor will appear in the table as "08" and the MAX30102 sensor will appear as "57"
        ```i2cdetect -y 1``` 

## Running the Program:
    - The program is set to run locally on port 5000 from its IP address. Locate the IP address using the command below in the Linux terminal and copy the first number.
        ```hostname -I```
    - Navigate to the location of the "app.py" file and run it through the terminal with this command:
        ```python3 app.py```
    - In your computer's web browser, go to "http://<ip_address>:5000 (default port is 5000)
    - Voila! The program should work as intended and display/store the results from the locally hosted MariaDB database.

## Known Issues
There are known issues with how erratic the MAX30102 sensor can be in data collection. Future work on this project will likely revolve around improving data collection through some means of digital filtering or by changing to a higher quality, medical grade pulse oximeter. Otherwise, there are no known issues at this time. If you find one, please submit an issue request and as much information regarding the problem as possible.

## Points of Future Work
    * Improving/verifying data collected by the MAX30102 sensor and/or swapping to a different pulse oximeter with more reliable readings.
    * Incorporating a binary classification machine learning model to determine the pass/fail status of questions rather than the individual administering the test.