---
layout: default
permalink: /spinning-scanner/
---
{% include navigation.html %}
{% include eye-background.html %}

# simple spinning scanner

## process

For this project, I am working towards a simple spinning 2D scanner. This is the minimum testable prototype for a more complex 3D scanner that we will build towards later.

In my arpeggiator project, I used an ultrasonic sensor to control how quickly the notes played. This time, the distance reading is the actual information I want to collect. The idea is to turn the sensor with a stepper motor and pair each distance with the direction the sensor is facing.

![Arduino, motor driver, breadboard, and ultrasonic sensor connected for the scanner]({{ '/scanner-build.jpg' | relative_url }})

## putting it together

My setup uses an Arduino Uno, an ultrasonic sensor, a stepper motor, a motor driver board, a breadboard, and jumper wires.

The sensor sits with the motor so it can face different directions as the motor turns. The driver board connects the motor to the Arduino, while the ultrasonic sensor has separate trigger and echo connections.

In my code, pins 8, 9, 10, and 11 control the motor through the driver. Pin 5 is the trigger pin and pin 4 is the echo pin.

![Front view of the ultrasonic sensor and stepper motor with the Arduino behind them]({{ '/scanner-detail.jpg' | relative_url }})

## how the program works

The program moves the motor one step at a time and keeps track of how many steps it has taken. After 100 steps, it pauses for 200 milliseconds and reverses direction.

```cpp
if (currentStep >= sweepSteps) {
  currentStep = 0;
  direction = -direction;
  delay(200);
}
```

Changing the direction between 1 and -1 makes the motor move back and forth. The code maps each sweep to an angle from 0 to 180, then from 180 back to 0.

The program also checks whether 50 milliseconds have passed before taking another distance reading. It sends the angle and distance to the Serial Monitor at 9600 baud, with a tab between the two values. If the sensor does not receive an echo before the timeout, that reading is skipped.

These pairs are the information needed for a 2D scan. The sketch currently sends the numbers; it does not draw a map yet.

## technical tidbit

The ultrasonic sensor measures the time it takes for sound to travel to an object and return. My code converts that time into centimeters using:

```cpp
float distance = duration * 0.0343 / 2.0;
```

The 0.0343 represents the approximate speed of sound in centimeters per microsecond. Dividing by two matters because the sound travels to the object and back, while I only want the distance to the object.

The angle is different. It is estimated from the step count, rather than measured by a separate position sensor. Setting the angle to 180 in the program does not automatically mean the motor has physically turned 180 degrees.

## next steps

Before using these readings as an accurate map, I need to check the actual rotation against the angle printed by the program. The current sketch assumes 200 steps per revolution, so that value and the sweep length need to match the motor being used.

I would also compare the sensor readings with an object at known distances and make the mounting and wiring more secure so they do not shift during a sweep.

Another small improvement is the output format. The header says `angle,distance`, but the readings use tabs. I would make those consistent before importing the data into a plotting program.

This first version connects motor movement with distance measurements. Once the sweep and readings are reliable, the next step is plotting the points in 2D, then working towards collecting multiple layers for a 3D scan.

## code

The code was partially assisted by AI.

[download code]({{ '/scanner_code.zip' | relative_url }})

The ZIP contains the Arduino sketch in its folder. Extract it and open `arduinocode/arduinocode.ino` in the Arduino IDE.

[view the sketch](https://github.com/ayaanbhagatt/ayaanbhagatt.github.io/blob/main/arduinocode.ino)
