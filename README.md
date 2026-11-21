# The Abyss Listens

A deep-sea instrument made with p5.js. You lower a fishing line into dark water, and whatever the lure brushes against lights up, plays a note and goes into a field guide. The computer's real clock decides how deep the creatures are and which of them are alive.

- Group: Yandong, Leah, Sidney
- Module: DM3008 Generative Art, NTU, 2026
- Live piece: https://sngai002.github.io/Yandong-Leah-Sidney_FinalProject/TheAbyssListens/
- Video walkthrough: see the [Video](Video/) folder

## Repository layout

```
Yandong-Leah-Sidney_FinalProject/
  README.md            this file
  TheAbyssListens/     the code
    index.html         loads p5.js, Tone.js and sketch.js
    sketch.js          the whole piece, in one commented file
  Video/
    README.md          the link to the video walkthrough
```

## Creative motivation and intended use

### Why we made it

Most of the deep ocean is still unexplored. The greater part of the sea floor has never been mapped in detail, and very little of the deep water has ever been seen by people. We do know that most animals in the open ocean make their own light (bioluminescence), and that they usually flash when something disturbs the water around them. Every night a huge number of them rise from the deep to feed near the surface, then sink back down before dawn. This daily movement is called the diel vertical migration. It is the largest migration on Earth, and it happens out of sight.

We wanted a small, playful way into that unknown. In the piece you can't see what is down there until you go down and disturb the dark, and the lure is the only light you bring with you. Whatever it touches answers with light and sound, and the field guide slowly fills with what you found.

### Who it is for

Anyone with a browser and a mouse. You should be able to pick it up in a few seconds without instructions. It also runs on its own: if nobody touches it, the line drifts by itself, so the piece can keep playing as an installation in a room.

### What we want the audience to experience

We want people to feel like they are discovering something. Each period of the day (morning, afternoon, evening, night) has its own 25 species, 100 in all, so you can only fill the guide by coming back at different hours. The real time of day becomes part of the game.

The sea also changes with the clock. At noon the creatures sit deep and the sound is muffled. At night they have risen, the water is full and the sound opens up. The sky above the boat shows the real sun or moon, and the moon is drawn in its actual phase.

Finally, we wanted the audience to play it like an instrument. A slow lure drifts past things. A fast one scatters schools, sets off chains of light through the plankton and builds up a melody, and the only music you hear is made by what you touch.

## How we implemented it

### Overview

The piece is written in p5.js (global mode). All of the code is in one file, `TheAbyssListens/sketch.js`, split into numbered sections. Each section opens with a banner comment, and the file starts with a table of contents:

| Section | What it does |
| --- | --- |
| 1. Species | the 100 species, 7 body plans and 4 periods of the day |
| 2. Grid | a spatial grid for fast neighbour lookups |
| 3. Tide | turns the real clock into one value, `migration`: 0 at noon, 1 at midnight |
| 4. Fishing line | the fishing line, a Verlet rope, and its lure |
| 5. Anatomy | how each creature is grown from a seed and drawn |
| 6. Creatures | how creatures move, school, migrate and react; the whole population |
| 7. Sea | sky, sun and moon, the water surface, the dive camera, marine snow, depth haze |
| 8. Sound | one Tone.js voice per body plan and the effects chain |
| 9. Interface | the title, clock, field guide, help, start screen and sound toggle |
| 10. Main | the global state, `setup()`, the draw order, diving and the sound switch |
| 11. Input | the mouse, the keys and changes to the window size |

Values worth changing are marked in the comments with `// ***`.

Every frame, the clock, sound and line update first. Then the sky, water, creatures, fog and line are drawn through the sea's camera, which is zoomed in above water and shows the whole sea once you are under it. The interface is drawn last, on top.

### Generative techniques, by class week

| Topic | Where it is used | Why |
| --- | --- | --- |
| Modulo (week 3) | which body segments carry a light (`i % lightEvery`), stripes, alternating light and fang sizes, a hash of each species name, round-robin voices, the 12-hour sun and moon arc | repeating patterns along a body, and cycles in time |
| Waves (week 4) | the water surface (a sum of three sines), the eel's travelling sine body, tails, jelly bells, the jelly's pulse, a pulse of light round a jelly's rim, the day curve | living, periodic motion |
| Randomness and noise (week 5) | body outlines (noise read around a circle so the shape closes without a seam), a shared Perlin flow field that acts as the ocean current, marine snow, wandering headings | organic variety, and a current that moves neighbours together |
| Autonomous agents (week 6) | separation, alignment and cohesion for fish (same species only), steering as "desired minus velocity" capped at a maximum force, dragons turning toward fish, every creature fleeing a moving line | schools with no leader, and weight in every turn |
| Cybernetics and emergence (week 7) | each note raises a `sound.energy` value that loosens the schools, so busy music scatters the fish, which thins the music; a plankton strike lights 3 neighbours, each lights 2, each lights 1, as a wave of light | a negative feedback loop between sound and motion, and global patterns from local rules |
| Fractals and recursion (week 9) | a seeded `branch()` grows the dragon's antler lure, fin rays and the squid's arm skirt; one celestial body on a sine arc, sun by day and moon by night, with the crescent carved by a sky-coloured disc (from the living forest) | self-similar detail that stays still between frames |
| L-systems (week 10) | jelly tentacles use the plant rule `F -> F[+F]F[-F]F`; the sea pen uses our own rule `A -> G[+FL][-FL]G[+FL][-FL]A`, `L -> FL`, where `G` is a stem step and `L` a polyp light | branching growth, where the rule also decides where the creature glows |

### Keeping 100 species varied but cheap

We didn't draw 100 creatures. There are seven grow functions, one per body plan. A word in a species name picks a kind ("hatchet" makes a tall, flat fish), a hash of the name narrows every gene range to its own slice, and a random seed picks the individual inside that slice. Six species also have a handmade override.

Each body is grown under `randomSeed` and `noiseSeed`, so the same seed always grows the same animal and nothing flickers between frames.

The still parts of each body are drawn once at birth into a small `createGraphics` canvas. After that, each frame costs one `image()` per creature plus the parts that move or glow. The glowing parts are drawn with `blendMode(ADD)`, so overlapping lights add up the way real light does.

### Other techniques

A spatial grid splits the canvas into 60 px cells, so each creature only checks the creatures in the 3 x 3 cells around it instead of all of them.

The fishing line is a Verlet rope: 26 points held together by distance constraints, with some drag and weight, so it bends and trails like real line in water.

For the migration, each body plan has a day depth range and a night depth range. The clock value blends between the two, and a capped pull keeps every creature near its depth. When the clock crosses into a new period, the old set of species sinks out of sight over about 20 seconds while the new set rises from below, a few births per frame.

The camera is a zoom and focus transform. Above water it shows the boat close up, and during the dive it widens to the whole sea. We use its exact inverse to map the mouse into the world, so the lure stays under the pointer at any zoom.

### Sound

The sound is made with Tone.js. Each body plan has its own voice. Fish get an FM pluck and jellies a slow AM swell. The sea pen has a bowed pad whose filter opens as the light climbs its stem, and the dragon plays a five-note chord. Squid make a watery burst with a chime, and eels bend up into their note.

All the notes sit on an A minor pentatonic scale, so many strikes at once still sound like one chord, and bigger species play lower. The signal goes through a filter, an echo, a reverb and a limiter. The filter is muffled by day and opens at night, and each period of the day has its own echo and reverb settings. A low brown-noise rumble means the sea is never completely silent.

### Libraries

- p5.js 1.11.11 for all the drawing, Perlin noise, seeded randomness and off-screen graphics.
- Tone.js 15.1.22 for synthesis, effects and audio timing. We picked it over p5.sound for its FM and AM synths, filter envelopes and effects chain, and because it schedules notes precisely on the audio clock. We only load one audio library so that two of them don't compete for the browser's audio context.

### Hand tracking: built, then removed

An earlier version also let you steer the lure with your hand. It used ml5.js handPose (Google's MediaPipe hand model, running locally in the browser). A 1 Euro filter smoothed the fingertip, a short prediction covered the detection delay, a pinch jigged the line, and holding your hand low or high dived and surfaced. It worked, but the camera added a visible lag to the lure and lowered the frame rate. The piece depends on a lure that reacts straight away, so we took hand tracking out and kept the mouse.

## How successful it was

### What works well

The sea feels different at different hours, and coming back at another time does show you different life. Schools, chain reactions and the feedback loop between music and movement all come from simple local rules, and you can see them clearly on screen. Because of the pentatonic scale and the separate voices, sweeping the lure through a crowd sounds musical. The piece also keeps playing by itself when it is left alone.

### Challenges

The first was performance. Depending on screen size there are about 600 to 820 creatures on screen at once. To keep that moving we used the spatial grid, cached sprites and shared glow sprites, wrote the movement loop with plain numbers instead of vector objects, and skipped sensing and drawing for anything below the screen. New creatures are born a few per frame so a period change doesn't cause a hitch.

Variety was the other side of the same problem. We couldn't draw 100 species by hand, so the variety had to come from names, hashes and seeds on top of seven body plans.

Browsers block sound until the user clicks or presses a key, so the sound starts from the "Start" button, the sound toggle or the M key. The voices are then built a few at a time, so turning the sound on never freezes a frame.

Hand tracking is the one we couldn't fix. Filtering and prediction didn't remove enough of the camera and model delay, so we cut the feature.

### What we would change with more time

- Let predators actually catch prey, so the food chain has consequences.
- Try hand tracking again with detection running off the main thread, so it doesn't cost frame rate.

## Credits and own work

### Libraries

| Library | Version | Licence | Link |
| --- | --- | --- | --- |
| p5.js | 1.11.11 | LGPL-2.1 | https://p5js.org |
| Tone.js | 15.1.22 | MIT | https://tonejs.github.io |
| ml5.js (earlier version only, removed) | 1.4.0 | MIT | https://ml5js.org |

The two libraries in the final piece load from jsDelivr. The project uses no external data files and no APIs. The only outside input is the computer's clock.

### References cited in the code

Each one is credited in the comments of the `sketch.js` section named here.

- Grid: "bin-lattice spatial subdivision" from _The Nature of Code_, ch. 5 (Daniel Shiffman), and Craig Reynolds, "Interaction with Groups of Autonomous Characters" (2000). Our own implementation.
- Anatomy: Daniel Shiffman, The Coding Train, "Polar Perlin Noise Loops", for reading noise around a circle so an outline closes without a seam.
- Anatomy: Przemyslaw Prusinkiewicz and Aristid Lindenmayer, _The Algorithmic Beauty of Plants_ (1990), for the rule `F -> F[+F]F[-F]F` and the bracket turtle.
- Creatures: the Week 6 boids template (Ashley Hi), which is based on Daniel Shiffman's Flocking example for p5.js.
- Sea: the sin-fract hash used for the stars, from _The Book of Shaders_ (Patricio Gonzalez Vivo).
- Sea: the reference new moon (6 January 2000, 18:14 UTC) and synodic month (29.530588 days) for the moon phase, from Jean Meeus, _Astronomical Algorithms_.
- Sound: the sin-and-fract hash that gives each species its pitch nudge, a common one-liner from GLSL shaders (origin unknown).
- Removed hand tracking: the 1 Euro filter, Géry Casiez, Nicolas Roussel and Daniel Vogel, CHI 2012, https://gery.casiez.net/1euro/.

### Class templates

- Week 6, Autonomous Agents: the boids template (separation, alignment, cohesion, seek, steering).
- Week 9, Fractals and Recursion: the living tree and living forest (`branch()` recursion, `randomSeed` to stop flicker, one celestial body on a sine arc with a carved crescent).
- Week 10, L-Systems: the plant demo (the rule `F -> F[+F]F[-F]F` and the turtle).
- Week 5, Randomness and Noise: the Perlin noise flow field.

### Our earlier work

The boids with grid neighbours, the spatial grid, the energy feedback loop and the Tone.js sound chain were first built for a previous idea of ours that explored the haze situation in Singapore. We adapted them for this piece. The grid code is unchanged, the flocking was rewritten for seven body plans, and the sound engine got new voices.

### How we split the work

Each of us first came up with a different concept from one shared prompt: a canvas of particles, boids, and a trigger or tool (such as a line) to interact with them. As a group we chose this concept and built it together. We used Claude Code as an AI coding tool. We split the piece into modules and ran separate agents in parallel, each owning one file and never editing another's, and then merged them into the final piece.

## How to run it

Open https://sngai002.github.io/Yandong-Leah-Sidney_FinalProject/TheAbyssListens/ in a desktop browser.

To run it from this folder instead, serve the `TheAbyssListens` folder with any static web server and open its address in a desktop browser. The libraries load from jsDelivr, so you need an internet connection either way.

### Controls

Use a desktop browser with a mouse. Keys work with or without Shift.

| Input | What it does |
| --- | --- |
| "Start" button | start the sound and dive |
| "Start a new log" | clear the field guide for a new player |
| Mouse on the surface | lowers the lure into the water below the boat |
| Hold the pointer in the bottom 15 % of the screen for 1.5 s | dive without starting the sound |
| Mouse under water | steer the lure; a fast lure disturbs creatures, and touching one adds it to the field guide |
| Sound toggle (under the clock) or M | turn the sound on, mute and unmute |
| Hold the lure at the top edge for 1 s, or B | go back up to the boat |
| G | open or close the field guide |
| I | show or hide the help |
| T | show or hide the clock |
