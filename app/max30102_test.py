from lib.max30102 import hrcalc, max30102

m = max30102.MAX30102()

# 100 samples are read and used for HR/SpO2 calculation in a single loop
while True:
    red, ir = m.read_sequential()
    print(hrcalc.calc_hr_and_spo2(ir, red))