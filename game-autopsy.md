---
layout: default
permalink: /game-autopsy/
---
{% include navigation.html %}
{% include eye-background.html %}

# assembly game autopsy

## process

For this project, I looked inside borough, the 3D city game (GTA clone) I made in ARM64 assembly for my Mac. I drive a gold car to gold markers to complete deliveries. Deliveries earn money, restore health, and increase the wanted level, which the code calls 'heat'. Police chase me, and crashes reduce health. I followed how pressing a key (input) turns into movement and changes on screen (output).

## reading the (difficult to decipher) code

borough.s sets up the window, keyboard input, and timer. core.inc has movement and game rules, render.inc draws the scene, and data.inc holds graphics data, text and tables. Registers are small storage spaces inside the processor. w9 refers to the lower 32 bits of register x9, which holds 64 bits. This game generally uses x names for addresses and w names for whole numbers. Their roles change, as w9 can hold cash in one routine and health in another. ADDR finds a memory address, ldr reads from it, and str saves to it. Brackets mean to access memory and # marks a constant number.

## the game window

This uses a native Mac window, so there is no HTML canvas. The drawing area is an NSOpenGLView. Its starting dimensions are in data.inc

```asm
LdWidth:
.double 1120
.p2align 3
LdHeight:
.double 720
```

_main in borough.s uses these values to create a 1120 by 720 drawing area in Mac screen points. Changing them changes the window size, while the city stays the same size. The renderer adjusts the perspective to fit.

## what the game stores

_state stores held keys, position, direction, cash, health, heat, delivery count, car status and pause status. Car positions and speeds live separately in _cars. These are some field definitions from borough.s

```asm
.equ ST_KEYS, 0
.equ ST_X, 12
.equ ST_Z, 16
.equ ST_CASH, 28
.equ ST_HEALTH, 32
```

These numbers are byte offsets, not starting values. ST_CASH, 28 means cash is 28 bytes into _state. _game_init in core.inc starts cash at $500 and health at 100. For example, "mov w10, #500" puts 500 into a register, then "str w10, [x9, #ST_CASH]" saves it as cash, with x9 pointing to _state. Position and speed use a scale of 256, allowing fractional movement with whole numbers: 128 represents half a unit.

## the game loop

A Mac timer calls _tick about every 0.0167 seconds, rougly 60 updates per second. _tick calls _game_step and requests a redraw. If ST_PAUSED is nonzero, "cbnz w9, Lstep_done" skips the simulation. Otherwise, _game_step runs these calls

```asm
bl _update_player
bl _update_traffic
bl _update_police
bl _update_mission
```

bl calls a routine, which returns when finished. Each update moves the player, traffic and police, checks deliveries and health, and reduces cooldowns. The player moves before the delivery check, so it checks the new position. _draw and _render then draw the current game state.

## how a key press changes the game

_key_down and _key_up in borough.s handle Mac keyboard events, like browser event listeners. W/S move, A/D turn, Shift sprints, Space brakes, E enters or exits cars, F fires, H adds heat, P pauses and R resets. _key_mask turns movement keys into bit flags. W is 1 and D is 8, so both held together make 9. In _key_down

```asm
ADDR x9, _state
ldr w10, [x9, #ST_KEYS]
orr w10, w10, w0
str w10, [x9, #ST_KEYS]
```

w0 holds the new key flag. ldr reads the existing flags, orr adds the new bit without removing other held keys, and str saves them. Releasing a key uses bic to clear its bit. The driving routine checks flags

```asm
tst w20, #KEY_W
b.eq Ldrive_reverse
add w22, w22, #20
```

w20 holds the keys and w22 holds speed. tst checks for W. If it is absent, b.eq skips the acceleration, and otherwise add increases speed by 20 each update. The game uses speed and heading to calculate a proposed position, then checks it before saving.

## collisions and losing

_is_blocked checks whether that proposed position overlaps a building or leaves the city. Buildings use rectangular boundaries expanded for the player's size. In this excerpt, w0/w1 are local X/Z coordinates, and w3/w4 are the lower/upper boundaries

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

cmp compares two values. b.lt jumps if the coordinate is below the lower boundary, and b.gt jumps if it is above the upper one. Either coordinate outside means clear, and both inside means blocked. ret returns 0 or 1 to the driving routine. A blocked move triggers "cbnz w0, Ldrive_collision", so the new position is rejected. The car bounces back and loses six health when its damage cooldown allows it. _game_step also checks

```asm
ldr w9, [x19, #ST_HEALTH]
cmp w9, #0
b.gt Lstep_done
bl _bust
```

If health is above zero, b.gt skips _bust. Otherwise the player respawns in the starting car with 100 health, no heat, and a $200 penalty, with cash kept at zero or above. Police can also trigger _bust when capture reaches 120. There is no final victory screen since deliveries are repeatable and infinite kinda.

## deliveries and scoring

Cash acts as the score. _update_mission requires the player to be in a car and near the current marker. It calculates the absolute X and Z differences, then checks their sum

```asm
add w9, w9, w10
mov w10, #(45 * 256)
cmp w9, w10
b.ge Lmission_done
```

b.ge ends the check if the distance is greater than or equal to 45 units, scaled by 256. Below that limit, the delivery succeeds and runs

```asm
ldr w9, [x19, #ST_CASH]
add w9, w9, #250
str w9, [x19, #ST_CASH]
```

ldr reads cash, add increases it by $250, and str saves the result. Starting at $500, this saves $750. Changing a register alone would not update the saved cash. The delivery also restores up to 15 health, capped at 100, adds heat, and advances to the next marker, preventing repeated payment at the same spot.

## a small change

In a separate copy of core.inc, the delivery reward was doubled, and the on-screen labels were updated

```asm
// before
add w9, w9, #250
// after
add w9, w9, #500
```

The prediction was $1,000 after one delivery from $500 starting cash, instead of $750. A controlled code test ran the actual assembly game loop at the delivery position. The original produced $750 and the changed version produced $1,000. This was a code test, not a manually played session. Both still required a car, advanced the marker once, and kept the $200 respawn penalty. Changing the number in add changed the reward while keeping the delivery rule the same.

## presentations

After seeing different people's presentations, especially the raw c of patrick peng's game or the new and unique twist of tetris that sam yang added, I am now thinking that maybe it would be best to change course on this project and use a language other then assembly to maybe make a similar game and fully(FULLY) understand how it works. That way I can actually make it fun and interesting rather than just being novel. My goal now is to make a simpler game in a language like python or c++ as a unique twist on an older game similar to patrick and sam.

## code

The code was made by chatgpt-6.1 sol on extra high(highly recommend).
