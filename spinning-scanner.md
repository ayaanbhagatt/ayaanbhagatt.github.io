---
layout: default
permalink: /spinning-scanner/
---
{% include navigation.html %}
{% include eye-background.html %}

# simple spinning scanner

## process

For this project, I am working towards a simple spinning 2D scanner. This is the minimum testable prototype for a more complex 3D scanner that we will build towards later. In my previous arpeggiator project, I used an ultrasonic sensor to control how quickly the notes played. This time, the distance reading is the information I want to collect, and the idea is to turn the sensor with a stepper motor and pair each distance with the direction the sensor is facing.

![Arduino, motor driver, breadboard, and ultrasonic sensor connected for the scanner]({{ '/scanner-build.jpg' | relative_url }})

## putting it together

My setup uses an Arduino Uno, an ultrasonic sensor, a stepper motor, a motor driver board, a breadboard, and jumper wires. The sensor sits with the motor so it can face different directions as the motor turns. The driver board connects the motor to the Arduino and the ultrasonic sensor has separate connections.

![Front view of the ultrasonic sensor and stepper motor with the Arduino behind them]({{ '/scanner-detail.jpg' | relative_url }})

## how the program works

The program moves the motor one step at a time and keeps track of how many steps it has taken. After 100 steps, it pauses for 200 milliseconds and reverses direction:

if (currentStep >= sweepSteps) {
  currentStep = 0;
  direction = -direction;
  delay(200);
}

The program also checks whether 50 milliseconds have passed before taking another distance reading. It sends the angle and distance to the Serial Monitor at 9600 baud, with a tab between the two values. If the sensor does not receive an echo before the timeout, that reading is skipped. These pairs are the basic information needed for a 2D scan. The sketch currently only sends numbers which is pretty annoying, hopefully it will be able to return a graph soon enough. 

## technical tidbit

The ultrasonic sensor measures the time it takes for sound to travel to an object and return. My code converts that time into centimeters using:

float distance = duration * 0.0343 / 2.0;

The 0.0343 represents the approximate speed of sound in centimeters per microsecond. Dividing by two is necessary because sound travels to the object and back and I only want the distance to the object. The angle is estimated from the step count rather than measured by a separate position sensor. 

## next steps

Before using these readings as accurate I need to check the actual rotation against the angle printed by the program. The current sketch assumes 200 steps per revolution, so that needs to match the motor being used. I would also compare the sensor readings with an object at known distances and make the wiring more secure so they do not break as they currently do often.

## code

The code was partially assisted by AI.
[download code]({{ '/scanner_code.zip' | relative_url }})


