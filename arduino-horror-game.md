---
layout: default
title: arduino horror game
permalink: /arduino-horror-game/
---
{% include navigation.html %}
{% include eye-background.html %}

# arduino horror game

## plan

I went with a horror game where you creep up to a monster and hide when it turns around. I used the ultrasonic sensor for moving forward and backward, and the joystick for moving sideways. I wanted moving toward the sensor to feel like approaching the monster.

## process

I wired the joystick to A0/A1, its button to pin 7, and the ultrasonic sensor to pins 3 and 2. The Arduino uses `pulseIn(2, HIGH, 25000)` to measure how long the echo takes to return, then converts that into a distance measurement in cm.

```cpp
float distance = echoTime ? echoTime / 58.3 : -1;
```

The `-1` is for when no echo comes back, and it also reads the joystick with `analogRead()` and sends the readings together on one line, separated by commas.

Python reads those lines through PySerial and both programs use 115200 baud. The Python code splits each line with `.split(",")` and uses the values to move the player. The distance controls work like this

```python
dy = -1 if distance is not None and distance < NEAR_CM else 0
if distance is not None and distance > FAR_CM:
    dy = 1
```

A closer reading moves the player forward, a farther reading moves them backward, and the gap between the two makes u stop. I came up with the framework, logic, and game rules, but used AI to write most of the actual code and help fix problems. The first version was much too complicated, so I changed to one Python file, a simpler screen and no calibration.

<!-- Photo of wiring can be added here. -->

## result

The game has three levels. You collect the yellow item, then get to the door without being caught. The monster’s timing and the boxes change between attempts. One issue was that the joystick stopped working when the distance sensor lost its echo. I had that changed so missing distance readings only stop forward and backward movement.

<video controls playsinline preload="metadata" poster="{{ '/arduino-horror-poster.jpg' | relative_url }}" style="width:100%;max-width:420px;height:auto;" aria-label="Demo of the Arduino-controlled horror game">
  <source src="{{ '/arduino-horror-demo.mp4' | relative_url }}" type="video/mp4">
  <a href="{{ '/arduino-horror-demo.mp4' | relative_url }}">Download the demo video</a>.
</video>

[download demo video]({{ '/arduino-horror-demo.mp4' | relative_url }})

## code

[download Arduino and Python code]({{ '/arduino-horror-code.zip' | relative_url }})
