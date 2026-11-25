# The Abyss Listens

Yandong, Leah, Sidney. DM3008 Generative Art, NTU, Final Project, 2026.

Live piece: https://sngai002.github.io/Yandong-Leah-Sidney_FinalProject/TheAbyssListens/

Video walkthrough: see the [Video](Video/) folder.

## Synopsis

Most of the deep ocean has never been seen by anyone. Most of the animals down there make
their own light, and they flash when something disturbs the water around them. Every night
a huge number of them rise from the deep to feed near the surface and sink back before
dawn. This is the diel vertical migration, the largest migration on Earth, and it happens
out of sight.

We wanted a small, playful way into that. You lower a fishing line into dark water, and
the lure is the only light you bring. Whatever it brushes against lights up, plays a note
and goes into a field guide. All 100 creatures are real deep sea animals, from the giant
ostracod to the vampire squid, and each entry in the guide links to its Wikipedia page, so
the game can lead you on to the real thing.

The computer's real clock decides who is down there. At noon the creatures sit deep and
the sound is muffled. At night they have risen, the water is full and the sound opens up.
Each period of the day has its own 25 species, so the guide only fills if you come back at
other hours. The periods are a game rule, but biology decided who goes where: strong
migrators such as lanternfish, krill and firefly squid come up in the evening and at night,
and deep residents such as anglerfish, gulper eels, the vampire squid and dumbo octopuses
fill the morning and afternoon. The sky above the boat shows the real sun or moon, and the
moon is drawn in its actual phase.

It is for anyone with a browser and a mouse, and it should take a few seconds to pick up.
We also wanted it to play like an instrument. A slow lure drifts past things. A fast one
scatters schools, sets off chains of light through the plankton and builds up a melody,
and the only music you hear is made by what you touch. Left alone, the line drifts by
itself, so the piece can keep going in a room as an installation.

## How to interact

Use a desktop browser with a mouse. Keys work with or without Shift.

| Do this | What happens |
| --- | --- |
| Click Start | Turns the sound on and sinks the camera through the surface. |
| Hold the pointer in the bottom of the screen for 1.5 s | Dives without starting the sound. |
| Move the mouse under water | Steers the lure. A fast lure disturbs creatures, and touching one adds it to the guide. |
| Click "Read about it on Wikipedia" | In the field guide, opens the selected species' page in a new tab. |
| Hold the lure at the top edge for 1 s, or `B` | Back up to the boat. The guide keeps what you found. |
| `G` | Open or close the field guide. |
| `I` | Show or hide the help. |
| `T` | Show or hide the clock. |
| `M`, or the toggle under the clock | Sound on or off. |
| Start a new log | On the title screen, clears the guide for a new player. |

Things to try:

- Come back at a different hour. The afternoon and night pages of the guide hold
  different animals, and the water looks and sounds different.
- Sweep the lure fast through a cloud of plankton and watch the light spread outward in
  a chain, each flash a little weaker than the last.
- Brush a shrimp. It turns to face the line and flips backwards, with a snap.
- Play a lot of notes at once. The schools break up, the music thins out, and when it is
  quiet again they regroup.

## How it works

All of the code is in `TheAbyssListens/sketch.js`, in ten sections, each with a banner
comment. Values worth changing are marked `// ***`.

The species. Each of the 100 species is a row of data: its common and scientific names,
the colour of its light, its size and depth band compared with the others on its plan, how
rare it is, one sentence for the guide, a Wikipedia link, and a short note on what the real
animal looks like. Size comes from the animal's real body length, the depth band from where
it really lives, and rarity from how often it turns up in samples. Most deep sea light is
blue-green, so most glow colours are too. Eighteen species, such as the giant squid and the
oarfish, make no light of their own. Their colour is a tint of their body, and a strike
gives only a faint flash, as if the lure's light caught on them.

Growing them. There are 11 body plans (plankton, fish, jelly, sea pen, dragonfish, squid,
eel, anglerfish, comb jelly, shrimp and octopus) and one grow function per plan. A look
table keyed by scientific name then shapes each species toward its real animal: the form
of the plan (a siphonophore or a phantom jelly, a branching coral or a sea lily), the body
colour, the proportions, and which features are on, such as tube eyes, a chin barbel or a
web between the arms. The body itself is still generated. The table only sets ranges and
switches, a hash of the name narrows every range to that species' own slice, and the seed
picks the individual inside it. Each body is grown under `randomSeed` and `noiseSeed`, so
the same seed always grows the same animal and nothing flickers. The still parts are drawn
once into a small off-screen canvas at birth, and glows are drawn with `blendMode(ADD)` so
overlapping lights add up.

The clock. The real time is turned into one value, `migration`, 0 at noon and 1 at
midnight, eased so it never jumps. Each body plan has a day depth range and a night depth
range, and that value blends between them. When the clock crosses into a new period, the
old set of species sinks out of sight over about 20 seconds while the new set rises from
below, a few births per frame so there is never a hitch.

The line is a Verlet rope: 26 points held together by distance constraints, with drag
and a little weight, so it bends and trails like real line in water. Its speed decides
whether it disturbs anything. A still line is just another thing in the water.

Moving. Each plan moves its own way: fish and shrimp school with the week 6 rules, jellies
pulse, squid jet, eels ride a travelling sine, comb jellies glide, anglerfish hang in
ambush and lunge at prey, octopuses hover or crawl, sea pens stay anchored and lean.
Everyone feels a moving line and moves away from it, and a touch while moving is a strike.
A spatial grid splits the canvas into 60 px cells so each creature only checks the cells
around it. There are about 560 to 880 creatures on screen, so the movement loop uses plain
numbers instead of vector objects, and anything below the screen skips sensing and drawing.

The chain reaction and the feedback loop. A struck plankton lights up to three unlit
neighbours after a short delay, each of those lights two, and each of those one, every
flash a little weaker. Each one only reacts to its nearest neighbours, but together they
make a ring of light that spreads outward. Each note also raises a `sound.energy` value
that loosens the schools, so busy music scatters the fish, which thins the music, which
lets them regroup.

The sea. The surface is a sum of three sines. Marine snow drifts on a noise field. One
celestial body arcs across the sky, sun by day and moon by night, with the crescent carved
out by a sky-coloured disc. The camera is a zoom and focus transform: close on the boat
above water, the whole sea once under it. The mouse is mapped back through its exact
inverse, so the lure stays under the pointer at any zoom.

The sound is Tone.js. Each body plan has its own voice: an FM pluck for fish, a slow AM
swell for jellies, a bowed pad for the sea pen whose filter opens as the light climbs the
stem, a five-note chord for the dragonfish, a watery burst and chime for squid, a bend up
into the note for eels, one low swelling tone for the anglerfish, three detuned tones
through a tremolo for comb jellies, a snap and a high blip for shrimp, and a slow glide up
for the octopus. Every note sits on an A minor pentatonic scale, so many strikes at once
still sound like one chord, and bigger species play lower. The signal goes through a
filter, an echo, a reverb and a limiter. The filter is muffled by day and opens at night,
and each period has its own echo and reverb. A low brown-noise rumble means the sea is
never completely silent.

## What we took from class, and what we changed

- Modulo (week 3): which body segments carry a light, stripes, alternating fang and
  light sizes, the hash of each species name, round-robin voices, the 12-hour arc of the
  sun and moon.
- Waves (week 4): the water surface, the eel's body, tails, jelly bells and the pulse of
  light round a jelly's rim, octopus arms, comb jelly rows, the day curve.
- Randomness and noise (week 5): body outlines read from noise around a circle so the
  shape closes without a seam, the shared flow field that acts as the current, the snow.
- Autonomous agents (week 6): separation, alignment and cohesion for fish and shrimp,
  counting the same species only, steering as desired minus velocity capped at a maximum
  force, dragonfish turning toward prey, everyone fleeing a moving line. The template's
  functions (`separate()`, `align()`, `cohesion()`, `steer()`) were rewritten with plain
  numbers and grid neighbours.
- Cybernetics and emergence (week 7): the sound and motion feedback loop, and the
  plankton chain reaction.
- Fractals and recursion (week 9): a seeded `branch()` grows the dragonfish's lure, its fin
  rays, the squid's arm skirt and the branching corals. The sun and moon on a sine arc come
  from Sidney's Living Forest.
- L-systems (week 10): jelly tentacles use the plant rule `F -> F[+F]F[-F]F`. The sea pen
  uses our own rule `A -> G[+FL][-FL]G[+FL][-FL]A`, `L -> FL`, where `G` is a stem step
  and `L` a polyp light, so the rule also decides where the creature glows.

An earlier version also let you steer the lure with your hand, using ml5.js handPose with
a 1 Euro filter and a short prediction to cover the detection delay. It worked, but the
camera added a visible lag to the lure and lowered the frame rate, and the piece depends on
a lure that reacts straight away. We took it out and kept the mouse.

## How it went

The sea feels different at different hours, and coming back later really does show you
different life. Schools, chain reactions and the feedback loop all come from simple local
rules, and you can see them clearly on screen. The pentatonic scale and the separate
voices mean that sweeping the lure through a crowd still sounds like music. When you find
a species the guide names the real animal and links to its page. The piece keeps playing
by itself when it is left alone.

Performance was the hardest part. Keeping 560 to 880 creatures moving took the spatial
grid, cached sprites, shared glow sprites, plain numbers for movement, and skipping
everything below the screen. Making 100 real animals recognisable with 11 body plans was
the other hard part. A hatchetfish, a barreleye and a bristlemouth are all built from the
fish plan, so the look table has to carry what makes each one itself. Every detail we fix
for realism is one the generator no longer chooses, so we kept the generator in charge of
the individual (exact proportions, outline, branching, light spacing) and let the table
set only the features you would use to tell the species apart. Sorting real animals into
four periods was a compromise too. Real migration depends on species, depth and season,
and many of these animals are poorly studied, so we sorted them by how strongly they
migrate, shared the anchored colonies out over all four periods, and marked the judgment
calls with a comment in the species table. Browsers block sound until the user clicks, so
the sound starts from the Start button, the toggle or `M`, and the voices are built a few
at a time so nothing freezes. Hand tracking is the one thing we could not fix.

With more time we would let predators actually catch prey, so the food chain has
consequences, and try hand tracking again with detection running off the main thread.

## Running it

Open the live link above in a desktop browser, or serve the `TheAbyssListens` folder with
any static web server:

```
cd TheAbyssListens
python3 -m http.server 8000
```

then visit `http://localhost:8000`. p5.js and Tone.js load from jsDelivr, so it needs an
internet connection either way.

## Files

```
TheAbyssListens/
  index.html      loads p5.js, Tone.js and sketch.js
  sketch.js       the whole piece, in ten sections, with the synopsis and attributions
                  in its header
Video/
  README.md       the link to the video walkthrough
README.md         this write-up
```

We built the piece as ten separate files, one per section, in the repository at
https://github.com/sngai002/dm3008-abyss-listens. This copy joins them into one file for
submission, with the demo tools switched off.

## Attributions

- The flocking rules come from the Boids template (DM3008 week 6 class material, Ashley
  Hi), which follows Daniel Shiffman's *The Nature of Code* version of Craig Reynolds'
  boids. The `branch()` recursion is from the week 9 Living Tree starter, and the sun and
  moon on a sine arc from Sidney's Living Forest. The L-system rewrite and turtle are from
  the week 10 plant demo. The noise flow field is from week 5. Every other function is our
  own. The same list is in the header of `sketch.js`.
- Wikipedia (https://en.wikipedia.org) is the source for the species facts, the field
  guide sentences and the links. Every link was checked to open a real page about that
  animal on 22 November 2026, and each sentence was checked against its page.
- The grid, the energy feedback loop and the Tone.js sound chain were first built for an
  earlier idea of ours about the haze in Singapore, and adapted here. The grid follows the
  bin-lattice idea in *The Nature of Code*, chapter 5, and Craig Reynolds' "Interaction
  with Groups of Autonomous Characters" (2000).
- Smaller references, credited where they are used in the code: Daniel Shiffman's "Polar
  Perlin Noise Loops" (The Coding Train); Prusinkiewicz and Lindenmayer, *The Algorithmic
  Beauty of Plants* (1990); the sin-fract hash from *The Book of Shaders* (Patricio
  Gonzalez Vivo); the moon phase numbers from Jean Meeus, *Astronomical Algorithms*; the
  1 Euro filter (Casiez, Roussel and Vogel, CHI 2012) in the removed hand tracking.
- Built with [p5.js](https://p5js.org) 1.11.11 (LGPL-2.1) and
  [Tone.js](https://tonejs.github.io) 15.1.22 (MIT). The removed version used
  [ml5.js](https://ml5js.org) 1.4.0 (MIT). No external data files and no APIs. The only
  outside input is the computer's clock, and the guide's links open in a new tab.
- How we split the work: each of us first came up with a different concept from one
  shared prompt, a canvas of particles, boids, and a tool such as a line to interact with
  them. As a group we chose this concept and built it together. We used Claude Code as an
  AI coding tool. We split the piece into modules and ran separate agents in parallel, each
  owning one file and never editing another's, and then merged them into the final piece.
