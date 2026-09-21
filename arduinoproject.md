---
layout: default
permalink: /arduinoproject/
---

# arduino gesture controlled arpeggiator

## process

For this project, I wanted to build on my knowledge of synthesizers and drum machines. I had already worked with passive buzzers and knew how to use tone() to make different pitches, so I wanted to go beyond just playing individual notes and make something that could be used as an actual instrument.

My final device is an Arduino controlled **arpeggiator**. A joystick chooses chords and key, an ultrasonic sensor changes the speed of the arpeggio, a rotary encoder changes the pattern, with four passive buzzers playing the notes.

---

## rotary encoder

The main new component I added was a **rotary encoder**. At first I thought it was a potentiometer because it looked like a knob, but I noticed that it had pins labeled CLK, DT, SW, +5V, and GND, and that it clicked into steps when I turned it.

I learned that unlike a potentiometer, a rotary encoder does not give one analog voltage based on its position. Instead, the CLK and DT pins send digital pulses in slightly different sequences. The Arduino can compare those signals to tell whether I turned the knob clockwise or counterclockwise.

I used the How To Mechatronics rotary encoder Arduino tutorial and information from the KY-040 Rotary Encoder documentation to fully understand how it works.

---

## starting

My first version focused on four passive buzzers. I tried playing four notes at the same time to create chords. I then added a joystick so each of its eight directions could select a different chord.

The joystick has two analog outputs, X and Y. The Arduino reads both values and checks whether they are high, low, or near the middle. Combining the X and Y values lets the program distinguish between eight directions.

For example:

```cpp
if (up && right) {
  return 1;
}
```

This means that if both the upward and right conditions are true, the program knows the joystick is being pushed diagonally up-right.

Clicking the joystick cycles through different scales such as C major, D major, E minor, G major, A harmonic minor, and E Phrygian dominant.

---

## things that didn't work

Originally, I tried having the four buzzers play all four notes of a chord at the same time.

It technically worked, but it sounded strange and messy because the passive buzzers were producing several square waves together.

I also originally made the ultrasonic sensor directly affect the chords and later tried making it control volume. Neither worked very well. Small changes in ultrasonic readings caused unpredictable changes, and changing the buzzer volume did not create much of a noticeable effect.

Instead, I changed the design so the notes were arpeggiated meaning the notes of the chord play one after another.

This sounded much cleaner.

I then gave the ultrasonic sensor the job of controlling how quickly the arpeggio moves between notes.

A hand close to the sensor makes the notes play quickly, while moving farther away slows them down.

---

## adding the rotary encoder

Once the basic arpeggiator worked, I wanted a way to change how the chord was arpeggiated without adding a lot more buttons.

The rotary encoder was useful because one knob can scroll forward and backward through several options.

I created patterns such as:

* **Up:** `1 → 2 → 3 → 4`
* **Down:** `4 → 3 → 2 → 1`
* **Up/Down:** `1 → 2 → 3 → 4 → 3 → 2`
* **Outside-In:** `1 → 4 → 2 → 3`
* **Inside-Out:** `2 → 3 → 1 → 4`
* **Skip:** `1 → 3 → 2 → 4`
* **Random:** random tones

Turning the encoder changes between these patterns.

Pressing the encoder resets the pattern to the normal upward arpeggio.

---

## How the Program Works

The program separates the instrument into different jobs:

The joystick direction chooses the chord, the joystick click changes the musical scale, the rotary encoder changes the arpeggio pattern, the
ultrasonic sensor changes arpeggio speed, and the passive buzzers produce sound.

The scales are stored as numbers representing semitones above C.

For example:

```cpp
{0, 2, 4, 5, 7, 9, 11}
```

represents C major:

```text
C D E F G A B
```

The program turns these values into actual frequencies using:

```cpp
261.63 * pow(2.0, semitone / 12.0);
```

`261.63 Hz` is middle C in this case.

Every increase of 12 semitones doubles the frequency, which creates the same note one octave higher.

To create a chord, the program takes every other note from the selected scale.

For C major, this creates:

```text
C → E → G → B
```

which is a C major seventh chord.

The program stores these four frequencies, and then the selected arpeggio pattern determines what order they are played in.

---

# Technical Tidbit

## How a Rotary Encoder Knows Which Way It Is Turning

The part I found most interesting was that the rotary encoder does not directly tell the Arduino "clockwise" or "counterclockwise."

Instead, it has two digital signals called CLK and DT.

As I turn the knob, both signals switch between HIGH and LOW, but they do not switch at exactly the same time.

If the knob is turned the opposite way, the order of the signals changes.

My code checks both signals, and if the signals are in one relationship, the program moves forward through the arpeggio patterns.

If they are in the opposite relationship, it moves backward.

The physical clicks I feel while turning the knob are called detents.

The rotary encoder also includes a pushbutton, which is why it has an SW pin.

Another important issue with mechanical controls is debouncing. The metal contacts can rapidly switch between HIGH and LOW for a few milliseconds when they touch. My program ignores changes that happen too close together so one physical movement is less likely to be counted multiple times.

### Sources

* [How To Mechatronics - Rotary Encoder with Arduino](https://howtomechatronics.com/tutorials/arduino/rotary-encoder-works-use-arduino/)
* [KY-040 Rotary Encoder Datasheet / Documentation](https://components101.com/sites/default/files/component_datasheet/KY-04-Rotary-Encoder-Datasheet.pdf)

---

# Peer Support

While I was working, Patrick Peng helped me with making sure my idea actually made sense and was solid. I was having trouble determining how to handle the ultrasonic sensor, and he suggested I use it for something simple like controlling amplitude.

This helped because over complicating it would've made the device too finicky and annoying to use.

---

# Use Case Reflection

A system like this could be the starting point for an analog synth with arpeggio functionality.

Instead of needing to press many piano keys or guitar strings, someone could control harmony with a joystick and control musical effects with simple hand movements.

To make my current prototype actually useful as an instrument, I would replace the piezo buzzers with proper audio output, possibly using MIDI or a synthesizer module.

I would also add a display so the player could see:

* the current scale
* the current chord
* the arpeggio pattern
* the tempo

instead of needing to use the Arduino Serial Monitor.

The skill I would rely on most if I continued developing this project would debugging inputs.

Most of my problems were physical sensors giving noisy or unexpected values.

Learning to use the Serial Monitor, adjust thresholds and artificially smooth sensor readings helped me make responsive controls.

