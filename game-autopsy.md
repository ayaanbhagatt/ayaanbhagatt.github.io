---
layout: default
permalink: /game-autopsy/
---
{% include navigation.html %}
{% include eye-background.html %}

# assembly game autopsy

## process

For this project, I looked inside borough, the 3D city game (GTA clone) I made in ARM64 assembly for my Mac. The player starts in a gold car and drives to gold markers to complete deliveries. I can also get out, walk, sprint, and enter other cars. Deliveries earn money, restore some health, and increase the wanted level, which the code calls 'heat'. Police chase the player while there is heat. Crashes reduce health. Getting caught or reaching zero health resets the player to the starting car and takes away $200.

I wanted to understand how the almost cryptic code creates these rules. So, I followed what happens from pressing a key(input) to changing speed, calculating a position, checking for a collision, and saving(output).

## reading the (difficult to decipher) code

The program is split into four files. borough.s sets up the window, keyboard input, and timer. core.inc has the movement and game rules. render.inc draws the scene, and data.inc holds the graphics data, text and tables.

Registers are small storage spaces inside a processor. The code puts numbers/bits into them while doing calculations. A name like w9 refers to a 32 bit value while x9 refers to a full 64 bit register. This game generally uses x names for memory addresses and w names for whole number game values.

The register names do not have permanent meanings. w9 might hold cash in one part of the code and health in another.

For example, "ADDR x9, _state" puts the address of the game's state memory into x9. ADDR is a shortcut defined at the top of the program. Then "ldr w10, [x9, #ST_CASH]" reads the cash value from that memory into w10. I know its difficult to wrap your head around, rest assured its confusing for most people. The brackets mean to access memory at the address inside them. x9 tells the processor where to look. ST_CASH tells it how far into that memory to go. w10 holds the number found there.

## the game window

This game uses a native Mac window instead of an HTML canvas. The drawing area is an NSOpenGLView, which lets the program display OpenGL graphics.

```asm
LdWidth:
.double 1120
.p2align 3
LdHeight:
.double 720
```

The dimensions are stored in data.inc. The label LdWidth is followed by ".double 1120", and LdHeight is followed by ".double 720". These define a drawing area of 1120 by 720 Mac screen points. A Retina display can use more physical pixels than that. In borough.s, the _main routine creates the drawing view and window. "F d2, LdWidth" loads the width, and "F d3, LdHeight" loads the height. F is another shortcut defined in the program. These values become arguments for the Mac method that creates the view. "bl _objc_msgSend" calls that method. Changing those numbers changes the window dimensions. It does not change how large the city is, because the city's boundaries are defined elsewhere. The renderer measures the actual drawing area and adjusts the perspective to its width and height.

## what the game stores

The main state lives in a memory area called _state. It keeps track of held keys, whether the player is in a car, the active car, X and Z position, facing direction, heat, cash, health, delivery count, capture progress, and pause status. Car positions and speeds are stored separately in _cars.

```asm
.equ ST_KEYS, 0
.equ ST_INCAR, 4
.equ ST_ACTIVE, 8
.equ ST_X, 12
.equ ST_Z, 16
.equ ST_HEADING, 20
.equ ST_HEAT, 24
.equ ST_CASH, 28
.equ ST_HEALTH, 32
```

The names are defined near the top of borough.s. For example, ".equ ST_CASH, 28" means that the cash field is 28 bytes from the start of _state. It does not mean the player has $28. Each of these fields takes four bytes, so the offsets increase by four.

```asm
ADDR x9, _state
mov w10, #1
str w10, [x9, #ST_INCAR]
mov w10, #300
lsl w10, w10, #8
str w10, [x9, #ST_X]
str w10, [x9, #ST_Z]
mov w10, #100
str w10, [x9, #ST_HEALTH]
mov w10, #500
str w10, [x9, #ST_CASH]
```

The _game_init routine in core.inc sets the starting values. "mov w10, #500" puts 500 into w10. "str w10, [x9, #ST_CASH]" then saves that number as the player's cash. The same pattern sets health to 100 and sets ST_INCAR to 1, meaning the player starts inside a car. The starting X and Z positions are both 300, but the code stores them using a scale of 256. It puts 300 into w10 and runs "lsl w10, w10, #8". Shifting left eight bits multiplies the number by 256, so the saved value is 76,800. This scale lets the game represent fractional movement with whole numbers. A stored value of 256 means one simulation unit, and 128 means half a unit. These are distances used by the program, not measurements in meters.

## the game loop

The Mac timer calls _tick about every 0.0167 seconds, roughly 60 updates per second. _tick calls _game_step and then requests a redraw. The exact update rate can vary.

```asm
ADDR x19, _state
ldr w9, [x19, #ST_PAUSED]
cbnz w9, Lstep_done
ldr w9, [x19, #ST_TICKS]
add w9, w9, #1
str w9, [x19, #ST_TICKS]
```

At the beginning of _game_step, "ldr w9, [x19, #ST_PAUSED]" reads the pause flag. The next instruction is "cbnz w9, Lstep_done". cbnz means to jump if the value is not zero. If the pause flag is 1, the routine jumps to the end and skips the simulation changes. If the game is running, it reads ST_TICKS, adds one, and saves it. This counts how many simulation updates have happened.

```asm
bl _update_player
bl _update_traffic
bl _update_police
bl _update_mission
```

The routine then calls _update_player, _update_traffic, _update_police, and _update_mission. bl is the instruction used to call each routine. Each routine returns to the instruction after its call when it finishes. The order matters. The player moves before the delivery check happens, so the check uses the updated position. The loop also reduces countdowns. A crash can set a damage cooldown to 40. Each update subtracts one until the countdown reaches zero. At 60 updates per second, that lasts about two-thirds of a second. It prevents a single contact from removing health every update. Drawing happens through _draw and _render. The simulation calculates positions and other values. The renderer uses those values to draw the city, vehicles, player, minimap, and status display.

## how a key press changes the game

The _key_down and _key_up routines in borough.s handle keyboard events. _main connects these routines to the Mac's keyboard callbacks, which serve the same purpose as event listeners in a browser game. W and S move forward and backward. A and D turn. Shift sprints on foot, Space brakes the car, and E enters or exits a car. F fires on foot, H adds heat, P pauses, R resets, and Escape quits. When a key is pressed, _key_down asks for its Mac key code. _key_mask turns movement keys into the flags the game uses. For W, "cmp w0, #13" compares the key code with 13. "b.eq Lmask_w" jumps to the W section if they match. The Up arrow also jumps to that section. The W section puts KEY_W into w0 and returns. KEY_W is defined as 1. S is 2, A is 4, and D is 8. These powers of two occupy different places in a binary number, so the program can remember several held keys in one value. For example, W is 0001 in binary and D is 1000. Holding both produces 1001, which is 9.

```asm
ADDR x9, _state
ldr w10, [x9, #ST_KEYS]
orr w10, w10, w0
str w10, [x9, #ST_KEYS]
```

The instruction "orr w10, w10, w0" combines the new key flag with the flags already held. It turns on the new bit without removing the others. The result is saved into ST_KEYS. Releasing a key uses bic to clear that key's bit.

```asm
tst w20, #KEY_W
b.eq Ldrive_reverse
add w22, w22, #20
```

The movement routine reads ST_KEYS into w20. "tst w20, #KEY_W" checks whether the W bit is present. If the test produces zero, "b.eq Ldrive_reverse" skips the acceleration. If W is held, "add w22, w22, #20" adds 20 to the car's stored speed. Starting from rest, three unobstructed updates with W held give stored speeds of 20, 40, and 60. The key press records that W is held, and the loop keeps applying acceleration while that flag stays on.

## how movement works

```asm
mov w9, #1280
cmp w22, w9
csel w22, w22, w9, lt
```

The car's maximum forward speed is 1280 in stored units. The code puts 1280 into w9, compares the current speed in w22 with it, and runs "csel w22, w22, w9, lt". csel chooses between two values based on a condition. Here, it keeps the current speed if it is less than the limit. Otherwise, it chooses 1280. A calculated speed of 1300 therefore becomes 1280. Dividing by the scale of 256 gives five simulation units per update. When neither W nor S is held, the code multiplies speed by 250 and shifts right eight bits. For positive speed, this approximately means old speed times 250 divided by 256. That fraction is a little less than one, so the car slows gradually. A stored speed of 1280 becomes 1250 after that calculation. The heading also uses numbers. A full turn has 256 heading steps. Heading 0 points along positive X, 64 along positive Z, 128 along negative X, and 192 along negative Z.

```asm
ADDR x9, _cos_table
ldr w10, [x9, x23, lsl #2]
mul w10, w10, w22
asr w10, w10, #8
```

The movement code looks up the heading in _cos_table and _sin_table. These tables tell it how much movement should go along each axis. In "ldr w10, [x9, x23, lsl #2]", x23 holds the heading. Shifting it left two bits multiplies it by four, which finds the right entry because each table value takes four bytes. The table value is multiplied by speed and shifted right eight bits to remove the table's extra scale. At heading 0, the cosine entry is 256. With stored speed 1280, the calculation is 256 times 1280 divided by 256, giving 1280 of X movement. That is five simulation units. The matching sine calculation gives zero Z movement. The game adds these movements to the old position. This produces a proposed position, which is checked for collisions before it becomes the saved position.

## collision detection

The car's proposed X and Z coordinates are placed into w0 and w1. The code puts 18 into w2 for the car's footprint size and calls _is_blocked. That routine returns 0 for a clear position and 1 for a blocked position. "cbnz w0, Ldrive_collision" jumps to the collision response if the result is not zero. If the position is clear, the next str instructions save the proposed coordinates into the car's record. The city uses repeating blocks 300 simulation units wide. _is_blocked divides the position by 300 and removes the whole blocks to find the position within the current block. For X equal to 400, integer division gives 1. The msub instruction then calculates 400 minus 1 times 300, leaving local X equal to 100. It does the same for Z. The blocked building area normally runs from local coordinate 60 to 240. The code subtracts the footprint size from the lower boundary and adds it to the upper one. For a car with size 18, the blocked range becomes 42 to 258. This accounts for the car's size instead of checking only its center.

```asm
cmp w0, w3
b.lt Lclear
cmp w0, w4
b.gt Lclear
cmp w1, w3
b.lt Lclear
cmp w1, w4
b.gt Lclear
Lblocked: mov w0, #1
    ret
Lclear: mov w0, #0
    ret
```

The comparisons include "cmp w0, w3" followed by "b.lt Lclear", and "cmp w0, w4" followed by "b.gt Lclear". These ask whether local X is below the lower boundary or above the upper boundary. The same comparisons check local Z. If either coordinate is outside the rectangle, the position is clear. If both are inside, it is blocked. For example, global position 400, 400 becomes local position 100, 100. Both coordinates are inside the blocked range. Position 310, 400 becomes 10, 100, which is clear because X is below 42. The routine also checks the outer world boundaries. When the car hits a building, "neg w22, w22" reverses its speed. The code then divides that speed by three. This makes the car bounce back more slowly. If the damage cooldown is zero, the crash also subtracts six health and starts a new cooldown.

## deliveries and scoring

Cash acts as the score. _update_mission first reads ST_INCAR and uses cbz to finish immediately if it is zero. This means walking to the marker does not complete a delivery. There are eight delivery destinations. The routine reads the delivery count and runs "and w9, w9, #7". This keeps the lowest three binary bits and gives an index from 0 to 7. After delivery count 8, it selects destination 0 again, so the route repeats. Each destination has two four-byte coordinates. "add x10, x10, x9, lsl #3" multiplies the selected index by eight and adds that to the start of the destination table. This finds the correct pair of coordinates. The routine subtracts the player's coordinates from the destination's coordinates. After each subtraction, it compares the difference with zero and uses cneg to make it positive if it was negative. This gives the absolute distance along that axis. Being 20 units before or after the destination gives the same difference of 20.

```asm
add w9, w9, w10
mov w10, #(45 * 256)
cmp w9, w10
b.ge Lmission_done
```

The X and Z differences are added together and compared with 45 times 256. If the total is greater than or equal to that limit, "b.ge Lmission_done" ends the check. Otherwise, the delivery succeeds. The rule is that the absolute X difference plus the absolute Z difference must be less than 45 simulation units. Differences of 30 and 10 add to 40, which succeeds. Differences of 30 and 20 add to 50, which does not.

```asm
ldr w9, [x19, #ST_CASH]
add w9, w9, #250
str w9, [x19, #ST_CASH]
```

Once a delivery succeeds, the code increases the delivery count and updates cash. "ldr w9, [x19, #ST_CASH]" reads the current cash. "add w9, w9, #250" adds the reward. "str w9, [x19, #ST_CASH]" saves the result. Starting with $500, those instructions read 500, calculate 750, and save 750. The addition changes the temporary register. str is what makes the new value stay in the game's memory. The delivery also restores up to 15 health without exceeding 100 and adds heat. Increasing the delivery count selects the next destination, so staying at the old marker does not keep paying the player.

## losing and respawning

```asm
ldr w9, [x19, #ST_HEALTH]
cmp w9, #0
b.gt Lstep_done
bl _bust
```

At the end of _game_step, the code reads health and runs "cmp w9, #0". "b.gt Lstep_done" finishes the update if health is greater than zero. Otherwise, "bl _bust" calls the respawn routine. Police can also call _bust when the capture meter reaches 120. _bust returns the player to the starting car, restores health to 100, and clears heat and capture progress.

```asm
ldr w10, [x9, #ST_CASH]
subs w10, w10, #200
csel w10, w10, wzr, gt
str w10, [x9, #ST_CASH]
```

For the penalty, it reads cash and runs "subs w10, w10, #200". This subtracts $200 and records the comparison flags. "csel w10, w10, wzr, gt" keeps the result if it is positive and chooses zero otherwise. With $500, the result is $300. With $150, subtraction gives minus $50, so the game saves $0. This prevents negative cash. There is no final victory screen. Completing deliveries is the game's repeatable success condition.

## a small change

The deliberate change was doubling the delivery reward. In a separate copy of core.inc, "add w9, w9, #250" was changed to "add w9, w9, #500". The two on-screen reward labels were also changed to say $500.

```asm
// before
add w9, w9, #250

// after
add w9, w9, #500
```

The prediction was that one delivery from $500 starting cash would produce $1,000 instead of $750. A controlled test ran the actual assembly game loop with the same starting cash and delivery position in both versions. The original version ended with $750 after one delivery. The modified version ended with $1,000. These results came from a code test rather than a manually played session. Both versions still required a car, completed one delivery, and advanced to the next destination. Staying at the previous marker did not produce another payment. The modified version also kept the $200 respawn penalty. This change helped connect the instructions to a game rule. ldr gets the old value, add calculates the new value, and str saves it. Changing the number in the middle instruction changes the reward while keeping the delivery check the same.

## code

The code was assisted by AI.
