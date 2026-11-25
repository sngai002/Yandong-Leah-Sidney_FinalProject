/*

Yandong, Leah, Sidney
DM3008 Generative Art - Final Project
"The Abyss Listens"

Synopsis
  Most animals in the open ocean make their own light, and they flash when
  something disturbs the water around them. Here you lower a fishing line
  into dark water. Whatever the lure brushes against lights up, plays a note
  and goes into a field guide. All 100 creatures are real deep sea animals,
  and each entry in the guide links to a page about the real one.

  The computer's clock decides who is there. Every night deep sea animals
  swim up to feed near the surface and sink back down before dawn (the diel
  vertical migration). By day the water is mostly empty and the sound is
  muffled. At night it is full and bright. Each of the four periods of the
  day has its own 25 species, so the guide only fills up if you come back
  at other hours. The strong migrators come up in the evening and at night,
  and the deep residents that stay down fill the morning and afternoon.

How it is built
  Everything is in this one file, in ten sections:
    1.  Species        the 100 species, 11 body plans and 4 periods of the day
    2.  Grid           a spatial grid, so each creature only checks its neighbours
    3.  Tide           the real clock turned into the daily migration
    4.  Fishing line   the line and its lure, a verlet rope
    5.  Anatomy        how each creature is grown from a seed and drawn
    6.  Creatures      how creatures move, school, migrate and react
    7.  Sea            sky, sun and moon, surface, camera, water, fog
    8.  Sound          one Tone.js voice per body plan
    9.  Interface      title, clock, field guide, help, start screen
    10. Main           global state, setup(), draw(), diving, sound, input
  Every frame the clock, sound and line update first. Then the sky, water,
  creatures, fog and line are drawn through the sea's camera, and the
  interface goes on top. Values worth changing are marked // ***

Controls
  Start     click Start on the title screen. It turns the sound on and dives
  mouse     under water, steers the lure. A slow lure drifts past things. A
            fast one scatters schools, sets off chains of light and plays notes
  G  open or close the field guide     I  help     T  clock
  M  sound on or off, or click the toggle under the clock
  B  back up to the boat, or hold the lure at the top edge for a second
  Start a new log, on the title screen, clears the guide for a new player
  Keys work with or without Shift. Left alone under water for 7 seconds, the
  line drifts on its own, so the piece keeps playing as an installation.

  An earlier version also let you steer with your hand, using the webcam and
  ml5.js handPose. We took it out because the camera added a visible lag to
  the lure and lowered the frame rate.

Attributions
  The Boids template (DM3008 week 6 class material, Ashley Hi), which follows
  Daniel Shiffman's Nature of Code version of Craig Reynolds' boids:
    - started from the template and changed by us: separate(), align(),
      cohesion() and steer(). They now use plain numbers and the neighbours
      the grid returns, and only count the same species
  The Living Tree starter (week 9) and Sidney's Living Forest from the same
  week: branch(), and the one sun or moon on a sine arc with the crescent
  carved by a sky-coloured disc, in bodyPos() and renderBody()
  The L-system plant demo (week 10): growLsystem() and walkTurtle(), and the
  rule F -> F[+F]F[-F]F for the jelly tentacles
  The noise flow field (week 5): flow()
  Every other function is our own. The grid, the sound chain and the energy
  feedback loop were first written for our earlier haze project and adapted
  here. The grid follows the bin-lattice idea in The Nature of Code, chapter 5.
  Smaller things we read up on are credited where they are used: Shiffman's
  polar noise loop (outline), Prusinkiewicz and Lindenmayer's plant rule,
  the sin-fract hash from The Book of Shaders (Sea.hash), and the moon phase
  numbers from Meeus, Astronomical Algorithms (moonPhase).
  The species facts, the field guide sentences and the links are from
  Wikipedia, each checked against its page on 22 November 2026.
  Sound is Tone.js 15.1.22. Written for p5.js 1.11.11.

*/

///////////////////////////////////////////////////////////////////
// 1. SPECIES
// The 100 real species, the 11 body plans and the 4 periods of the day.
///////////////////////////////////////////////////////////////////

// A body plan is how a creature is built (the Anatomy section grows it, the Sound section
// gives it a voice, the Creatures section moves it). A species is one real
// deep-sea animal drawn on a plan: its own light colour, size, depth,
// period and story. Every species here is a real animal with a page
// the field guide can link to.
//
// The 11 body plans, in index order:
//   0 sparkle   bioluminescent plankton: dinoflagellates, ostracods, small copepods
//   1 fish      small fish: lanternfish, hatchetfish, bristlemouths, barreleyes
//   2 jelly     medusae and siphonophores
//   3 seapen    anchored colonies: sea pens, sea fans, bamboo corals, sea lilies
//   4 dragon    lone predators with a lure or barbel: dragonfish, viperfish, loosejaws
//   5 squid     squid, and the vampire squid
//   6 eel       long bodies: gulpers, snipe eels, oarfish, scabbardfish
//   7 angler    anglerfish
//   8 comb      comb jellies (ctenophores)
//   9 shrimp    shrimp, krill, mysids and large copepods
//   10 octopus  octopus and dumbo octopus
//
// The day has four periods and each has its own 25 species, so a
// player who comes at any hour can find 25, and a player who comes
// back at another time of day finds a different 25. 100 in all.
//   morning    05:00 to 11:00
//   afternoon  11:00 to 17:00
//   evening    17:00 to 22:00
//   night      22:00 to 05:00
// Which period an animal belongs to is a game rule, but it is assigned
// by biology. Many deep-sea animals swim up at dusk to feed near the
// surface and sink again at dawn (diel vertical migration, the largest
// daily movement of animals on Earth). Strong migrators (most
// lanternfish, krill, firefly squid, many siphonophores and copepods)
// are in evening and night. Deep residents that stay put day and
// night (anglerfish, gulpers, the vampire squid, dumbo octopuses,
// bathypelagic jellies) are spread across morning and afternoon.
// Anchored colonies never move, so they are shared out over all four
// periods; the few judgment calls are marked with a comment.
//
// Every other section reads this table by species index, so add to the
// end of a period's block, never reorder. Fields:
//   period   "morning", "afternoon", "evening" or "night"
//   plan     which body plan, index into bodyPlans
//   name     common name (or a short descriptive one if it has none)
//   latin    scientific name
//   col      the colour of its light [r, g, b]; most deep-sea light is
//            blue-green, 470 to 490 nm, a few dragonfish also make red.
//            Animals with no light of their own get a soft tint of their
//            body colour, marked with a comment
//   size     1 is the plan's normal size, bigger is bigger (and lower
//            pitched), from its real body length against others on its plan
//   band     "shallow", "mid" or "deep": where it sits within the plan's
//            depth range, from its real depth against others on its plan
//   rarity   "common" (schools, or hundreds for plankton), "uncommon" (a few),
//            "rare" (one or two), from how often it turns up in samples
//   blurb    one plain, true sentence for the field guide
//   url      a page about the species (or its genus when it has none)
//   source   the site name shown on the guide's link button
//   traits   a look note for the Anatomy section: body shape, key features, colours
//
// Links: Wikipedia first, otherwise a science source (MBARI, NOAA
// Ocean Exploration, Smithsonian Ocean, FishBase, WoRMS). Every link
// was fetched and checked to load a real page about that animal on
// 22 November 2026.

// *** add a body plan here only together with a grow function in the Anatomy section
let bodyPlans = ["sparkle", "fish", "jelly", "seapen", "dragon", "squid", "eel", "angler", "comb", "shrimp", "octopus"];

// *** the periods of the day and when each starts, in hours
let dayPeriods = ["morning", "afternoon", "evening", "night"];
let periodStarts = [5, 11, 17, 22];

// *** change a creature's colour, size, depth or story here
let speciesList = [
  ///////////////////////////////////////////////////////////////////
  // Morning: deep residents that do not migrate
  ///////////////////////////////////////////////////////////////////
  // plan 0, sparkle
  // makes no light of its own, col is its orange shell
  { period: "morning", plan: 0, name: "Giant ostracod", latin: "Gigantocypris agassizi", col: [255, 150, 100], size: 1.5, band: "deep", rarity: "common",
    blurb: "The largest ostracod, an orange bubble up to 3 cm across whose mirror eyes gather light better than any other animal's.",
    url: "https://en.wikipedia.org/wiki/Gigantocypris", source: "Wikipedia",
    traits: "round see-through orange-red shell like a bead, two big silver mirror eyes at the front, small legs poking out of the gap; no light of its own" },
  // non-motile, it drifts instead of migrating
  { period: "morning", plan: 0, name: "Spindle dinoflagellate", latin: "Pyrocystis fusiformis", col: [110, 190, 255], size: 1, band: "shallow", rarity: "common",
    blurb: "A single cell up to 1 mm long, big for its kind, that flashes blue when the water around it is stirred.",
    url: "https://en.wikipedia.org/wiki/Pyrocystis_fusiformis", source: "Wikipedia",
    traits: "one clear spindle-shaped cell pointed at both ends, golden-brown specks inside, blue flash" },
  // judgment call, a drifting cell with no strong migration
  { period: "morning", plan: 0, name: "Spiny dinoflagellate", latin: "Ceratocorys horrida", col: [120, 200, 255], size: 0.7, band: "mid", rarity: "common",
    blurb: "A tiny armoured cell whose spines grow to such different lengths that it has been described in many forms.",
    url: "https://en.wikipedia.org/wiki/Ceratocorys_horrida", source: "Wikipedia",
    traits: "round armoured cell with five or six long straight spines sticking out, blue flash" },
  // plan 1, fish
  // no light organs, col is its green eyes
  { period: "morning", plan: 1, name: "Pacific barreleye", latin: "Macropinna microstoma", col: [140, 255, 170], size: 1.3, band: "mid", rarity: "rare",
    blurb: "Its green tube eyes sit inside a clear, fluid-filled head and swivel from looking straight up to looking forward.",
    url: "https://en.wikipedia.org/wiki/Macropinna", source: "Wikipedia",
    traits: "dark stubby body with large scales and big paddle fins, clear dome over the head, two green tube eyes inside it, tiny mouth; no lights" },
  { period: "morning", plan: 1, name: "Diaphanous hatchetfish", latin: "Sternoptyx diaphana", col: [130, 200, 255], size: 0.7, band: "deep", rarity: "common",
    blurb: "A deep, flat silver fish only 4.5 cm long that, unlike its relatives, seems to stay deep instead of rising each night.",
    url: "https://en.wikipedia.org/wiki/Sternoptyx_diaphana", source: "Wikipedia",
    traits: "very tall, thin, hatchet-blade body, silver sides, big upturned eyes and mouth, a row of blue photophores along the belly" },
  { period: "morning", plan: 1, name: "Veiled anglemouth", latin: "Cyclothone microdon", col: [110, 180, 255], size: 0.8, band: "deep", rarity: "common",
    blurb: "A small dark bristlemouth found in every ocean from 300 to 2,500 m down, named for its round mouth of tiny teeth.",
    url: "https://en.wikipedia.org/wiki/Veiled_anglemouth", source: "Wikipedia",
    traits: "slender brown-black body, wide round mouth with bristle-like teeth, small eyes, a faint row of dim photophores on the belly" },
  // plan 2, jelly
  { period: "morning", plan: 2, name: "Atolla jellyfish", latin: "Atolla wyvillei", col: [90, 160, 255], size: 1, band: "deep", rarity: "uncommon",
    blurb: "When attacked it flashes like a burglar alarm, calling bigger predators that may eat its attacker instead.",
    url: "https://en.wikipedia.org/wiki/Atolla_jellyfish", source: "Wikipedia",
    traits: "deep red flat crown-shaped bell with a groove round the rim, a ring of short tentacles and one long trailing tentacle, blue lights wheel round the rim" },
  // no known light, col is its red-orange bell
  { period: "morning", plan: 2, name: "Giant phantom jelly", latin: "Stygiomedusa gigantea", col: [230, 120, 90], size: 1.6, band: "deep", rarity: "rare",
    blurb: "Seen only about 118 times in 110 years, it trails four paddle-shaped arms that can be 10 metres long.",
    url: "https://en.wikipedia.org/wiki/Stygiomedusa", source: "Wikipedia",
    traits: "huge dark red-orange umbrella bell, no stinging tentacles, four very long wide ribbon-like arms trailing below" },
  { period: "morning", plan: 2, name: "Marrus siphonophore", latin: "Marrus orthocanna", col: [255, 150, 110], size: 1.3, band: "mid", rarity: "uncommon",
    blurb: "A colony of many specialised animals on one long stem, led by an orange gas-filled float, living in cold Arctic depths.",
    url: "https://en.wikipedia.org/wiki/Marrus_orthocanna", source: "Wikipedia",
    traits: "long clear stem, orange float at the top, a stack of clear swimming bells under it, then a string of red-orange feeding polyps with single long tentacles" },
  // plan 3, seapen
  // anchored, shared across periods
  { period: "morning", plan: 3, name: "Umbellula sea pen", latin: "Umbellula encrinus", col: [150, 190, 255], size: 1.5, band: "deep", rarity: "uncommon",
    blurb: "A crown of polyps on a thin stalk over 2 metres tall, anchored in Arctic mud and living for about 70 years.",
    url: "https://en.wikipedia.org/wiki/Umbellula_encrinus", source: "Wikipedia",
    traits: "very tall bare thin stalk from a bulb in the mud, a small cluster of large feathery polyps only at the top like a flower, pale pink-white" },
  { period: "morning", plan: 3, name: "Tall sea pen", latin: "Funiculina quadrangularis", col: [140, 210, 255], size: 1.3, band: "mid", rarity: "uncommon",
    blurb: "Named for looking like a quill stuck in the seabed, it is rare and easily damaged by bottom fishing.",
    url: "https://en.wikipedia.org/wiki/Funiculina_quadrangularis", source: "Wikipedia",
    traits: "long thin whip-like stem with small polyps along it, no wide feather, pale cream, blue light when touched" },
  // plan 4, dragon
  // judgment call, little sign of nightly migration
  { period: "morning", plan: 4, name: "Stoplight loosejaw", latin: "Malacosteus niger", col: [255, 70, 80], size: 1, band: "deep", rarity: "rare",
    blurb: "It shines a red light most deep-sea animals cannot see, and its gape is one of the widest of any fish.",
    url: "https://en.wikipedia.org/wiki/Malacosteus_niger", source: "Wikipedia",
    traits: "black slender body, huge hinged jaw with no floor, long fangs, red light organ under each eye and a small blue one behind it, no barbel" },
  { period: "morning", plan: 4, name: "Smalltooth dragonfish", latin: "Pachystomias microdon", col: [255, 90, 100], size: 0.9, band: "deep", rarity: "rare",
    blurb: "Lives as deep as 4,000 m and is one of only a few fish that make red light as well as blue.",
    url: "https://en.wikipedia.org/wiki/Pachystomias", source: "Wikipedia",
    traits: "black elongated body, very large red light organ under each eye, small blue one behind, small teeth, a short chin barbel" },
  // plan 5, squid
  { period: "morning", plan: 5, name: "Vampire squid", latin: "Vampyroteuthis infernalis", col: [90, 170, 255], size: 1, band: "deep", rarity: "rare",
    blurb: "When upset it squirts a sticky cloud of glowing mucus full of blue lights from its arm tips.",
    url: "https://en.wikipedia.org/wiki/Vampire_squid", source: "Wikipedia",
    traits: "dark red-black, eight arms joined by a cloak of webbing with soft spines, big blue eyes, two ear-like fins, lights on the arm tips" },
  // judgment call, adults are seen deep
  { period: "morning", plan: 5, name: "Bigfin squid", latin: "Magnapinna pacifica", col: [200, 220, 255], size: 1.4, band: "deep", rarity: "rare",
    blurb: "Known from only three young specimens, and probably the adult filmed off Hawaii with arms bent at sharp elbows.",
    url: "https://en.wikipedia.org/wiki/Magnapinna_pacifica", source: "Wikipedia",
    traits: "small pale mantle with two huge round fins, ten very long thin arms held out then bent sharply down at an elbow, trailing far below" },
  // plan 6, eel
  { period: "morning", plan: 6, name: "Umbrella-mouth gulper", latin: "Eurypharynx pelecanoides", col: [255, 120, 170], size: 1.2, band: "deep", rarity: "rare",
    blurb: "Its jaw is a quarter of its length, and the organ at the tip of its whip-like tail glows pink with red flashes.",
    url: "https://en.wikipedia.org/wiki/Pelican_eel", source: "Wikipedia",
    traits: "black, a huge loose pouch mouth far bigger than the head, tiny eyes, thin body tapering to a long whip tail with a glowing pink tip" },
  // no known light
  { period: "morning", plan: 6, name: "Bobtail snipe eel", latin: "Cyema atrum", col: [200, 130, 140], size: 0.6, band: "deep", rarity: "uncommon",
    blurb: "A small dark eel about 13 cm long with delicate jaws shaped like a bird's beak, found as deep as 5,100 m.",
    url: "https://en.wikipedia.org/wiki/Cyema", source: "Wikipedia",
    traits: "short black-brown arrow-shaped body, long thin beak jaws, tail ends in a blunt bobbed fin, no lights" },
  // plan 7, angler
  { period: "morning", plan: 7, name: "Humpback anglerfish", latin: "Melanocetus johnsonii", col: [130, 220, 255], size: 1, band: "mid", rarity: "rare",
    blurb: "Tiny males were once thought to be another fish, until a male was found attached to a female in 1924.",
    url: "https://en.wikipedia.org/wiki/Humpback_anglerfish", source: "Wikipedia",
    traits: "round black body, huge mouth full of long needle teeth, short rod on the head with a glowing bulb, small eyes" },
  { period: "morning", plan: 7, name: "Cosmopolitan whipnose", latin: "Gigantactis vanhoeffeni", col: [150, 230, 255], size: 1.1, band: "deep", rarity: "rare",
    blurb: "A whipnose angler of deep water in every ocean, fishing with a rod up to about as long as its body.",
    url: "https://en.wikipedia.org/wiki/Gigantactis_vanhoeffeni", source: "Wikipedia",
    traits: "long slender black body, very long thin rod from the snout tip ending in a glowing bulb with a pointed tip, small mouth" },
  // plan 8, comb
  { period: "morning", plan: 8, name: "Bloodybelly comb jelly", latin: "Lampocteis cruentiventer", col: [140, 150, 255], size: 1.1, band: "deep", rarity: "uncommon",
    blurb: "Its deep red belly hides the glow of the prey it swallows, so it does not light itself up from inside.",
    url: "https://en.wikipedia.org/wiki/Lampocteis", source: "Wikipedia",
    traits: "lobed comb jelly, deep red to purple body, eight comb rows that scatter rainbow light, blue glow" },
  { period: "morning", plan: 8, name: "Bathocyroe comb jelly", latin: "Bathocyroe fosteri", col: [120, 180, 255], size: 0.6, band: "mid", rarity: "uncommon",
    blurb: "Named for the Alvin pilot who collected it, it hangs still in the water and flaps its lobes to swim.",
    url: "https://en.wikipedia.org/wiki/Bathocyroe_fosteri", source: "Wikipedia",
    traits: "small clear lobed body 2 to 4 cm across, red gut inside, short comb rows, two flapping oral lobes, blue glow" },
  // plan 9, shrimp
  { period: "morning", plan: 9, name: "Giant red mysid", latin: "Gnathophausia ingens", col: [100, 180, 255], size: 1.6, band: "deep", rarity: "uncommon",
    blurb: "Grows to 35 cm long, and a mother may brood her young for up to 530 days.",
    url: "https://en.wikipedia.org/wiki/Gnathophausia_ingens", source: "Wikipedia",
    traits: "large bright red shrimp-like body, long spiny rostrum, hard shield over the front, long antennae, blue glowing fluid" },
  { period: "morning", plan: 9, name: "Northern ambereye", latin: "Hymenodora glacialis", col: [110, 200, 255], size: 1, band: "deep", rarity: "uncommon",
    blurb: "The only open-water shrimp known to live in the Canada Basin under the Arctic ice.",
    url: "https://en.wikipedia.org/wiki/Hymenodora_glacialis", source: "Wikipedia",
    traits: "soft red-orange shrimp, amber eyes, thin shell, long antennae" },
  // plan 10, octopus
  // no known light
  { period: "morning", plan: 10, name: "Dumbo octopus", latin: "Grimpoteuthis bathynectes", col: [255, 180, 200], size: 1, band: "deep", rarity: "rare",
    blurb: "A dumbo octopus known from only 13 specimens, taken from 2,800 to 4,000 m down off the northeast Pacific.",
    url: "https://en.wikipedia.org/wiki/Grimpoteuthis_bathynectes", source: "Wikipedia",
    traits: "soft grey bell-shaped body, two ear-like fins with red-brown edges, eight arms joined by deep purple webbing, fine cirri along the arms" },
  { period: "morning", plan: 10, name: "Glowing sucker octopus", latin: "Stauroteuthis syrtensis", col: [110, 240, 220], size: 1.1, band: "deep", rarity: "rare",
    blurb: "About 40 of its suckers have become lights that shine blue-green, some steady and some twinkling.",
    url: "https://en.wikipedia.org/wiki/Stauroteuthis_syrtensis", source: "Wikipedia",
    traits: "clear jelly-like reddish body, two small fins, eight arms joined by a deep web into an umbrella, a row of glowing suckers down each arm" },

  ///////////////////////////////////////////////////////////////////
  // Afternoon: more deep residents and non-migrators
  ///////////////////////////////////////////////////////////////////
  // plan 0, sparkle
  // judgment call, a surface swimmer
  { period: "afternoon", plan: 0, name: "Red tide dinoflagellate", latin: "Lingulodinium polyedra", col: [100, 200, 255], size: 0.7, band: "shallow", rarity: "common",
    blurb: "It causes the red tides of southern California that light up the beaches with glowing waves at night.",
    url: "https://en.wikipedia.org/wiki/Lingulodinium_polyedra", source: "Wikipedia",
    traits: "tiny round armoured cell, red-brown by day, bright blue flash when the water breaks" },
  // judgment call, a surface swimmer
  { period: "afternoon", plan: 0, name: "Bay dinoflagellate", latin: "Pyrodinium bahamense", col: [90, 210, 255], size: 0.7, band: "shallow", rarity: "common",
    blurb: "The cell that lights up the famous bioluminescent bays of the Bahamas, Jamaica and Puerto Rico.",
    url: "https://en.wikipedia.org/wiki/Pyrodinium", source: "Wikipedia",
    traits: "tiny round armoured cell, blue-green flash" },
  // shines by reflected light, so it belongs to the day
  { period: "afternoon", plan: 0, name: "Sea sapphire", latin: "Sapphirina opalina", col: [140, 200, 255], size: 1.1, band: "mid", rarity: "common",
    blurb: "Males shine gold to deep blue from tiny crystal plates in their cells, a colour made by structure, not pigment.",
    url: "https://en.wikipedia.org/wiki/Sapphirina", source: "Wikipedia",
    traits: "flat clear oval copepod, males flash iridescent blue, violet or gold as they turn (shimmer, not glow)" },
  // plan 1, fish
  // no light organs
  { period: "afternoon", plan: 1, name: "Goiter blacksmelt", latin: "Bathylagus euryops", col: [120, 170, 230], size: 1.2, band: "deep", rarity: "common",
    blurb: "The fish with the most total weight over the Mid-Atlantic Ridge, and it does not migrate up and down each day.",
    url: "https://en.wikipedia.org/wiki/Goiter_blacksmelt", source: "Wikipedia",
    traits: "small dark brown-black smelt, big eyes, small mouth, soft body, no photophores" },
  { period: "afternoon", plan: 1, name: "Brownsnout spookfish", latin: "Dolichopteryx longipes", col: [200, 230, 255], size: 1.2, band: "deep", rarity: "rare",
    blurb: "One of only two vertebrates known to focus its eyes with a mirror as well as a lens.",
    url: "https://en.wikipedia.org/wiki/Brownsnout_spookfish", source: "Wikipedia",
    traits: "very slender pale see-through body, long pointed brown snout, upward tube eyes each with a silver side pouch, long thin pelvic fins" },
  // judgment call, migrates less than its cousins
  { period: "afternoon", plan: 1, name: "Half-naked hatchetfish", latin: "Argyropelecus hemigymnus", col: [140, 200, 255], size: 0.6, band: "mid", rarity: "common",
    blurb: "A tiny silver hatchetfish rarely over 38 mm long that feeds on ostracods and copepods.",
    url: "https://en.wikipedia.org/wiki/Argyropelecus_hemigymnus", source: "Wikipedia",
    traits: "tall hatchet-shaped silver body, naked rear half, tube eyes looking up, blue photophores in clusters along the belly" },
  // plan 2, jelly
  { period: "afternoon", plan: 2, name: "Deepstaria jellyfish", latin: "Deepstaria enigmatica", col: [190, 210, 255], size: 1.4, band: "deep", rarity: "rare",
    blurb: "A thin clear bell up to 60 cm wide with no tentacles, which opens and closes like a bag to swim and take in prey.",
    url: "https://en.wikipedia.org/wiki/Deepstaria_enigmatica", source: "Wikipedia",
    traits: "very wide thin see-through sheet-like bell that billows, a geometric net of canals over it, no tentacles" },
  { period: "afternoon", plan: 2, name: "Giant siphonophore", latin: "Praya dubia", col: [90, 160, 255], size: 1.6, band: "deep", rarity: "rare",
    blurb: "A colony up to 50 m long, as long as a blue whale but as thin as a broomstick, that lures prey with blue light.",
    url: "https://en.wikipedia.org/wiki/Praya_dubia", source: "Wikipedia",
    traits: "two clear swimming bells at the front, then an extremely long thin whitish stem with a curtain of fine tentacles, bright blue light" },
  { period: "afternoon", plan: 2, name: "Firework jellyfish", latin: "Halitrephes maasi", col: [255, 210, 120], size: 0.9, band: "deep", rarity: "uncommon",
    blurb: "Seen 1,200 to 1,500 m down off Baja California, it lives mostly in deep water with very little oxygen.",
    url: "https://en.wikipedia.org/wiki/Halitrephes", source: "Wikipedia",
    traits: "clear flat bell with bright yellow-pink canals bursting out from the centre like a firework, short fine tentacles round the rim" },
  // plan 3, seapen
  { period: "afternoon", plan: 3, name: "Phosphorescent sea pen", latin: "Pennatula phosphorea", col: [110, 230, 200], size: 0.9, band: "mid", rarity: "uncommon",
    blurb: "A feather-shaped colony of polyps, one of several sea pens in its genus that make their own light.",
    url: "https://en.wikipedia.org/wiki/Pennatula", source: "Wikipedia",
    traits: "a feather: short fleshy stalk, two rows of curved leaf-like branches lined with polyps, deep red-pink, green-blue light running along it" },
  // no known light, col is its pink-red colour
  { period: "afternoon", plan: 3, name: "Bubblegum coral", latin: "Paragorgia arborea", col: [255, 140, 150], size: 1.6, band: "deep", rarity: "uncommon",
    blurb: "A branching coral up to 6 m tall whose bulbous branch tips gave it its name.",
    url: "https://en.wikipedia.org/wiki/Paragorgia_arborea", source: "Wikipedia",
    traits: "a wide tree-like fan with a thick trunk and many branches ending in round knobs, white, red or salmon pink" },
  // plan 4, dragon
  // judgment call, migration unknown
  { period: "afternoon", plan: 4, name: "Whip-barbel dragonfish", latin: "Grammatostomias flagellibarba", col: [120, 200, 255], size: 0.7, band: "mid", rarity: "rare",
    blurb: "A black dragonfish about 15 cm long whose chin barbel is about six times as long as its body.",
    url: "https://en.wikipedia.org/wiki/Grammatostomias_flagellibarba", source: "Wikipedia",
    traits: "black slender body, extremely long thin chin barbel, a big photophore behind and below each eye, two rows of tiny photophores on each side" },
  // judgment call, migration unknown
  { period: "afternoon", plan: 4, name: "Threadfin dragonfish", latin: "Echiostoma barbatum", col: [110, 210, 255], size: 1.3, band: "deep", rarity: "rare",
    blurb: "The only species in its genus, up to 37 cm long, it uses light organs to attract its prey.",
    url: "https://en.wikipedia.org/wiki/Echiostoma", source: "Wikipedia",
    traits: "black long body, big fanged jaw, light organ under each eye, a chin barbel with a glowing tip, rows of belly photophores" },
  // plan 5, squid
  // no light organs
  { period: "afternoon", plan: 5, name: "Giant squid", latin: "Architeuthis dux", col: [200, 220, 255], size: 1.6, band: "deep", rarity: "rare",
    blurb: "Up to about 5 m long from fins to arm tips, with the longest tentacles of any cephalopod.",
    url: "https://en.wikipedia.org/wiki/Giant_squid", source: "Wikipedia",
    traits: "very large red-brown torpedo mantle with small fins, eight thick arms, two much longer tentacles with clubs, huge eyes; no lights" },
  { period: "afternoon", plan: 5, name: "Googly-eyed glass squid", latin: "Teuthowenia pellucida", col: [140, 210, 255], size: 0.9, band: "deep", rarity: "uncommon",
    blurb: "A clear blue squid about 20 cm long whose body wall is only a few millimetres thick.",
    url: "https://en.wikipedia.org/wiki/Teuthowenia_pellucida", source: "Wikipedia",
    traits: "swollen see-through barrel mantle tinted blue, very large eyes, eight short arms and two slightly longer, light organs on the eyes" },
  // plan 6, eel
  { period: "afternoon", plan: 6, name: "Gulper eel", latin: "Saccopharynx ampullaceus", col: [255, 120, 150], size: 1.4, band: "deep", rarity: "rare",
    blurb: "A huge mouth on a long slender body, with a light organ at the very tip of its tail.",
    url: "https://en.wikipedia.org/wiki/Saccopharynx_ampullaceus", source: "Wikipedia",
    traits: "black, large gaping mouth with a stretchy stomach, long slender body and very long tail with a glowing organ at the tip" },
  // a bottom eel, no light
  { period: "afternoon", plan: 6, name: "Kaup's arrowtooth eel", latin: "Synaphobranchus kaupii", col: [200, 210, 230], size: 1.1, band: "deep", rarity: "uncommon",
    blurb: "A grey eel up to a metre long, most often found 400 to 2,200 m down near the seabed.",
    url: "https://en.wikipedia.org/wiki/Kaup%27s_arrowtooth_eel", source: "Wikipedia",
    traits: "plain grey-brown eel, pointed snout, low fin along back and belly, gill slits low on the throat; no lights" },
  // plan 7, angler
  { period: "afternoon", plan: 7, name: "Illuminated netdevil", latin: "Linophryne arborifera", col: [140, 230, 255], size: 0.7, band: "deep", rarity: "rare",
    blurb: "Besides a glowing lure, it has a branching chin barbel like seaweed, full of tiny lights.",
    url: "https://en.wikipedia.org/wiki/Linophryne_arborifera", source: "Wikipedia",
    traits: "small round black body, a three-pronged glowing lure on the head, a big branching tree-like barbel under the chin lit with many lights" },
  { period: "afternoon", plan: 7, name: "Atlantic footballfish", latin: "Himantolophus groenlandicus", col: [120, 210, 255], size: 1.5, band: "mid", rarity: "rare",
    blurb: "Females grow up to 60 cm long, but the males never pass 4 cm.",
    url: "https://en.wikipedia.org/wiki/Himantolophus_groenlandicus", source: "Wikipedia",
    traits: "round football-shaped dark brown body covered in bony bumps, short thick rod with a big glowing lure that has small branches, small eyes" },
  { period: "afternoon", plan: 7, name: "Fanfin angler", latin: "Caulophryne jordani", col: [150, 220, 255], size: 0.9, band: "deep", rarity: "rare",
    blurb: "Its rod carries 5 to 14 long clear filaments, and males live as tiny parasites on the female.",
    url: "https://en.wikipedia.org/wiki/Caulophryne_jordani", source: "Wikipedia",
    traits: "round black body, very long fan-like fin rays on back and belly, long feeler filaments all over, a rod with clear filaments and a lure" },
  // plan 8, comb
  { period: "afternoon", plan: 8, name: "Thalassocalyce comb jelly", latin: "Thalassocalyce inconstans", col: [150, 190, 255], size: 1, band: "mid", rarity: "uncommon",
    blurb: "It snaps its bell-shaped body shut around prey and traps them on its mucus-covered inner surface.",
    url: "https://en.wikipedia.org/wiki/Thalassocalyce", source: "Wikipedia",
    traits: "a clear wide cup or bell like a flower, short faint comb rows, blue glow" },
  // judgment call, depth range not known
  { period: "afternoon", plan: 8, name: "Beroe comb jelly", latin: "Beroe cucumis", col: [130, 190, 255], size: 1.1, band: "shallow", rarity: "uncommon",
    blurb: "A pink sac up to 15 cm long whose comb rows shimmer like a photonic crystal and also glow.",
    url: "https://en.wikipedia.org/wiki/Beroe_cucumis", source: "Wikipedia",
    traits: "sac-shaped thimble body with a wide mouth, pink, eight comb rows that scatter rainbow light, no tentacles, blue glow" },
  // plan 9, shrimp
  // lives in swarms on vents, does not migrate
  { period: "afternoon", plan: 9, name: "Blind vent shrimp", latin: "Rimicaris exoculata", col: [140, 220, 255], size: 0.9, band: "deep", rarity: "common",
    blurb: "Thousands cluster where hot fluid gushes from the vents, and in place of eyes it has a light-sensing patch on its back.",
    url: "https://en.wikipedia.org/wiki/Rimicaris_exoculata", source: "Wikipedia",
    traits: "pale white-pink shrimp 4 to 6 cm, swollen front shell, no stalked eyes, a pale patch on the back, bristly mouthparts" },
  // plan 10, octopus
  // no light, col is its orange body
  { period: "afternoon", plan: 10, name: "Flapjack octopus", latin: "Opisthoteuthis californiana", col: [255, 160, 140], size: 0.9, band: "mid", rarity: "rare",
    blurb: "Its webbed arms make it as flat as a pancake on the seafloor, or spread like a parachute when it swims.",
    url: "https://en.wikipedia.org/wiki/Opisthoteuthis_californiana", source: "Wikipedia",
    traits: "flattened orange-pink disc, two small fins, eight short arms fully joined by webbing, big eyes on top" },
  // no light
  { period: "afternoon", plan: 10, name: "Blind cirrate octopus", latin: "Cirrothauma murrayi", col: [230, 220, 255], size: 1.2, band: "deep", rarity: "rare",
    blurb: "Its tiny eyes have no lenses and sit deep in its jelly-like head, so it can likely sense light but not see shapes.",
    url: "https://en.wikipedia.org/wiki/Cirrothauma_murrayi", source: "Wikipedia",
    traits: "soft clear jelly body, two fins, eight arms joined by a deep web, fine cirri along the arms, tiny eyes buried in the head" },

  ///////////////////////////////////////////////////////////////////
  // Evening: vertical migrators on their way up at dusk
  ///////////////////////////////////////////////////////////////////
  // plan 0, sparkle
  { period: "evening", plan: 0, name: "Sea firefly", latin: "Vargula hilgendorfii", col: [90, 170, 255], size: 1.1, band: "shallow", rarity: "common",
    blurb: "Only 3 mm long, it feeds at night, and in World War II the Japanese army used dried sea fireflies as a dim light to read maps.",
    url: "https://en.wikipedia.org/wiki/Vargula_hilgendorfii", source: "Wikipedia",
    traits: "tiny clear bean-shaped double shell, big eye, puffs a blue glowing cloud into the water" },
  { period: "evening", plan: 0, name: "Gossamer worm", latin: "Tomopteris helgolandica", col: [255, 230, 90], size: 1.4, band: "mid", rarity: "common",
    blurb: "One of very few sea animals with yellow light, which it gives off from its paddle-like legs.",
    url: "https://en.wikipedia.org/wiki/Tomopteris", source: "Wikipedia",
    traits: "clear flat worm a few cm long with two rows of paddle legs, two long feelers at the head, yellow light from the legs" },
  { period: "evening", plan: 0, name: "Pacific copepod", latin: "Metridia pacifica", col: [110, 200, 255], size: 1, band: "mid", rarity: "common",
    blurb: "About 3 mm long, it was counted as the same species as Metridia lucens until the two were split apart.",
    url: "https://en.wikipedia.org/wiki/Metridia_pacifica", source: "Wikipedia",
    traits: "tiny teardrop body, two long antennae spread sideways, blue glow puffed out from glands" },
  // plan 1, fish
  { period: "evening", plan: 1, name: "Spotted lanternfish", latin: "Myctophum punctatum", col: [100, 210, 255], size: 1.1, band: "mid", rarity: "common",
    blurb: "A lanternfish of the North Atlantic that swims up to the surface at dusk to feed.",
    url: "https://en.wikipedia.org/wiki/Myctophum_punctatum", source: "Wikipedia",
    traits: "small torpedo fish, big eyes, blunt head, dark back, rows of bright blue-green photophore spots along belly and sides" },
  { period: "evening", plan: 1, name: "Glacier lanternfish", latin: "Benthosema glaciale", col: [110, 220, 240], size: 1, band: "mid", rarity: "common",
    blurb: "The most common lanternfish of the North Atlantic, it rises into shallower water to feed at night.",
    url: "https://en.wikipedia.org/wiki/Benthosema_glaciale", source: "Wikipedia",
    traits: "small deep-bodied lanternfish, big eyes, silver-dark body, rows of blue-green photophores on the belly" },
  { period: "evening", plan: 1, name: "Mueller's pearlside", latin: "Maurolicus muelleri", col: [200, 160, 255], size: 0.7, band: "shallow", rarity: "common",
    blurb: "Spends the day at 150 to 250 m and rises to 50 m at night, hiding its outline with lights along its belly.",
    url: "https://en.wikipedia.org/wiki/Mueller%27s_pearlside", source: "Wikipedia",
    traits: "small slim fish, dark back, silver sides, a row of pink-purple photophores along the belly" },
  { period: "evening", plan: 1, name: "Lovely hatchetfish", latin: "Argyropelecus aculeatus", col: [130, 200, 255], size: 0.8, band: "mid", rarity: "common",
    blurb: "Its silver sides and belly lights hide it in the faint light from above as it migrates each day.",
    url: "https://en.wikipedia.org/wiki/Argyropelecus_aculeatus", source: "Wikipedia",
    traits: "tall flat hatchet-shaped mirror-silver body, tube eyes looking up, spines on the belly edge, blue photophores in clusters" },
  // plan 2, jelly
  // so afraid of light it rises only on dark nights
  { period: "evening", plan: 2, name: "Helmet jellyfish", latin: "Periphylla periphylla", col: [100, 150, 255], size: 1.1, band: "deep", rarity: "uncommon",
    blurb: "So afraid of light that it seldom leaves the deep, and then likely only on very dark nights.",
    url: "https://en.wikipedia.org/wiki/Helmet_jellyfish", source: "Wikipedia",
    traits: "tall pointed cone-shaped bell like a helmet, deep red-purple, a ring of thick tentacles held out, blue light from inside" },
  { period: "evening", plan: 2, name: "Nanomia siphonophore", latin: "Nanomia bijuga", col: [110, 200, 255], size: 1.1, band: "mid", rarity: "uncommon",
    blurb: "A colony that jets up to the surface waters to feed at night and back down by day.",
    url: "https://en.wikipedia.org/wiki/Nanomia_bijuga", source: "Wikipedia",
    traits: "a small orange gas float, a stack of clear jet-swimming bells, then a long stem of feeding polyps and fine tentacles" },
  // judgment call, a midwater medusa
  { period: "evening", plan: 2, name: "Colobonema jellyfish", latin: "Colobonema sericeum", col: [120, 180, 255], size: 0.7, band: "mid", rarity: "uncommon",
    blurb: "A semi-transparent bell up to 45 mm wide with 32 tentacles, which develops straight from egg to medusa.",
    url: "https://en.wikipedia.org/wiki/Colobonema_sericeum", source: "Wikipedia",
    traits: "small silky clear dome, 32 white tentacles round the rim, blue glow" },
  // plan 3, seapen
  // anchored, shared across periods
  { period: "evening", plan: 3, name: "Stalked sea lily", latin: "Endoxocrinus parrae", col: [255, 210, 150], size: 0.8, band: "mid", rarity: "uncommon",
    blurb: "A sea lily on a jointed stalk, with 23 to 58 feathery arms that spread out to catch food.",
    url: "https://en.wikipedia.org/wiki/Endoxocrinus_parrae", source: "Wikipedia",
    traits: "a thin jointed stalk from the seabed with a cup on top, many feathery arms curled out like a parasol, cream to yellow" },
  { period: "evening", plan: 3, name: "Spiral coral", latin: "Iridogorgia magnispiralis", col: [230, 240, 255], size: 1.3, band: "deep", rarity: "uncommon",
    blurb: "A deep-sea coral that grows as a large spiral, found on Atlantic seamounts and around Hawaii.",
    url: "https://en.wikipedia.org/wiki/Iridogorgia", source: "Wikipedia",
    traits: "a single tall stem twisting up in a corkscrew spiral, with long side branches along the spiral, pale gold-white" },
  // plan 4, dragon
  { period: "evening", plan: 4, name: "Sloane's viperfish", latin: "Chauliodus sloani", col: [100, 210, 255], size: 1.1, band: "deep", rarity: "rare",
    blurb: "It dims or brightens the two rows of lights on its belly to hide its shadow from predators below.",
    url: "https://en.wikipedia.org/wiki/Sloane%27s_viperfish", source: "Wikipedia",
    traits: "dark silver-black slim body, huge fangs too long to fit inside the mouth, long first dorsal ray with a lure, two rows of belly photophores" },
  { period: "evening", plan: 4, name: "Scaly dragonfish", latin: "Stomias boa", col: [120, 200, 255], size: 1.2, band: "deep", rarity: "rare",
    blurb: "Lives below 1,000 m by day but swims up towards the surface at night.",
    url: "https://en.wikipedia.org/wiki/Stomias_boa", source: "Wikipedia",
    traits: "long eel-like body covered in hexagonal scales, black below, silver iridescent sides, fangs, a chin barbel, rows of photophores" },
  // plan 5, squid
  // col is its red flashing skin
  { period: "evening", plan: 5, name: "Humboldt squid", latin: "Dosidicus gigas", col: [255, 120, 110], size: 1.5, band: "mid", rarity: "uncommon",
    blurb: "Up to 1.5 m long, it flashes red and white when caught, which earned it the name red devil.",
    url: "https://en.wikipedia.org/wiki/Humboldt_squid", source: "Wikipedia",
    traits: "big muscular torpedo mantle with a diamond fin, eight arms and two tentacles, skin flickering red and white, small light organs" },
  { period: "evening", plan: 5, name: "Strawberry squid", latin: "Histioteuthis heteropsis", col: [100, 190, 255], size: 0.8, band: "mid", rarity: "uncommon",
    blurb: "Red skin dotted with lights like a strawberry's seeds, and one big yellow eye and one small blue one.",
    url: "https://en.wikipedia.org/wiki/Histioteuthis_heteropsis", source: "Wikipedia",
    traits: "short round red mantle and arms covered in many small blue photophores, one large eye and one small eye" },
  // plan 6, eel
  // no light
  { period: "evening", plan: 6, name: "Slender snipe eel", latin: "Nemichthys scolopaceus", col: [210, 200, 190], size: 1.3, band: "mid", rarity: "uncommon",
    blurb: "Up to 1.5 m long but only a few ounces, it sweeps its curved bird-like beak through the water to snag shrimp.",
    url: "https://en.wikipedia.org/wiki/Slender_snipe_eel", source: "Wikipedia",
    traits: "extremely thin grey-brown thread of a body, long bird beak jaws curving apart at the tips, tail ending in a fine thread" },
  // no light
  { period: "evening", plan: 6, name: "Black scabbardfish", latin: "Aphanopus carbo", col: [190, 200, 230], size: 1.2, band: "deep", rarity: "uncommon",
    blurb: "Up to 110 cm long, it stays deep by day and rises at night to hunt crustaceans, squid and fish.",
    url: "https://en.wikipedia.org/wiki/Black_scabbardfish", source: "Wikipedia",
    traits: "long flat black-copper blade of a body, pointed head, big eyes, fang teeth, long fin along the whole back" },
  // plan 7, angler
  // judgment call, a weak swimmer carried into shallower water
  { period: "evening", plan: 7, name: "Triplewart seadevil", latin: "Cryptopsaras couesii", col: [130, 220, 255], size: 1, band: "mid", rarity: "rare",
    blurb: "Three warts on its body ooze slime full of glowing grains, and its tiny lure is almost hidden.",
    url: "https://en.wikipedia.org/wiki/Triplewart_seadevil", source: "Wikipedia",
    traits: "flattened black-brown body, upturned near-vertical mouth, a very short rod tucked in a groove, three glowing warts on the back" },
  // plan 8, comb
  // judgment call
  { period: "evening", plan: 8, name: "Common northern comb jelly", latin: "Bolinopsis infundibulum", col: [120, 200, 255], size: 1.1, band: "shallow", rarity: "uncommon",
    blurb: "Up to 15 cm long, sometimes 250 to a square metre, and the plates of its comb rows glow.",
    url: "https://en.wikipedia.org/wiki/Bolinopsis_infundibulum", source: "Wikipedia",
    traits: "oblong clear body with two large soft lobes at the mouth, four long and four short comb rows shimmering rainbow, blue glow" },
  // judgment call, an upper ocean animal
  { period: "evening", plan: 8, name: "Venus girdle", latin: "Cestum veneris", col: [130, 180, 255], size: 1.6, band: "shallow", rarity: "uncommon",
    blurb: "The largest comb jelly, a clear ribbon up to 1.5 m long with shimmering edges.",
    url: "https://en.wikipedia.org/wiki/Venus_girdle", source: "Wikipedia",
    traits: "a long flat clear ribbon, iridescent comb rows along the top edge, violet tint at the ends, blue glow along its canals" },
  // plan 9, shrimp
  { period: "evening", plan: 9, name: "Northern krill", latin: "Meganyctiphanes norvegica", col: [100, 200, 255], size: 0.9, band: "mid", rarity: "common",
    blurb: "Usually 1.5 to 2 cm long, with a clear shell, compound eyes and its own light organs.",
    url: "https://en.wikipedia.org/wiki/Northern_krill", source: "Wikipedia",
    traits: "small clear shrimp-like body, big black eyes, red spots, feathery legs, blue light organs under the body" },
  // judgment call
  { period: "evening", plan: 9, name: "Fire-breathing shrimp", latin: "Acanthephyra purpurea", col: [110, 190, 255], size: 1.2, band: "deep", rarity: "uncommon",
    blurb: "When upset it spews a glowing cloud of fluid into the water, a trick that earned its name.",
    url: "https://en.wikipedia.org/wiki/Acanthephyra_purpurea", source: "Wikipedia",
    traits: "bright red shrimp, long saw-toothed rostrum, long antennae, a puff of blue glowing fluid from the mouth" },
  { period: "evening", plan: 9, name: "North Pacific krill", latin: "Euphausia pacifica", col: [100, 210, 250], size: 0.7, band: "shallow", rarity: "common",
    blurb: "Food for cod, salmon, herring and halibut, and fished in Japan as isada krill.",
    url: "https://en.wikipedia.org/wiki/Euphausia_pacifica", source: "Wikipedia",
    traits: "small clear krill, big dark eyes, feathery legs, blue light organs" },
  // plan 10, octopus
  // judgment call, the young live shallower and sink as they grow
  { period: "evening", plan: 10, name: "Midwater octopus", latin: "Japetella diaphana", col: [255, 220, 120], size: 0.7, band: "mid", rarity: "uncommon",
    blurb: "A see-through octopus with a glowing ring around its mouth; the young live shallow and sink deeper as they grow.",
    url: "https://en.wikipedia.org/wiki/Japetella_diaphana", source: "Wikipedia",
    traits: "small clear jelly-like body with short arms, a yellow-orange glowing ring around the mouth, gut showing through" },

  ///////////////////////////////////////////////////////////////////
  // Night: strong vertical migrators near the surface
  ///////////////////////////////////////////////////////////////////
  // plan 0, sparkle
  { period: "night", plan: 0, name: "Sea sparkle", latin: "Noctiluca scintillans", col: [100, 200, 255], size: 0.9, band: "shallow", rarity: "common",
    blurb: "Its Latin name means a light at night that throws out flashes, and it gives the sea a bright blue glow.",
    url: "https://en.wikipedia.org/wiki/Noctiluca", source: "Wikipedia",
    traits: "a clear round balloon of a cell up to 1.5 mm, one short tentacle, bright blue flash" },
  { period: "night", plan: 0, name: "Northern glowing copepod", latin: "Metridia longa", col: [90, 190, 255], size: 1.1, band: "mid", rarity: "common",
    blurb: "About 4 mm long, it releases glowing fluid from glands on its head and abdomen when anything disturbs it.",
    url: "https://en.wikipedia.org/wiki/Metridia_longa", source: "Wikipedia",
    traits: "tiny teardrop body, two long antennae spread sideways, puffs of blue glow from head and tail" },
  { period: "night", plan: 0, name: "California sea firefly", latin: "Vargula tsujii", col: [100, 180, 255], size: 1, band: "deep", rarity: "common",
    blurb: "A glowing scavenger that is eaten by the midshipman fish, which then uses the ostracod's chemical to make its own light.",
    url: "https://en.wikipedia.org/wiki/Vargula_tsujii", source: "Wikipedia",
    traits: "tiny clear bean-shaped double shell, puffs of blue glow" },
  // plan 1, fish
  { period: "night", plan: 1, name: "Warming's lanternfish", latin: "Ceratoscopelus warmingii", col: [100, 220, 240], size: 0.9, band: "mid", rarity: "common",
    blurb: "Spends the day 700 to 1,500 m down and rises to the top 200 m at night, where it has even been seen eating floating mats of diatoms.",
    url: "https://en.wikipedia.org/wiki/Warming%27s_lantern_fish", source: "Wikipedia",
    traits: "slim lanternfish, big eyes, dark body with patches and specks of glowing tissue, rows of blue photophores" },
  { period: "night", plan: 1, name: "Antarctic lanternfish", latin: "Electrona antarctica", col: [110, 210, 255], size: 1.1, band: "mid", rarity: "common",
    blurb: "The dominant lanternfish of the Southern Ocean, a key krill eater and a meal for many seabirds.",
    url: "https://en.wikipedia.org/wiki/Electrona_antarctica", source: "Wikipedia",
    traits: "deep-bodied silver lanternfish, big eyes, blunt head, rows of blue photophores along the belly" },
  { period: "night", plan: 1, name: "Northern lampfish", latin: "Stenobrachius leucopsarus", col: [100, 200, 255], size: 1.2, band: "deep", rarity: "common",
    blurb: "Named for the many small round lights along its head and belly; lanternfish like it make up much of the life in the deep.",
    url: "https://en.wikipedia.org/wiki/Northern_lampfish", source: "Wikipedia",
    traits: "grey to dark green-blue back, paler belly, black fins, small pectoral fins, many small round photophores on head and belly" },
  { period: "night", plan: 1, name: "Showy bristlemouth", latin: "Cyclothone signata", col: [120, 190, 255], size: 0.6, band: "shallow", rarity: "common",
    blurb: "Its genus, the bristlemouths, may be the most numerous vertebrates on Earth, numbering in the trillions.",
    url: "https://en.wikipedia.org/wiki/Cyclothone_signata", source: "Wikipedia",
    traits: "tiny slender grey or see-through fish, wide mouth with bristle teeth, a few small photophores along the belly" },
  // plan 2, jelly
  { period: "night", plan: 2, name: "Mauve stinger", latin: "Pelagia noctiluca", col: [130, 180, 255], size: 0.8, band: "shallow", rarity: "uncommon",
    blurb: "Its Latin name means night light; this small stinging jelly stays near the surface at night and sinks deeper by day.",
    url: "https://en.wikipedia.org/wiki/Pelagia_noctiluca", source: "Wikipedia",
    traits: "small mushroom bell covered in warts, mauve-pink, eight long thin tentacles and four frilly mouth arms, blue-green glow" },
  // judgment call, migration unknown
  { period: "night", plan: 2, name: "String jellyfish", latin: "Apolemia uvaria", col: [140, 180, 255], size: 1.5, band: "mid", rarity: "uncommon",
    blurb: "A siphonophore colony with rows of stinging cells; a relative seen off Western Australia in 2020 had coiled into a ring about 47 m long.",
    url: "https://en.wikipedia.org/wiki/Apolemia", source: "Wikipedia",
    traits: "a very long clear stem like a string, crowded with clusters of polyps, short tentacles and white tufts along its length, swimming bells at the front" },
  // judgment call
  { period: "night", plan: 2, name: "Dinner plate jelly", latin: "Solmissus incisa", col: [110, 190, 255], size: 0.9, band: "mid", rarity: "uncommon",
    blurb: "A clear plate-like bell with 22 to 24 long tentacles, and one was found with a whole fish in its stomach.",
    url: "https://en.wikipedia.org/wiki/Solmissus_incisa", source: "Wikipedia",
    traits: "broad flat clear disc like a plate, 22 to 24 long stiff tentacles held out from the edge, blue glow" },
  // plan 3, seapen
  // anchored, shared across periods
  { period: "night", plan: 3, name: "Orange sea pen", latin: "Ptilosarcus gurneyi", col: [120, 230, 190], size: 0.9, band: "shallow", rarity: "uncommon",
    blurb: "When a sea star touches it, it flashes light and pulls down into the sand.",
    url: "https://en.wikipedia.org/wiki/Ptilosarcus_gurneyi", source: "Wikipedia",
    traits: "a fat feather about 46 cm tall, thick fleshy stalk, rows of leaf-like branches of polyps, orange, yellow or white, green light" },
  { period: "night", plan: 3, name: "Crawling sea lily", latin: "Proisocrinus ruberrimus", col: [255, 140, 110], size: 1, band: "deep", rarity: "rare",
    blurb: "A sea lily that can let go and crawl across the seabed on its arms.",
    url: "https://en.wikipedia.org/wiki/Proisocrinus", source: "Wikipedia",
    traits: "a long stalk with a crown of feathery arms, deep red" },
  // plan 4, dragon
  // females migrate up at night, males stay deep
  { period: "night", plan: 4, name: "Black dragonfish", latin: "Idiacanthus atlanticus", col: [220, 90, 120], size: 1.4, band: "mid", rarity: "rare",
    blurb: "Females are 40 cm long with fangs and a barbel, males just 4 cm with neither, and they can see their own near-infrared light.",
    url: "https://en.wikipedia.org/wiki/Idiacanthus_atlanticus", source: "Wikipedia",
    traits: "very long black eel-like female, big fangs, a long chin barbel with a glowing tip, light organ by each eye, rows of tiny photophores" },
  { period: "night", plan: 4, name: "Pacific viperfish", latin: "Chauliodus macouni", col: [110, 200, 255], size: 1.1, band: "mid", rarity: "rare",
    blurb: "Its ultra-black skin soaks up the glow of other animals so it can hide, and it rises to shallower water at night.",
    url: "https://en.wikipedia.org/wiki/Pacific_viperfish", source: "Wikipedia",
    traits: "ultra-black slim body with blue fins, huge needle fangs outside the mouth, long first dorsal ray with a lure, rows of belly photophores" },
  // plan 5, squid
  { period: "night", plan: 5, name: "Firefly squid", latin: "Watasenia scintillans", col: [80, 170, 255], size: 0.6, band: "shallow", rarity: "uncommon",
    blurb: "Lives 200 to 400 m down most of its life, then comes ashore in Japan in spring and lights the bays blue.",
    url: "https://en.wikipedia.org/wiki/Firefly_squid", source: "Wikipedia",
    traits: "small reddish squid, hundreds of tiny blue photophores over the body, three bright lights on the tip of each of two arms" },
  { period: "night", plan: 5, name: "Eye-flash squid", latin: "Abralia veranyi", col: [100, 200, 255], size: 0.6, band: "shallow", rarity: "uncommon",
    blurb: "About 550 light organs cover its underside, and it rises from 700 m by day to 20 to 60 m at night.",
    url: "https://en.wikipedia.org/wiki/Abralia_veranyi", source: "Wikipedia",
    traits: "small slim squid with a fin, eight arms and two long tentacles, the whole underside dotted with blue photophores, lights on the eyes" },
  // plan 6, eel
  // judgment call, no light
  { period: "night", plan: 6, name: "Giant oarfish", latin: "Regalecus glesne", col: [200, 220, 255], size: 1.6, band: "shallow", rarity: "rare",
    blurb: "The longest bony fish in the world, a ribbon up to about 8 m long with a fin along its whole back.",
    url: "https://en.wikipedia.org/wiki/Giant_oarfish", source: "Wikipedia",
    traits: "very long flat silver ribbon with dark streaks, red fin along the whole back, red crest of long rays on the head, two long oar-like pelvic fins" },
  // no light
  { period: "night", plan: 6, name: "Bean's sawtooth eel", latin: "Serrivomer beanii", col: [130, 170, 230], size: 1, band: "mid", rarity: "uncommon",
    blurb: "The largest sawtooth eel, with pale metallic blue skin, it migrates up and down each night.",
    url: "https://en.wikipedia.org/wiki/Bean%27s_sawtooth_eel", source: "Wikipedia",
    traits: "slim eel with pale metallic blue-bronze skin, long fine narrow jaws with backward saw teeth, low fins" },
  // plan 7, angler
  // game rule, anglers do not migrate
  { period: "night", plan: 7, name: "Krøyer's deep sea anglerfish", latin: "Ceratias holboelli", col: [140, 220, 255], size: 1.6, band: "deep", rarity: "rare",
    blurb: "The largest of its family, the female carries a tiny male fused to her body for life.",
    url: "https://en.wikipedia.org/wiki/Kr%C3%B8yer%27s_deep_sea_angler_fish", source: "Wikipedia",
    traits: "long dark brown body, big upturned mouth, a rod on the snout with a glowing bulb, two warts in front of the back fin, a small male stuck to her belly" },
  // game rule, anglers do not migrate
  { period: "night", plan: 7, name: "Wolftrap angler", latin: "Lasiognathus saccostoma", col: [150, 230, 255], size: 0.7, band: "deep", rarity: "rare",
    blurb: "A small angler under 8 cm whose upper jaw is lined with long teeth like a beard.",
    url: "https://en.wikipedia.org/wiki/Lasiognathus_saccostoma", source: "Wikipedia",
    traits: "small black body, jaw that sticks out like a trap, a long rod curving forward over the mouth with a glowing lure and hooks" },
  // plan 8, comb
  // judgment call
  { period: "night", plan: 8, name: "Euplokamis comb jelly", latin: "Euplokamis dunlapae", col: [120, 190, 255], size: 0.8, band: "mid", rarity: "uncommon",
    blurb: "The first comb jelly found with giant nerve fibres, which let it speed up or reverse its combs to escape.",
    url: "https://en.wikipedia.org/wiki/Euplokamis_dunlapae", source: "Wikipedia",
    traits: "small clear oval body, eight comb rows shimmering rainbow, two long tentacles with coiled side branches, blue glow" },
  { period: "night", plan: 8, name: "Sea gooseberry", latin: "Pleurobrachia pileus", col: [130, 200, 255], size: 0.6, band: "shallow", rarity: "uncommon",
    blurb: "Rises into the upper water at night and sinks by morning, fishing with two tentacles 20 times its length.",
    url: "https://en.wikipedia.org/wiki/Pleurobrachia_pileus", source: "Wikipedia",
    traits: "round clear berry 2.5 cm, eight comb rows shimmering rainbow, two very long fringed tentacles" },
  // plan 9, shrimp
  { period: "night", plan: 9, name: "Antarctic krill", latin: "Euphausia superba", col: [110, 220, 255], size: 0.9, band: "shallow", rarity: "common",
    blurb: "One of the most abundant animals on Earth, it swarms in the Southern Ocean and glows from its light organs.",
    url: "https://en.wikipedia.org/wiki/Antarctic_krill", source: "Wikipedia",
    traits: "clear orange-pink shrimp-like body 6 cm, big black eyes, green gut showing, feathery legs, blue light organs" },
  // judgment call
  { period: "night", plan: 9, name: "Gaussia copepod", latin: "Gaussia princeps", col: [100, 200, 255], size: 0.6, band: "mid", rarity: "uncommon",
    blurb: "From a genus of glowing copepods that live anywhere from the surface to 3,000 m down.",
    url: "https://en.wikipedia.org/wiki/Gaussia_(crustacean)", source: "Wikipedia",
    traits: "large copepod about 1 cm, teardrop body, long antennae, red-orange, blue glowing clouds" },
  // plan 10, octopus
  // judgment call, no light
  { period: "night", plan: 10, name: "Glass octopus", latin: "Vitreledonella richardi", col: [210, 235, 255], size: 1, band: "mid", rarity: "rare",
    blurb: "Almost colourless and clear, with long rectangular eyes that keep its shadow small from below.",
    url: "https://en.wikipedia.org/wiki/Glass_octopus", source: "Wikipedia",
    traits: "fully see-through jelly body and arms, only the narrow eyes, gut and optic nerves visible, arms two to three times the mantle" }
];

// which period of the day an hour (0 to 24) falls in
function periodOf(hour) {
  let p = dayPeriods[dayPeriods.length - 1]; // before the first start it is still night
  for (let i = 0; i < periodStarts.length; i++) {
    if (hour >= periodStarts[i]) p = dayPeriods[i];
  }
  return p;
}

// true if the species belongs to the period this hour is in
function speciesActive(i, hour) {
  return speciesList[i].period === periodOf(hour);
}

// how many species are reachable at a given hour, always 25
function speciesActiveCount(hour) {
  let n = 0;
  for (let i = 0; i < speciesList.length; i++) {
    if (speciesActive(i, hour)) n++;
  }
  return n;
}

// the species of one period, in table order. the field guide uses this for its four pages
function speciesOfPeriod(period) {
  let list = [];
  for (let i = 0; i < speciesList.length; i++) {
    if (speciesList[i].period === period) list.push(i);
  }
  return list;
}

///////////////////////////////////////////////////////////////////
// 2. GRID
// A spatial grid, so each creature only checks its near neighbours.
///////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////
// Grid Object
// Splits the canvas into square cells so each boid only checks the
// boids in its own cell and the 8 cells around it, instead of every
// boid on the canvas (n x n checks gets slow past ~200 boids).
//
// Based on "bin-lattice spatial subdivision" from The Nature of Code
// ch.5 (Daniel Shiffman) and Craig Reynolds' "Interaction with
// Groups of Autonomous Characters" (2000). Our own implementation.
///////////////////////////////////////////////////////////////////

// the grid: square cells over the canvas, each holding the creatures inside it
function Grid(cellSize) {
  // cell size should be the same as the biggest neighbour distance,
  // otherwise boids can miss neighbours that are two cells away
  this.cellSize = cellSize;
  this.cells = {};
}

// empties the grid. called every frame, since everything keeps moving
Grid.prototype.clear = function () {
  this.cells = {};
};

// turns a column and row into a key like "4,7"
Grid.prototype.key = function (col, row) {
  return col + "," + row;
};

// drops a creature into the cell it is in right now
Grid.prototype.insert = function (boid) {
  let col = floor(boid.position.x / this.cellSize);
  let row = floor(boid.position.y / this.cellSize);
  let k = this.key(col, row);

  if (this.cells[k] === undefined) {
    this.cells[k] = [];
  }
  this.cells[k].push(boid);
};

// all the creatures in the 3 x 3 block of cells around a position
Grid.prototype.query = function (position) {
  let col = floor(position.x / this.cellSize);
  let row = floor(position.y / this.cellSize);
  let found = [];

  for (let c = col - 1; c <= col + 1; c++) {
    for (let r = row - 1; r <= row + 1; r++) {
      let cell = this.cells[this.key(c, r)];
      if (cell === undefined) continue;

      for (let i = 0; i < cell.length; i++) {
        found.push(cell[i]);
      }
    }
  }

  return found;
};

///////////////////////////////////////////////////////////////////
// 3. TIDE
// The real clock, turned into the daily migration.
///////////////////////////////////////////////////////////////////

// Every night the biggest migration on Earth happens in the sea:
// animals rise from the deep to feed near the surface, then sink
// back down before dawn. The clock on the computer drives it here.

///////////////////////////////////////////////////////////////////
// Tide Object
// Reads the real time and turns it into one number, migration,
// which everything else reads: 1 at midnight (creatures risen),
// 0 at noon (creatures deep). It eases so the change is never a jump.
///////////////////////////////////////////////////////////////////

// the tide: the hour as a fraction, and the eased migration value everything reads
function Tide() {
  this.hour = 0; // 0 to 24, with minutes as a fraction
  this.migration = 1; // eased, 0 (noon) to 1 (midnight)
  this.manual = null; // null = follow the real clock, else the hour the demo scrubber set
}

// the demo scrubber sets an hour here. null follows the real clock again
Tide.prototype.setHour = function (h) {
  this.manual = h === null ? null : constrain(h, 0, 23.999);
};

// true while the clock is the real one and not the demo scrubber's
Tide.prototype.isLive = function () {
  return this.manual === null;
};

// reads the clock and eases the water one percent of the way to where the hour says
Tide.prototype.update = function () {
  if (this.manual !== null) {
    this.hour = this.manual;
  } else {
    let d = new Date();
    this.hour = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }

  let target = this.target();
  this.migration = lerp(this.migration, target, 0.01); // *** how slowly the water changes
};

// where the migration should sit at this hour: 1 at midnight, 0 at noon, gentle at dusk and dawn
Tide.prototype.target = function () {
  let m = 0.5 + 0.5 * cos((this.hour / 24) * TWO_PI); // 1 at midnight, 0 at noon
  return m * m * (3 - 2 * m); // smoothstep, so dusk and dawn are gentle
};

// the time as text, like "23:41"
Tide.prototype.clockText = function () {
  let h = floor(this.hour) % 24;
  let m = floor((this.hour % 1) * 60);
  return nf(h, 2) + ":" + nf(m, 2);
};

// one line for the clock about what the creatures are doing at this hour
Tide.prototype.phaseText = function () {
  let m = this.target();
  if (m > 0.7) return "Night. The creatures have risen to feed.";
  if (m < 0.3) return "Day. Most creatures are sheltering in the deep.";
  if (this.hour >= 12) return "Dusk. The migration is rising toward you.";
  return "Dawn. The migration is sinking back down.";
};

// the depth a creature wants right now, blended between its day and night range by the tide
Tide.prototype.depthFor = function (pref, dayRange, nightRange) {
  let day = height * lerp(dayRange[0], dayRange[1], pref);
  let night = height * lerp(nightRange[0], nightRange[1], pref);
  return lerp(day, night, this.migration);
};

///////////////////////////////////////////////////////////////////
// 4. FISHING LINE
// The line hanging from the boat, and the lure at its end.
///////////////////////////////////////////////////////////////////

// The line hangs from the surface and the lure follows the pointer
// (or later, a hand). Whatever it brushes against lights up and
// makes a sound. The rope is a chain of points held together by
// distance constraints (Verlet integration), with water drag.

///////////////////////////////////////////////////////////////////
// FishingLine Object
// Call setTarget() with wherever the lure should go, update() once
// a frame, render() after the creatures. Creatures use nearest() to
// find out how close the line is and speed to know if it is moving.
///////////////////////////////////////////////////////////////////

// the line: a rope of points from the boat to the lure, and where the lure is heading
function FishingLine(x, y) {
  this.n = 26; // *** points along the rope
  this.lx = x; // lure position
  this.ly = y;
  this.tx = x; // where the lure is heading
  this.ty = y;
  this.anchorX = x; // top of the line, drifts slowly after the lure like a boat
  this.anchorY = -8; // *** just above the top of the screen (surface)
  this.speed = 0; // how fast the lure moved this frame, eased
  this.response = 0.18; // *** how quickly the lure follows its target, 0 to 1
  this.lit = 0; // 0 to 1, how much the lure is glowing (hits brighten it)

  this.pts = [];
  for (let i = 0; i < this.n; i++) {
    let py = lerp(this.anchorY, y, i / (this.n - 1));
    this.pts.push({ x: x, y: py, px: x, py: py });
  }
  this.box = { x0: 0, y0: 0, x1: 0, y1: 0 }; // bounding box, for a quick reject in nearest()
}

// points the lure at a screen position, turned into world coordinates through the camera
FishingLine.prototype.setTarget = function (x, y) {
  if (typeof sea !== "undefined" && sea.toWorld) {
    let w = sea.toWorld(x, y);
    x = w.x;
    y = w.y;
  }
  this.tx = x;
  this.ty = y;
};

// jumps the lure straight to its target with no speed, so the jump never counts as a strike
FishingLine.prototype.settle = function () {
  this.lx = this.tx;
  this.ly = constrain(this.ty, 24, height - 8);
  this.speed = 0;
};

// eases the lure to its target, lets the boat drift after it, then runs the rope's verlet step
FishingLine.prototype.update = function () {
  // the top of the line lags far behind, the lure follows closely
  this.anchorX = lerp(this.anchorX, this.tx, 0.015);
  let plx = this.lx;
  let ply = this.ly;
  this.lx = lerp(this.lx, this.tx, this.response);
  this.ly = lerp(this.ly, this.ty, this.response);
  this.ly = constrain(this.ly, 24, height - 8);

  let moved = dist(this.lx, this.ly, plx, ply);
  this.speed = lerp(this.speed, moved, 0.3);
  this.lit *= 0.94;

  // rope length stretches a little past the straight distance so it sags
  let total = max(dist(this.anchorX, this.anchorY, this.lx, this.ly) * 1.06, 30);
  let seg = total / (this.n - 1);
  let P = this.pts;

  // Verlet step: keep most of last frame's motion (drag) and sink a little
  for (let i = 1; i < this.n - 1; i++) {
    let p = P[i];
    let vx = (p.x - p.px) * 0.9;
    let vy = (p.y - p.py) * 0.9 + 0.12; // *** 0.12 = how heavy the line is
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy;
  }

  // pull neighbouring points back to the segment length, a few passes
  for (let k = 0; k < 14; k++) {
    P[0].x = this.anchorX;
    P[0].y = this.anchorY;
    P[this.n - 1].x = this.lx;
    P[this.n - 1].y = this.ly;
    for (let i = 0; i < this.n - 1; i++) {
      let a = P[i];
      let b = P[i + 1];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let d = max(sqrt(dx * dx + dy * dy), 0.0001);
      let diff = ((d - seg) / d) * 0.5;
      let aPinned = i === 0;
      let bPinned = i + 1 === this.n - 1;
      if (aPinned && !bPinned) {
        b.x -= dx * diff * 2;
        b.y -= dy * diff * 2;
      } else if (!aPinned && bPinned) {
        a.x += dx * diff * 2;
        a.y += dy * diff * 2;
      } else if (!aPinned && !bPinned) {
        a.x += dx * diff;
        a.y += dy * diff;
        b.x -= dx * diff;
        b.y -= dy * diff;
      }
    }
  }
  P[0].x = this.anchorX;
  P[0].y = this.anchorY;
  P[this.n - 1].x = this.lx;
  P[this.n - 1].y = this.ly;

  let b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (let i = 0; i < this.n; i++) {
    b.x0 = min(b.x0, P[i].x);
    b.y0 = min(b.y0, P[i].y);
    b.x1 = max(b.x1, P[i].x);
    b.y1 = max(b.y1, P[i].y);
  }
  this.box = b;
};

// the closest point on the line to (x, y), or infinity at once when the line is nowhere near
FishingLine.prototype.nearest = function (x, y, pad) {
  if (pad === undefined) pad = 90;
  // a quick box test first, so most creatures skip the slower check of all 25 segments
  let b = this.box;
  if (x < b.x0 - pad || x > b.x1 + pad || y < b.y0 - pad || y > b.y1 + pad) {
    return { d: Infinity, x: 0, y: 0 };
  }

  let best = { d: Infinity, x: 0, y: 0 };
  let P = this.pts;
  for (let i = 0; i < P.length - 1; i++) {
    let ax = P[i].x;
    let ay = P[i].y;
    let dx = P[i + 1].x - ax;
    let dy = P[i + 1].y - ay;
    let l2 = dx * dx + dy * dy;
    let u = l2 > 0 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0;
    u = constrain(u, 0, 1);
    let cx = ax + u * dx;
    let cy = ay + u * dy;
    let d = dist(x, y, cx, cy);
    if (d < best.d) best = { d: d, x: cx, y: cy };
  }
  return best;
};

// flares the lure. a creature calls this when the line hits it
FishingLine.prototype.strike = function () {
  this.lit = 1;
};

// draws the line as a soft wide pass and a thin bright one, then the glowing lure and its hook
FishingLine.prototype.render = function () {
  let P = this.pts;
  push();
  noFill();
  strokeCap(ROUND);

  // a soft wide pass then a thin bright one reads as a wet line catching light
  stroke(143, 220, 255, 18);
  strokeWeight(4);
  this.path();
  stroke(205, 232, 242, 110);
  strokeWeight(1);
  this.path();

  // the lure: a glow that grows when it moves or strikes
  let s = min(this.speed, 12);
  noStroke();
  fill(95, 243, 216, 40 + this.lit * 60);
  circle(this.lx, this.ly, 40 + s * 3 + this.lit * 30);
  fill(235, 255, 252, 240);
  circle(this.lx, this.ly, 6 + s * 0.5);

  // a small hook under the lure
  noFill();
  stroke(205, 232, 242, 140);
  strokeWeight(1.2);
  arc(this.lx + 4, this.ly + 9, 10, 10, PI * 0.95, PI * 2.05);
  pop();
};

// a smooth curve through the rope points
FishingLine.prototype.path = function () {
  let P = this.pts;
  beginShape();
  curveVertex(P[0].x, P[0].y);
  for (let i = 0; i < P.length; i++) {
    curveVertex(P[i].x, P[i].y);
  }
  curveVertex(P[P.length - 1].x, P[P.length - 1].y);
  endShape();
};

///////////////////////////////////////////////////////////////////
// 5. ANATOMY
// How each creature is grown from a seed and drawn.
///////////////////////////////////////////////////////////////////

// decides where a creature is and how it behaves, then asks its
// Body to draw itself there.
//
// A creature is a species (the Species section) on one of eleven body plans:
//   0 sparkle  1 fish  2 jelly  3 seapen  4 dragon  5 squid  6 eel
//   7 angler   8 comb  9 shrimp  10 octopus
// The plan says how it is built, the species says its colour and
// size, and speciesLook (keyed by scientific name) says what the
// real animal looks like: body colour, proportions, which form of
// the plan it takes and which features it has, written from the
// traits in the Species section. A hash of the name narrows every gene range
// to a window of its own, so individuals still vary. Every body is
// then grown from one seed with the techniques from class, so no
// two look the same but they all cost about the same:
//   noise (wk 5)       body silhouette, radius around an ellipse wobbled by noise
//   L-systems (wk 10)  tentacles and fronds, a rule set per plan, angle varies per individual
//   recursion (wk 9)   branching fins, lure antlers and arms, seeded so they are stable
//   waves (wk 4)       fins, bells, arms, comb rows and the eel's body move with sin() every frame
//   modulo (wk 3)      which segments carry a light, stripe patterns
// The still parts are drawn once into a small createGraphics()
// sprite at birth, so each frame is one image() plus the glowing bits.
//
// Interface the rest of the sketch relies on:
//   new Body(species, seed)              species is the index into speciesList
//   body.plan, body.species, body.size   read back by the Creatures, Sound and Interface sections
//   body.radius                          collision radius (plan radius times size)
//   body.render(x, y, heading, flash, lit)
//   body.renderIcon(x, y, px)            a still lit portrait for the field guide
//   body.renderSilhouette(x, y, px)      the same footprint, dark and unlit, for locked rows
//
// heading is the direction of travel for everything that swims (they
// flip so the belly stays down when swimming left). For a jelly it
// is where the bell points and for a sea pen where it stands
// (-HALF_PI is upright), as the Creatures section sends them.
//
// References
//   Reading noise around a circle so an outline joins up without a
//   seam: Daniel Shiffman, The Coding Train, "Polar Perlin Noise Loops".
//   The plant rule F -> F[+F]F[-F]F and the bracket turtle:
//   Prusinkiewicz and Lindenmayer, The Algorithmic Beauty of Plants (1990).

///////////////////////////////////////////////////////////////////
// Plans and genes
// One entry per body plan: the ranges a plan draws its genome from,
// and the L-system rule set for the plans that grow one. Angles in
// degrees, lengths in pixels at size 1. A species look can replace
// any of these by name (see the list after the table).
///////////////////////////////////////////////////////////////////

// *** collision radius of each plan at size 1
let planRadius = [3, 7, 30, 40, 20, 16, 14, 18, 14, 10, 18];

// *** the seed picks one value inside each range, widen a range for more variety
let planGenes = [
  // 0 - sparkle: only a size and a twinkle speed, hundreds share one halo sprite per species
  { size: [2, 3.6], twinkle: [0.04, 0.12] },
  // 1 - fish: streamlined, a light on every 1st or 2nd belly segment
  { length: [22, 30], height: [0.3, 0.42], wobble: [0.08, 0.2], segments: 8, lightEvery: [1, 2], stripeEvery: [2, 3], eye: [2.2, 3.2], tail: [5, 8], flick: [0.25, 0.4], keel: [0, 0], barbel: [0, 0], teeth: 0 },
  // 2 - jelly: a dome with tentacles grown from the plant rule
  { bell: [44, 62], dome: [0.55, 0.8], wobble: [0.05, 0.14], scallops: [6, 10], tentacles: [4, 8], rimLights: [8, 14], length: [60, 115], angle: [6, 22], gens: [2, 3], breathe: [0.03, 0.06], oral: 0, bells: [3, 6], stem: [60, 120], longTentacle: 0, warts: 0,
    lsystem: { axiom: "F", rules: { F: "F[+F]F[-F]F" } } },
  // 3 - sea pen: each generation adds two stem steps (G) and a pair of pinnae,
  //     and every pinna already there grows one step before its polyp light (L)
  { stem: [58, 78], stalk: [16, 26], gens: [3, 4], angle: [35, 65], step: [5, 8], weight: [2, 3.2], sway: [0.02, 0.04],
    lsystem: { axiom: "A", rules: { A: "G[+FL][-FL]G[+FL][-FL]A", L: "FL" } } },
  // 4 - dragon: long and dark, a chin barbel with an antler lure, a beam under the eye
  { length: [100, 130], height: [0.13, 0.18], wobble: [0.06, 0.14], segments: 14, lightEvery: [2, 3], antlerDepth: [3, 4], antlerAngle: [20, 40], antlerLen: [9, 13], rayDepth: [2, 3], beam: [70, 100], flick: [0.12, 0.2], fangs: 4, barbel: [8, 14], jaw: [0, 0], eyeSize: [1, 1] },
  // 5 - squid: a soft mantle, a skirt of short arms, two long ones that trail
  { mantle: [28, 38], height: [0.36, 0.46], wobble: [0.06, 0.14], segments: 10, lightEvery: [2, 3], arms: [6, 8], armLen: [9, 13], armDepth: [1, 2], longArm: [1, 1.4], fin: [0.3, 0.42], ripple: [0.08, 0.14], eyeSize: [1, 1], finShape: "rhomb" },
  // 6 - eel: a ribbon of segments that rides a travelling sine wave
  { length: [60, 90], thick: [5, 8], segments: 16, lightEvery: [2, 3], amp: [6, 10], freq: [0.08, 0.13], waves: [1.1, 1.5], head: [9, 13], wobble: [0.08, 0.16], snipe: [0, 0], eyeSize: [1, 1] },
  // 7 - angler: a round body that is mostly mouth, a rod from the forehead with a glowing esca
  { body: [28, 40], round: [0.7, 1], wobble: [0.06, 0.14], mouth: [0.5, 0.9], teeth: [6, 12], rod: [14, 26], curl: [0, 1], esca: [2, 4], eye: [2, 3.2], fin: [5, 8], flick: [0.1, 0.18], tuft: [0, 1] },
  // 8 - comb: a see-through oval with eight comb rows that shimmer
  { length: [18, 30], width: [0.55, 0.8], wobble: [0.05, 0.12], rows: 8, rowLen: [0.6, 0.9], dashes: [6, 10], shimmer: [0.1, 0.2], tentLen: [1, 2.2], shape: "oval", tentacles: 1 },
  // 9 - shrimp: a carapace, a curled abdomen of segments, long antennae and a tail fan
  { length: [22, 34], segments: [5, 7], curl: [0.3, 1], antenna: [0.8, 1.4], legs: [4, 6], lightEvery: [1, 2], rostrum: [0.15, 0.3], eye: [1.6, 2.4], fan: [4, 7], wobble: [0.05, 0.12], flick: [0.2, 0.3] },
  // 10 - octopus: a mantle, eight arms that wave, a web between them for the cirrate kinds
  { mantle: [22, 32], round: [0.8, 1.1], wobble: [0.06, 0.14], arms: 8, armLen: [1.2, 2], web: [0, 0], fins: [0, 0], eye: [3, 5], wave: [0.04, 0.08], spread: [0.6, 1.1], armLights: 0 }
];

///////////////////////////////////////////////////////////////////
// GENES A SPECIES CAN OVERRIDE
// A species sets any of these in speciesLook (by name) or in a
// `look` object on its the Species section row. A range [lo, hi] replaces
// the plan's range (give [v, v] for a fixed value); a flag is true
// or false; a number is a count or an amount.
//
// every plan
//   flesh       body colour: "black", "red", "darkred", "silver",
//               "brown", "white", "orange", "clear" (see-through),
//               or [r, g, b]. Default is a dull shade of the glow colour.
//   glow        brightness of the lights, 1 is normal
//   glass       true = same as flesh "clear"
//   noLight     true for animals that make no light: their lights are
//               off and a strike only gives a faint reflected flash
// 0 sparkle     size, twinkle, halo (glow size), shimmer (three tints by seed),
//               shape ("dot", "bead" ostracod, "spindle", "spiny", "copepod",
//               "worm", "sapphire" iridescent speck, "bean" ostracod shell)
// 1 fish        length, height (as a fraction of length), wobble,
//               stripeEvery, lightEvery, rows (1 or 2 rows of lights),
//               eye, tail, flick, keel (deep hatchet belly 0..1),
//               barbel (chin barbel length), teeth (count on the jaw),
//               snout (beak), bigMouth, silver (bright belly), ink (black),
//               tubeEyes (eyes point up), dome (clear dome over the head),
//               finSize (pectoral fins)
// 2 jelly       bell (width), dome (height as a fraction of bell), wobble,
//               scallops, tentacles, rimLights, length (tentacle),
//               angle, gens (L-system), breathe, rings (moon gonads),
//               combs (rows of lights), rays (canal to every scallop),
//               stars (scattered lights), oral (oral arms count),
//               form ("medusa", "siphonophore" float + bells + a long
//               stem of polyps, "phantom" four ribbon arms, "bag" a huge
//               thin net-veined bell, "helmet" a tall cone, "plate" a
//               flat disc with stiff tentacles, "firework" bright canals),
//               stem (siphonophore stem length), bells (swimming bells),
//               longTentacle (count of extra long trailing tentacles),
//               warts (dots on the bell), stiff (tentacles held out straight)
// 3 seapen      stem, stalk, gens, angle, step, weight, sway, flare (all at
//               once), form ("pen" feather, "tree" branching coral, "spiral"
//               corkscrew, "lily" stalk and a crown of arms, "umbellula"
//               bare stalk with a tuft on top, "whip" thin stem with polyps)
// 4 dragon      length, height, wobble, lightEvery, antlerDepth,
//               antlerAngle, antlerLen, rayDepth, beam, beamStrength
//               (0 = no light organ beam), flick, fangs, barbel (chin
//               barbel length, [0, 0] = none), jaw (open gape 0..1),
//               eyeSize, spine (lure on a dorsal spine), lamp (round
//               lamp on a rod), lampOnly, lampSteady, eyeLights,
//               fangLen (1 is normal), scales (hexagonal scale pattern)
// 5 squid       mantle, height, wobble, lightEvery, arms, armLen,
//               armDepth, longArm, fin, ripple, eyeSize,
//               finShape ("rhomb" or "round"), web, armLights,
//               unevenEyes (one big eye, one small)
// 6 eel         length, thick, lightEvery, amp, freq, waves, head,
//               wobble, eyeSize, fin (dorsal fin), mouth (gulper jaw),
//               snipe (thin beak length, as a fraction of head),
//               tailLight (a light at the tail tip), finCol ([r, g, b]
//               of the fin), crest (rays on the head, in finCol)
// 7 angler      body (diameter), round (height over length), wobble,
//               mouth (gape 0..1), teeth, rod (length), curl (0..1),
//               esca (size), eye, fin, flick, tuft (branches on the esca 0..1),
//               rodFrom ("forehead" or "chin"), chinTree (a lit branching
//               barbel under the chin), warts (lights on the back), male
//               (a tiny male attached under the belly), rays (long fan fin
//               rays), bumps (bony bumps), round can go below 0.7 for a
//               long body
// 8 comb        length, width (as a fraction), wobble, rows, rowLen,
//               dashes, shimmer (speed), shape ("oval", "lobed", "belt",
//               "sac" open at the front), tentacles (1 or 0), tentLen (as a
//               multiple of length), flesh tints the body
// 9 shrimp      length, segments, curl (bend of the abdomen 0..1),
//               antenna (as a multiple of length), legs, lightEvery,
//               rostrum, eye ([0, 0] = no eyes), fan, wobble, flick,
//               copepod (teardrop body, antennae held out sideways)
// 10 octopus    mantle, round, wobble, arms, armLen (as a multiple of
//               mantle), web (0 free arms .. 1 full umbrella), fins
//               (ear fins as a fraction of mantle, 0 = none), eye,
//               wave, spread (how wide the arms fan), armLights (0 none,
//               1 on the tips, 2 a row down every arm), mouthRing (a ring
//               of light round the mouth)
///////////////////////////////////////////////////////////////////

// *** the named body colours a species can ask for with flesh
let fleshColours = {
  black: [6, 6, 10],
  red: [120, 22, 34],
  darkred: [64, 10, 20],
  silver: [196, 206, 216],
  brown: [96, 64, 44],
  white: [226, 228, 232],
  orange: [200, 90, 40]
};

///////////////////////////////////////////////////////////////////
// Species look
// One row per real species, keyed by its scientific name, written
// from the traits in the Species section. Each sets the genes above that the
// plan's defaults get wrong for that animal; anything not set comes
// from the plan range, narrowed by the name's window. A `look`
// object on the the Species section row is merged on top of this.
///////////////////////////////////////////////////////////////////

// *** make a species look like its real animal here
let speciesLook = {
  // ---- plan 0 sparkle ----
  // an orange bead with two silver eyes
  "Gigantocypris agassizi": { shape: "bead", noLight: true, size: [3.5, 4.5] },
  "Pyrocystis fusiformis": { shape: "spindle", size: [2.4, 3.4] },
  "Ceratocorys horrida": { shape: "spiny", size: [2, 2.8] },
  "Lingulodinium polyedra": { shape: "dot" },
  "Pyrodinium bahamense": { shape: "dot" },
  // shines, does not glow
  "Sapphirina opalina": { shape: "sapphire", noLight: true, size: [2.6, 3.4] },
  "Vargula hilgendorfii": { shape: "bean", halo: 1.6 }, // puffs a glowing cloud
  "Tomopteris helgolandica": { shape: "worm", size: [2.4, 3] },
  "Metridia pacifica": { shape: "copepod", halo: 1.3 },
  "Noctiluca scintillans": { shape: "dot", size: [2.6, 3.6] },
  "Metridia longa": { shape: "copepod", halo: 1.3 },
  "Vargula tsujii": { shape: "bean", halo: 1.6 },
  // ---- plan 1 fish ----
  "Macropinna microstoma": { noLight: true, flesh: [40, 44, 52], length: [24, 30], height: [0.42, 0.5], tubeEyes: true, dome: true, finSize: [1.8, 2.2], eye: [2.6, 3.2], tail: [7, 9] },
  "Sternoptyx diaphana": { flesh: [172, 182, 198], keel: [0.5, 0.7], height: [0.7, 0.85], length: [16, 20], lightEvery: [1, 1], tubeEyes: true, eye: [3, 3.6] },
  "Cyclothone microdon": { flesh: [40, 30, 28], height: [0.2, 0.26], bigMouth: true, teeth: 8, lightEvery: [1, 1], eye: [1.4, 1.8], glow: 0.6 },
  "Bathylagus euryops": { noLight: true, flesh: [44, 36, 32], height: [0.3, 0.36], eye: [3.2, 3.8], tail: [6, 8] },
  "Dolichopteryx longipes": { flesh: "clear", height: [0.14, 0.18], length: [30, 38], snout: true, tubeEyes: true, lightEvery: [3, 3], finSize: [1.6, 2] },
  "Argyropelecus hemigymnus": { flesh: [172, 182, 198], keel: [0.5, 0.7], height: [0.65, 0.8], length: [16, 20], lightEvery: [1, 1], tubeEyes: true, eye: [3, 3.6] },
  "Myctophum punctatum": { rows: 2, lightEvery: [1, 1], eye: [3, 3.6], height: [0.3, 0.36] },
  "Benthosema glaciale": { height: [0.36, 0.42], lightEvery: [1, 1], eye: [3, 3.6], silver: true },
  "Maurolicus muelleri": { height: [0.24, 0.3], silver: true, lightEvery: [1, 1] },
  "Argyropelecus aculeatus": { flesh: [172, 182, 198], keel: [0.5, 0.7], height: [0.65, 0.8], length: [18, 22], lightEvery: [1, 1], tubeEyes: true, eye: [3, 3.6] },
  "Ceratoscopelus warmingii": { height: [0.26, 0.32], rows: 2, lightEvery: [1, 2], eye: [3, 3.4] },
  "Electrona antarctica": { height: [0.38, 0.44], silver: true, lightEvery: [1, 1], eye: [3, 3.6] },
  "Stenobrachius leucopsarus": { flesh: [40, 60, 64], height: [0.3, 0.36], rows: 2, lightEvery: [1, 1], finSize: [0.6, 0.8] },
  "Cyclothone signata": { flesh: "clear", height: [0.18, 0.24], bigMouth: true, teeth: 6, lightEvery: [2, 2], eye: [1.4, 1.8] },
  // ---- plan 2 jelly ----
  "Atolla wyvillei": { flesh: "darkred", dome: [0.4, 0.5], scallops: [8, 10], tentacles: [14, 18], gens: [1, 1], length: [16, 26], longTentacle: 1, rimLights: [12, 16] },
  "Stygiomedusa gigantea": { form: "phantom", noLight: true, flesh: [110, 40, 36], dome: [0.7, 0.85], bell: [56, 64] },
  "Marrus orthocanna": { form: "siphonophore", bells: [4, 6], stem: [70, 100], flesh: [230, 110, 80] },
  "Deepstaria enigmatica": { form: "bag", bell: [60, 64], dome: [0.9, 1.1], tentacles: [0, 0], glow: 0.5 },
  "Praya dubia": { form: "siphonophore", bells: [2, 2], stem: [120, 150], flesh: [220, 225, 235] },
  "Halitrephes maasi": { form: "firework", dome: [0.35, 0.45], tentacles: [10, 14], gens: [1, 1], length: [10, 16] },
  "Periphylla periphylla": { form: "helmet", flesh: "darkred", dome: [1.2, 1.4], bell: [36, 44], tentacles: [10, 12], gens: [1, 1], length: [18, 26], stiff: true },
  "Nanomia bijuga": { form: "siphonophore", bells: [5, 8], stem: [60, 80], flesh: [230, 130, 70] },
  "Colobonema sericeum": { dome: [0.55, 0.65], tentacles: [24, 32], gens: [1, 1], length: [14, 20], flesh: "white", rimLights: [8, 10] },
  "Pelagia noctiluca": { flesh: [160, 100, 170], dome: [0.6, 0.7], bell: [36, 44], tentacles: [8, 8], gens: [2, 2], length: [60, 90], angle: [4, 8], oral: 4, warts: [18, 26] },
  "Apolemia uvaria": { form: "siphonophore", bells: [2, 3], stem: [120, 150], flesh: [220, 220, 235], tentacles: [2, 2] },
  "Solmissus incisa": { form: "plate", dome: [0.18, 0.25], bell: [52, 60], tentacles: [22, 24], gens: [1, 1], length: [26, 34], stiff: true },
  // ---- plan 3 sea pen ----
  "Umbellula encrinus": { form: "umbellula", stem: [90, 110], stalk: [10, 14], flesh: [210, 180, 190] },
  "Funiculina quadrangularis": { form: "whip", stem: [100, 120], weight: [1.2, 1.6], flesh: [220, 210, 190] },
  "Pennatula phosphorea": { angle: [55, 70], gens: [4, 4], step: [5, 7], flesh: [150, 40, 60], weight: [2.6, 3.4], stalk: [12, 18] },
  "Paragorgia arborea": { form: "tree", noLight: true, flesh: [235, 120, 130], stem: [70, 90], weight: [3, 4] },
  "Endoxocrinus parrae": { form: "lily", flesh: [230, 200, 150], stem: [60, 80], stalk: [20, 30] },
  "Iridogorgia magnispiralis": { form: "spiral", flesh: [220, 210, 170], stem: [90, 110], weight: [1.4, 1.8] },
  "Ptilosarcus gurneyi": { angle: [50, 65], gens: [4, 4], step: [6, 8], flesh: [230, 140, 50], weight: [3, 4], stalk: [16, 22] },
  "Proisocrinus ruberrimus": { form: "lily", flesh: "red", stem: [70, 90], stalk: [20, 30] },
  // ---- plan 4 dragon ----
  "Malacosteus niger": { flesh: "black", barbel: [0, 0], jaw: [0.6, 0.9], fangs: 6, fangLen: [1.6, 2], eyeLights: true, beamStrength: 1.2, height: [0.12, 0.15] },
  "Pachystomias microdon": { flesh: "black", barbel: [4, 7], antlerDepth: [1, 1], fangs: 4, eyeLights: true, beamStrength: 1.2, eyeSize: [1.3, 1.5] },
  "Grammatostomias flagellibarba": { flesh: "black", barbel: [45, 60], antlerDepth: [1, 1], antlerLen: [3, 5], lightEvery: [1, 1], eyeLights: true, beamStrength: 0.4 },
  "Echiostoma barbatum": { flesh: "black", barbel: [20, 28], antlerDepth: [1, 2], fangs: 6, fangLen: [1.3, 1.5], lightEvery: [1, 1], beamStrength: 0.6 },
  "Chauliodus sloani": { flesh: [30, 34, 44], spine: true, fangs: 6, fangLen: [2, 2.4], barbel: [0, 0], beamStrength: 0.3, lightEvery: [1, 1], height: [0.11, 0.14] },
  "Stomias boa": { flesh: [96, 104, 120], scales: true, barbel: [12, 18], antlerDepth: [1, 1], fangs: 6, fangLen: [1.3, 1.5], lightEvery: [1, 1], length: [120, 140], height: [0.09, 0.11], beamStrength: 0.4 },
  "Idiacanthus atlanticus": { flesh: "black", length: [150, 180], height: [0.06, 0.08], barbel: [22, 30], antlerDepth: [1, 1], fangs: 6, fangLen: [1.4, 1.6], lightEvery: [1, 1], beamStrength: 0.5 },
  "Chauliodus macouni": { flesh: "black", spine: true, fangs: 6, fangLen: [2, 2.4], barbel: [0, 0], beamStrength: 0.3, lightEvery: [1, 1], height: [0.11, 0.14] },
  // ---- plan 5 squid ----
  "Vampyroteuthis infernalis": { flesh: "darkred", web: true, arms: [8, 8], armLen: [12, 16], longArm: [0.4, 0.5], fin: [0.5, 0.6], finShape: "round", eyeSize: [1.5, 1.6], armLights: true, lightEvery: [4, 4] },
  "Magnapinna pacifica": { flesh: [200, 190, 210], mantle: [20, 26], fin: [0.9, 1.1], finShape: "round", longArm: [2.6, 3.2], arms: [8, 8], armLen: [14, 18], lightEvery: [5, 5], glow: 0.4 },
  "Architeuthis dux": { noLight: true, flesh: [120, 50, 40], longArm: [2.2, 2.6], arms: [8, 8], armLen: [14, 18], eyeSize: [1.6, 1.8], fin: [0.2, 0.28], height: [0.3, 0.36] },
  "Teuthowenia pellucida": { flesh: "clear", height: [0.5, 0.6], eyeSize: [2, 2.2], longArm: [0.6, 0.8], armLen: [6, 8], lightEvery: [3, 3] },
  "Dosidicus gigas": { flesh: "red", fin: [0.5, 0.6], mantle: [36, 42], arms: [8, 8], lightEvery: [3, 3], glow: 0.6 },
  "Histioteuthis heteropsis": { flesh: "red", mantle: [22, 28], height: [0.5, 0.6], unevenEyes: true, lightEvery: [1, 1], longArm: [0.7, 0.9] },
  "Watasenia scintillans": { flesh: [120, 40, 50], armLights: true, lightEvery: [1, 1], mantle: [24, 30] },
  "Abralia veranyi": { flesh: [110, 50, 60], lightEvery: [1, 1], fin: [0.35, 0.42], longArm: [1.2, 1.5] },
  // ---- plan 6 eel ----
  "Eurypharynx pelecanoides": { flesh: "black", mouth: true, head: [26, 32], thick: [4, 6], length: [110, 130], lightEvery: [8, 8], tailLight: true, freq: [0.05, 0.08], eyeSize: [0.6, 0.7] },
  "Cyema atrum": { noLight: true, flesh: [40, 30, 28], length: [36, 46], thick: [5, 7], snipe: [1.4, 1.8], head: [8, 10], waves: [0.8, 1] },
  "Saccopharynx ampullaceus": { flesh: "black", mouth: true, head: [20, 26], thick: [5, 7], length: [120, 140], lightEvery: [8, 8], tailLight: true, freq: [0.05, 0.08], eyeSize: [0.6, 0.7] },
  "Synaphobranchus kaupii": { noLight: true, flesh: [90, 80, 70], thick: [6, 8], length: [80, 100], snipe: [0.4, 0.6], fin: true },
  "Nemichthys scolopaceus": { noLight: true, flesh: [90, 80, 70], thick: [2, 2.8], length: [110, 130], snipe: [1.8, 2.2], head: [8, 10], amp: [4, 6] },
  "Aphanopus carbo": { noLight: true, flesh: [30, 28, 34], thick: [10, 13], length: [110, 130], fin: true, finCol: [60, 56, 66], head: [14, 18], eyeSize: [1.4, 1.6], amp: [3, 5] },
  "Regalecus glesne": { noLight: true, flesh: [190, 198, 210], thick: [11, 14], length: [140, 170], fin: true, finCol: [230, 60, 60], crest: true, head: [12, 16], amp: [3, 5], waves: [0.8, 1] },
  "Serrivomer beanii": { noLight: true, flesh: [110, 120, 150], thick: [4, 6], length: [90, 110], snipe: [1, 1.3], head: [9, 11] },
  // ---- plan 7 angler ----
  "Melanocetus johnsonii": { flesh: "black", mouth: [0.8, 0.95], teeth: [10, 14], rod: [10, 14], esca: [3, 3.6] },
  "Gigantactis vanhoeffeni": { flesh: "black", round: [0.45, 0.55], body: [34, 42], mouth: [0.3, 0.4], teeth: [4, 6], rod: [50, 70], curl: [0, 0.15], esca: [2, 2.6] },
  "Linophryne arborifera": { flesh: "black", body: [24, 30], chinTree: true, tuft: [1, 1], rod: [8, 12], mouth: [0.6, 0.8] },
  "Himantolophus groenlandicus": { flesh: "brown", round: [0.95, 1.05], body: [36, 44], rod: [8, 12], esca: [3.6, 4.2], tuft: [0.8, 1], bumps: true, mouth: [0.5, 0.6] },
  "Caulophryne jordani": { flesh: "black", rays: true, rod: [16, 22], esca: [1.6, 2], mouth: [0.5, 0.7] },
  "Cryptopsaras couesii": { flesh: [40, 30, 26], round: [0.6, 0.7], rod: [3, 5], esca: [2.4, 3], warts: 3, mouth: [0.6, 0.8] },
  "Ceratias holboelli": { flesh: "brown", round: [0.5, 0.6], body: [40, 48], rod: [10, 14], esca: [3, 3.6], warts: 2, male: true, mouth: [0.6, 0.8] },
  "Lasiognathus saccostoma": { flesh: "black", body: [24, 30], rod: [20, 26], curl: [0.9, 1], mouth: [0.9, 1], teeth: [6, 8], tuft: [1, 1] },
  // ---- plan 8 comb ----
  "Lampocteis cruentiventer": { shape: "lobed", tentacles: 0, flesh: [120, 20, 50] },
  "Bathocyroe fosteri": { shape: "lobed", tentacles: 0, rowLen: [0.4, 0.5], length: [14, 18] },
  "Thalassocalyce inconstans": { shape: "lobed", tentacles: 0, width: [0.9, 1.1], rowLen: [0.4, 0.5], glow: 0.6 },
  "Beroe cucumis": { shape: "sac", tentacles: 0, flesh: [200, 120, 150] },
  "Bolinopsis infundibulum": { shape: "lobed", tentacles: 0, length: [24, 32] },
  "Cestum veneris": { shape: "belt", tentacles: 0, length: [30, 36] },
  "Euplokamis dunlapae": { shape: "oval", tentacles: 1, tentLen: [1.6, 2.2], length: [16, 22] },
  "Pleurobrachia pileus": { shape: "oval", width: [0.85, 1], tentacles: 1, tentLen: [2, 2.6], length: [14, 18] },
  // ---- plan 9 shrimp ----
  "Gnathophausia ingens": { flesh: "red", rostrum: [0.4, 0.5], length: [34, 40], curl: [0.3, 0.5], antenna: [1.2, 1.5] },
  "Hymenodora glacialis": { flesh: "orange", curl: [0.5, 0.8], antenna: [1.2, 1.4] },
  "Rimicaris exoculata": { noLight: true, flesh: [220, 200, 200], eye: [0, 0], rostrum: [0.05, 0.1], curl: [0.4, 0.6], antenna: [0.7, 0.9] },
  "Meganyctiphanes norvegica": { flesh: "clear", eye: [2.4, 3], lightEvery: [1, 1], curl: [0.2, 0.4], length: [20, 26] },
  "Acanthephyra purpurea": { flesh: "red", rostrum: [0.35, 0.45], antenna: [1.3, 1.6], curl: [0.5, 0.8] },
  "Euphausia pacifica": { flesh: "clear", eye: [2.4, 3], lightEvery: [1, 1], curl: [0.2, 0.4], length: [16, 22] },
  "Euphausia superba": { flesh: [230, 170, 150], eye: [2.4, 3], lightEvery: [1, 1], curl: [0.2, 0.4], length: [22, 28] },
  "Gaussia princeps": { copepod: true, flesh: "orange", length: [14, 18], antenna: [1.2, 1.5], lightEvery: [1, 1] },
  // ---- plan 10 octopus ----
  "Grimpoteuthis bathynectes": { noLight: true, flesh: [130, 120, 140], fins: [0.3, 0.4], web: [0.7, 0.85], armLen: [1, 1.3], eye: [4, 5] },
  "Stauroteuthis syrtensis": { flesh: [150, 70, 70], web: [0.6, 0.8], fins: [0.15, 0.2], armLights: 2, armLen: [1.4, 1.8] },
  "Opisthoteuthis californiana": { noLight: true, flesh: "orange", round: [0.5, 0.6], fins: [0.12, 0.16], web: [0.9, 1], armLen: [0.6, 0.8], eye: [4, 5], spread: [1.1, 1.3] },
  "Cirrothauma murrayi": { noLight: true, flesh: "clear", web: [0.6, 0.8], fins: [0.2, 0.25], eye: [1, 1.2], armLen: [1.2, 1.5] },
  "Japetella diaphana": { flesh: "clear", mantle: [18, 22], armLen: [0.8, 1], mouthRing: true, eye: [3, 3.6], glow: 1.2 },
  "Vitreledonella richardi": { noLight: true, flesh: "clear", armLen: [2.4, 3], eye: [1.6, 2], spread: [0.4, 0.6] }
};

let shadowCol = [58, 68, 88]; // *** the unlit grey of a locked guide row

///////////////////////////////////////////////////////////////////
// Shared sprites
// One soft halo per species, made the first time one is born.
// Drawn with blendMode(ADD) its size alone sets how bright it reads,
// so no tint() is needed (tint() repaints the pixels and is slow).
///////////////////////////////////////////////////////////////////

let haloSprites = [];
let bodiesBorn = 0;
let worldNoiseSeed = 2026; // *** the noise seed the rest of the sketch gets back after a birth

// makes the species' soft glow sprite the first time one of it is born: fading discs
function ensureHalo(species) {
  if (haloSprites[species] !== undefined) return;
  let c = speciesList[species].col;
  let g = createGraphics(64, 64);
  g.noStroke();
  // concentric discs that fade out: a cheap radial gradient
  for (let i = 12; i > 0; i--) {
    let u = i / 12;
    g.fill(c[0], c[1], c[2], 3 + 20 * (1 - u) * (1 - u));
    g.circle(32, 32, 64 * u);
  }
  haloSprites[species] = g;
}

// hands random() and noise() back after a body is grown, so the water and the next birth differ
function releaseSeeds() {
  bodiesBorn++;
  noiseSeed(worldNoiseSeed);
  randomSeed(floor(millis() * 1000) + bodiesBorn);
}

///////////////////////////////////////////////////////////////////
// Body Object
// One per creature. Sets the seed, grows a genome from it, caches
// the still parts in a sprite, then render() draws it at a position.
///////////////////////////////////////////////////////////////////

// one body: picks its seed, works out its genes and flesh colour, grows the sprite for its plan
function Body(species, seed) {
  this.species = species;
  this.info = speciesList[species];
  this.plan = this.info.plan;
  this.look = this.info; // .col is the glow colour
  this.size = this.info.size;
  this.genes = planGenes[this.plan];
  this.tweak = speciesTweak(species); // the kinds its name matches plus any override
  this.windows = speciesWindows(species); // its own narrow slice of each plan range
  this.seed = seed;

  // the collision radius, the Creatures section and the line read this
  this.radius = planRadius[this.plan] * this.size;

  this.sprite = null; // the still parts, drawn once at birth
  this.tentacles = null; // the jelly's hanging part, it sways on its own
  this.shadows = {}; // dark copies of the sprites, made when the guide first asks
  this.ox = 0; // where the creature's position sits inside the sprite
  this.oy = 0;
  this.tox = 0; // same for the tentacle sprite
  this.toy = 0;
  this.lights = []; // photophores in body coordinates: {x, y, r, k}, k is 0..1 along the body
  // how much room the whole drawing takes, for the portraits
  this.box = { x0: -4, y0: -4, x1: 4, y1: 4 };
  this.haloY = 0; // where the flash halo is centred
  // sprites of big species are drawn larger so scaling them up stays sharp
  this.sk = max(1, this.size);

  // from here on every random() and noise() comes from the seed, so
  // the same seed always grows the same body. The species goes into
  // the mix so two species on one plan differ even with equal seeds.
  this.mix = seed + species * 1000003;
  randomSeed(this.mix); // after speciesWindows() above, which borrowed random() for a moment
  noiseSeed(this.mix);
  ensureHalo(species);
  this.phase = random(TWO_PI); // so a school's fins are not all in step

  // the body colour: a dull shade of the glow unless the species names one
  let c = this.look.col;
  let flesh = this.tweak.flesh;
  // see-through: faint fill, an edge, bright lights
  this.clear = this.tweak.glass === true || flesh === "clear";
  if (flesh instanceof Array) this.bodyCol = flesh;
  else if (flesh !== undefined && fleshColours[flesh] !== undefined) this.bodyCol = fleshColours[flesh];
  else this.bodyCol = mixColour(c, [10, 16, 32], 0.7);
  if (this.tweak.ink) this.bodyCol = mixColour(c, [4, 6, 12], 0.93);
  this.glow = this.tweak.glow !== undefined ? this.tweak.glow : 1;
  // makes no light: its col is a body tint, a strike only reflects
  this.noLight = this.tweak.noLight === true;
  if (this.noLight) this.glow = 0;

  if (this.plan === 0) this.growSparkle();
  else if (this.plan === 1) this.growFish();
  else if (this.plan === 2) this.growJelly();
  else if (this.plan === 3) this.growSeaPen();
  else if (this.plan === 4) this.growDragon();
  else if (this.plan === 5) this.growSquid();
  else if (this.plan === 6) this.growEel();
  else if (this.plan === 7) this.growAngler();
  else if (this.plan === 8) this.growComb();
  else if (this.plan === 9) this.growShrimp();
  else this.growOctopus();

  releaseSeeds();
}

// a gene range: the species' override if it has one, else the window its name cut from the plan
Body.prototype.gene = function (name) {
  if (this.tweak[name] !== undefined) return this.tweak[name];
  if (this.windows[name] !== undefined) return this.windows[name];
  return this.genes[name];
};

// a gene that is a count or an amount: a plain number as it is, a range picked from
Body.prototype.amount = function (name) {
  let g = this.gene(name);
  if (g instanceof Array) return pickGene(g);
  return g === undefined ? 0 : g;
};

///////////////////////////////////////////////////////////////////
// Species variation
// Worked out once per species and remembered, so the 600th sparkle
// costs nothing extra. All of it comes from the name, not the index,
// so a species keeps its look when the Species section is reordered.
///////////////////////////////////////////////////////////////////

let tweakCache = [];
let windowCache = [];

// modulo (week 3): a small hash of the species name, used as its own seed
function nameHash(str) {
  let h = 7;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % 2147483647;
  }
  return h;
}

// the species' look: its speciesLook row by scientific name, with the row's own look on top
function speciesTweak(species) {
  if (tweakCache[species] !== undefined) return tweakCache[species];
  let info = speciesList[species];
  let t = {};
  let over = speciesLook[info.latin];
  if (over === undefined) over = speciesLook[info.name];
  if (over !== undefined) {
    for (let key in over) t[key] = over[key];
  }
  if (info.look !== undefined) {
    for (let key in info.look) t[key] = info.look[key];
  }
  tweakCache[species] = t;
  return t;
}

// cuts each species its own narrow slice of every plan range, placed by the name's seed
function speciesWindows(species) {
  if (windowCache[species] !== undefined) return windowCache[species];
  let info = speciesList[species];
  let ranges = planGenes[info.plan];
  let w = {};
  randomSeed(nameHash(info.name));
  for (let key in ranges) {
    let r = ranges[key];
    if (!(r instanceof Array)) continue;
    let span = r[1] - r[0];
    let centre = r[0] + random() * span;
    // *** 0.17 = half the window width
    w[key] = [max(r[0], centre - span * 0.17), min(r[1], centre + span * 0.17)];
  }
  windowCache[species] = w;
  return w;
}

///////////////////////////////////////////////////////////////////
// Growing
// One grow function per plan. Each reads its ranges with gene(),
// draws the still parts into this.sprite and fills this.lights with
// where the photophores are. Everything is in size-1 units; render()
// scales the whole body by this.size.
///////////////////////////////////////////////////////////////////

// 0 - sparkle: no sprite, just a dot size, a twinkle speed and a shape. hundreds share one halo
Body.prototype.growSparkle = function () {
  this.dot = pickGene(this.gene("size")) * this.size;
  this.twinkle = pickGene(this.gene("twinkle"));
  this.halo = this.tweak.halo !== undefined ? this.tweak.halo : 1;
  this.shape = this.tweak.shape !== undefined ? this.tweak.shape : "dot";
  this.dotCol = this.look.col;
  this.box = { x0: -this.dot * 1.5, y0: -this.dot * 1.5, x1: this.dot * 1.5, y1: this.dot * 1.5 };
  if (this.tweak.shimmer) {
    // modulo (week 3): the seed picks one of three tints to lean toward
    let tints = [[255, 170, 200], [170, 255, 220], [255, 240, 170]];
    this.dotCol = mixColour(this.look.col, tints[floor(this.mix) % 3], 0.45);
  }
};

// 1 - fish: a small countershaded body, a big eye and a row of lights along the belly
Body.prototype.growFish = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let len = pickGene(this.gene("length"));
  let h = len * pickGene(this.gene("height"));
  let n = this.genes.segments;
  let lightEvery = pickGeneInt(this.gene("lightEvery"));
  let stripeEvery = pickGeneInt(this.gene("stripeEvery"));
  let keel = this.amount("keel");
  let barbel = this.amount("barbel");
  let teeth = round(this.amount("teeth"));
  this.len = len;
  this.tail = pickGene(this.gene("tail"));
  this.flick = pickGene(this.gene("flick"));

  // noise (week 5): the silhouette. A keel pushes the belly down
  // into the deep hatchet shape.
  let pts = this.outline(len / 2, h / 2, pickGene(this.gene("wobble")), 36);
  if (keel > 0) {
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].y > 0) pts[i].y *= 1 + keel * (1 - abs(pts[i].x) / (len / 2));
    }
    h *= 1 + keel * 0.5;
  }

  let snout = tw.snout ? len * 0.3 : 0;
  let above = tw.tubeEyes ? 4 : 0;
  this.ox = len / 2 + 2;
  this.oy = h / 2 + 2 + above;
  this.sprite = this.makeSprite(len + 4 + snout, h + 4 + barbel + above);
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  this.fleshStyle(s);
  fillPolygon(s, pts);
  s.noStroke();

  // modulo (week 3): every stripeEvery-th segment is a shade paler
  let pale = mixColour(c, [220, 235, 240], 0.5);
  let segW = len / n;
  if (!this.clear && !tw.ink) {
    for (let i = 1; i < n - 1; i++) {
      if (i % stripeEvery !== 0) continue;
      s.fill(pale[0], pale[1], pale[2], 45);
      fillPolygon(s, outlineStrip(pts, -len / 2 + i * segW, -len / 2 + (i + 1) * segW));
    }
    // a silver belly, dark back: countershading like a real fish
    s.fill(220, 235, 240, tw.silver ? 120 : 60);
    s.ellipse(0, h * 0.12, len * (tw.silver ? 0.75 : 0.6), h * 0.4);
  }

  // the eye, big and near the nose. A needle gets a beak in front of it,
  // a bristlemouth a jaw that runs most of the way back, with teeth.
  let eye = pickGene(this.gene("eye"));
  let finSize = this.gene("finSize") !== undefined ? pickGene(this.gene("finSize")) : 1;
  // a pectoral fin, bigger for the paddle-finned barreleye
  s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 200);
  s.triangle(len * 0.1, h * 0.1, len * 0.1 - h * 0.5 * finSize, h * 0.05, len * 0.1 - h * 0.35 * finSize, h * 0.45);
  if (tw.tubeEyes) {
    // tube eyes that look straight up, under a clear dome for the barreleye
    if (tw.dome) {
      s.fill(c[0], c[1], c[2], 22);
      s.stroke(c[0], c[1], c[2], 110);
      s.strokeWeight(0.7);
      s.arc(len * 0.22, -h * 0.1, len * 0.5, h * 0.9, PI, TWO_PI);
      s.noStroke();
    }
    s.fill(c[0], c[1], c[2], 230);
    s.ellipse(len * 0.3, -h * 0.22, eye * 0.7, eye * 1.2);
    s.ellipse(len * 0.16, -h * 0.22, eye * 0.7, eye * 1.2);
    s.fill(4, 8, 16);
    s.ellipse(len * 0.3, -h * 0.3, eye * 0.5, eye * 0.5);
    s.ellipse(len * 0.16, -h * 0.3, eye * 0.5, eye * 0.5);
  } else {
    s.fill(225, 238, 242);
    s.circle(len * 0.3, -h * 0.08, eye);
    s.fill(4, 8, 16);
    s.circle(len * 0.31, -h * 0.08, eye * 0.55);
  }
  if (tw.snout) {
    s.stroke(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2]);
    s.strokeWeight(1.4);
    s.line(len / 2 - 2, 0, len / 2 + snout, -1);
    s.noStroke();
  }
  if (tw.bigMouth || teeth > 0) {
    s.stroke(c[0], c[1], c[2], 120);
    s.strokeWeight(0.7);
    let jx = tw.bigMouth ? len * 0.05 : len * 0.3;
    s.line(len / 2 - 1, h * 0.05, jx, h * 0.3);
    for (let i = 0; i < teeth; i++) {
      let u = (i + 0.5) / teeth;
      let tx = lerp(len / 2 - 1, jx, u);
      let ty = lerp(h * 0.05, h * 0.3, u);
      // modulo (week 3): long and short teeth alternate
      s.line(tx, ty, tx, ty + (i % 2 === 0 ? 2.2 : 1.4));
    }
    s.noStroke();
  }
  if (barbel > 0) {
    s.stroke(c[0], c[1], c[2], 150);
    s.strokeWeight(0.8);
    let bx = len * 0.3;
    let by = sliceOutline(pts, bx).bottom;
    s.line(bx, by, bx - barbel * 0.3, by + barbel);
    this.lights.push({ x: bx - barbel * 0.3, y: by + barbel, r: 1.2, k: 1 });
    s.noStroke();
  }

  // modulo (week 3) again: a photophore on every lightEvery-th belly
  // segment, and a second row up the flank for species with rows: 2
  for (let i = 1; i < n - 1; i++) {
    if (i % lightEvery !== 0) continue;
    let x = -len / 2 + (i + 0.5) * segW;
    let sl = sliceOutline(pts, x);
    this.lights.push({ x: x, y: sl.bottom - 1.2, r: this.clear || tw.ink ? 1.6 : 1.3, k: i / n });
    if (tw.rows === 2) this.lights.push({ x: x, y: (sl.top + sl.bottom) * 0.5 + h * 0.08, r: 1, k: i / n });
  }
  this.bakeLights(s, this.clear || tw.ink ? 140 : 90);
  this.box = { x0: -this.ox - this.tail, y0: -this.oy, x1: len + 4 + snout - this.ox, y1: h + 4 + barbel - this.oy };
  if (tw.tubeEyes) this.box.y0 -= eye;
};

// 2 - jelly: a see-through dome with a scalloped rim, rim lights and l-system tentacles below
Body.prototype.growJelly = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let form = tw.form !== undefined ? tw.form : "medusa";
  if (form === "siphonophore") {
    this.growSiphonophore();
    return;
  }
  let bw = pickGene(this.gene("bell"));
  let bh = bw * pickGene(this.gene("dome"));
  let scallops = pickGeneInt(this.gene("scallops"));
  let nT = pickGeneInt(this.gene("tentacles"));
  let nL = pickGeneInt(this.gene("rimLights"));
  let angle = radians(pickGene(this.gene("angle")));
  let gens = pickGeneInt(this.gene("gens"));
  let tLen = pickGene(this.gene("length"));
  let oral = round(this.amount("oral"));
  let longT = round(this.amount("longTentacle"));
  let warts = round(this.amount("warts"));
  this.breathe = pickGene(this.gene("breathe"));
  this.haloY = -bh * 0.4;

  // noise (week 5): the top half of a wobbled ellipse is the dome.
  // The rim comes back along y = 0 with a sine scallop (waves, week 4).
  // A helmet pulls the dome up into a cone, a bag flattens its top.
  let pts = this.outline(bw / 2, bh, pickGene(this.gene("wobble")), 48);
  let half = pts.length / 2;
  let dome = [];
  for (let i = half; i < pts.length; i++) {
    let q = { x: pts[i].x, y: pts[i].y };
    let u = 1 - abs(q.x) / (bw / 2);
    if (form === "helmet") q.y *= 0.55 + 0.75 * u * u; // pointed
    if (form === "bag") q.y *= 1.3 - 0.4 * u; // squarer, billowing
    dome.push(q);
  }
  dome.push(pts[0]);
  let m = scallops * 6;
  for (let j = 1; j < m; j++) {
    let u = j / m;
    dome.push({ x: lerp(pts[0].x, pts[half].x, u), y: abs(sin(u * PI * scallops)) * (form === "plate" ? 1 : 3) });
  }

  let sh = bh * 1.4 + 12;
  this.ox = bw / 2 + 4;
  this.oy = bh * 1.4 + 4;
  this.sprite = this.makeSprite(bw + 8, sh);
  let s = this.sprite;
  s.translate(this.ox, this.oy);

  let bells = 1;
  for (let b = 0; b < bells; b++) {
    s.push();
    // the bell is see-through, so a soft fill with a brighter edge.
    // A flesh colour (Atolla's deep red) tints it more strongly.
    if (tw.flesh !== undefined && !this.clear) {
      s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 150);
      s.stroke(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 230);
    } else {
      s.fill(c[0], c[1], c[2], form === "bag" ? 28 : 55);
      s.stroke(c[0], c[1], c[2], form === "bag" ? 90 : 150);
    }
    s.strokeWeight(1.2);
    fillPolygon(s, dome);
    // modulo (week 3): a radial canal runs down to every other scallop,
    // or to every one for the sun bell. A firework's canals are the
    // whole show: many, bright, bursting from the centre. A bag has a
    // net of canals instead, a grid over the bell.
    s.strokeWeight(0.8);
    s.stroke(c[0], c[1], c[2], 60);
    let canalEvery = tw.rays || form === "firework" ? 1 : 2;
    if (form === "firework") {
      s.strokeWeight(1.2);
      s.stroke(c[0], c[1], c[2], 200);
      for (let k = 0; k < 16; k++) {
        let ang = PI + ((k + 0.5) / 16) * PI;
        s.line(0, -bh * 0.3, cos(ang) * bw * 0.46, -bh * 0.3 + sin(ang) * bh * 0.65);
        this.lights.push({ x: cos(ang) * bw * 0.46, y: -bh * 0.3 + sin(ang) * bh * 0.65, r: 1.4, k: k / 16 });
      }
    } else if (form === "bag") {
      s.stroke(c[0], c[1], c[2], 90);
      for (let k = 1; k < 7; k++) {
        let x = lerp(-bw * 0.45, bw * 0.45, k / 7);
        s.line(x, sliceOutline(dome, x).top + 1, x, -1);
      }
      for (let k = 1; k < 4; k++) {
        let y = -bh * 0.22 * k;
        s.line(-bw * 0.46 * (1 - k * 0.12), y, bw * 0.46 * (1 - k * 0.12), y);
      }
    } else {
      for (let k = 0; k <= scallops; k++) {
        if (k % canalEvery !== 0) continue;
        s.line(0, -bh * 0.85, lerp(pts[0].x, pts[half].x, k / scallops), 0);
      }
    }
    s.noStroke();
    if (warts > 0) {
      // the mauve stinger's warts: dots over the bell (seeded)
      s.fill(c[0], c[1], c[2], 110);
      for (let k = 0; k < warts; k++) {
        let ang = PI + random(0.08, 0.92) * PI;
        let v = random(0.3, 0.95);
        s.circle(cos(ang) * bw * 0.5 * v, sin(ang) * bh * v, 1.4);
      }
    }
    if (tw.rings) {
      // the moon jelly's four horseshoe gonads, seen through the bell
      s.noFill();
      s.stroke(c[0], c[1], c[2], 120);
      s.strokeWeight(1.5);
      for (let k = 0; k < 4; k++) {
        s.arc(lerp(-bw * 0.22, bw * 0.22, k / 3), -bh * 0.45, bw * 0.14, bh * 0.3, PI * 0.1, PI * 0.9);
      }
      s.noStroke();
    } else if (form !== "bag" && form !== "firework") {
      // the stomach, a smaller dome inside
      s.fill(c[0], c[1], c[2], 90);
      s.push();
      s.translate(0, -bh * 0.22);
      s.scale(0.45, 0.4);
      fillPolygon(s, dome);
      s.pop();
    }
    if (form === "helmet") {
      // the helmet jelly's light comes from inside the cone
      this.lights.push({ x: 0, y: -bh * 0.5, r: 3, k: 0.5 });
    }
    s.pop();
  }

  if (tw.combs) {
    // comb rows: four lines of lights running up the bell, like a ctenophore
    for (let row = 0; row < 4; row++) {
      let u = (row + 0.5) / 4;
      let a = PI + u * PI; // angle round the dome, left rim to right rim
      for (let j = 1; j <= 5; j++) {
        let v = j / 6;
        this.lights.push({ x: cos(a) * bw * 0.5 * v, y: sin(a) * bh * v, r: 1.3, k: v });
      }
    }
  } else if (tw.stars) {
    // a constellation: lights scattered over the dome, seeded
    for (let i = 0; i < nL; i++) {
      let a = PI + random(0.1, 0.9) * PI;
      let v = random(0.35, 0.95);
      this.lights.push({ x: cos(a) * bw * 0.5 * v, y: sin(a) * bh * v, r: i % 3 === 0 ? 1.8 : 1.1, k: i / nL });
    }
  } else if (form !== "firework") {
    // the ring of lights round the rim, every other one bigger (modulo, week 3)
    for (let i = 0; i < nL; i++) {
      let u = (i + 0.5) / nL;
      this.lights.push({ x: lerp(-bw * 0.46, bw * 0.46, u), y: 1.5, r: i % 2 === 0 ? 1.9 : 1.2, k: i / nL });
    }
  }
  this.bakeLights(s, 110);

  // L-system (week 10): the tentacles. The trunk of F[+F]F[-F]F has
  // 3^gens steps, so the step length sets how far they hang.
  let ls = this.genes.lsystem;
  let rule = growLsystem(ls.axiom, ls.rules, gens);
  let step = tLen / pow(3, gens);
  let segs = [];
  let box = { x0: 0, y0: 0, x1: 0, y1: 0 };
  if (form === "phantom") {
    // the giant phantom jelly: no tentacles, four huge ribbon arms,
    // each a long tapered strip that waves (sin along its length)
    for (let a = 0; a < 4; a++) {
      let x = lerp(-bw * 0.3, bw * 0.3, a / 3);
      let L = bh * 3.2 * random(0.85, 1.1);
      let w = bw * 0.12;
      let ph = random(TWO_PI);
      for (let i = 0; i < 14; i++) {
        let u0 = i / 14;
        let u1 = (i + 1) / 14;
        let x0 = x + sin(ph + u0 * 4) * w * 0.8;
        let x1 = x + sin(ph + u1 * 4) * w * 0.8;
        // thick near the bell, thinner at the end
        segs.push({ x0: x0, y0: u0 * L, x1: x1, y1: u1 * L, depth: -2 - (1 - u0) * 2 });
      }
      box = unionBox(box, { x0: x - w, y0: 0, x1: x + w, y1: L });
    }
  } else if (tw.stiff) {
    // tentacles held out straight from the rim: a plate's spokes, a helmet's crown
    for (let t = 0; t < nT; t++) {
      let u = nT === 1 ? 0.5 : t / (nT - 1);
      let x = lerp(-bw * 0.48, bw * 0.48, u);
      let heading = lerp(PI - 0.35, 0.35, u) + random(-0.08, 0.08);
      let walk = walkTurtle("F", x, 1, heading, tLen, tLen, 0);
      for (let i = 0; i < walk.segs.length; i++) segs.push(walk.segs[i]);
      box = unionBox(box, walk.box);
    }
  } else {
    for (let t = 0; t < nT; t++) {
      let u = nT === 1 ? 0.5 : (t + 0.5) / nT;
      let x = lerp(-bw * 0.42, bw * 0.42, u);
      // hang down, the outer ones splay
      let heading = HALF_PI + (u - 0.5) * 0.5 + random(-0.1, 0.1);
      let walk = walkTurtle(rule, x, 2, heading, step, step, angle * random(0.85, 1.15));
      for (let i = 0; i < walk.segs.length; i++) segs.push(walk.segs[i]);
      box = unionBox(box, walk.box);
    }
  }
  // extra long trailing tentacles (Atolla's one hypertrophied tentacle)
  for (let t = 0; t < longT; t++) {
    let x = bw * 0.3 * random(-1, 1);
    let walk = walkTurtle("F+F-F-F+F+F-F-F+F", x, 2, HALF_PI + random(-0.2, 0.2), bh * 0.6, bh * 0.6, 0.12);
    for (let i = 0; i < walk.segs.length; i++) segs.push(walk.segs[i]);
    box = unionBox(box, walk.box);
  }
  // oral arms: a few thick frilly arms under the middle of the bell
  for (let a = 0; a < oral; a++) {
    let u = oral === 1 ? 0.5 : a / (oral - 1);
    let x = lerp(-bw * 0.15, bw * 0.15, u);
    let walk = walkTurtle("F+F-F-F+F+F-F", x, 0, HALF_PI + (u - 0.5) * 0.3, bh * 0.14, bh * 0.14, 0.5);
    for (let i = 0; i < walk.segs.length; i++) {
      walk.segs[i].depth = -1; // thicker than a tentacle
      segs.push(walk.segs[i]);
    }
    box = unionBox(box, walk.box);
  }
  this.tox = -box.x0 + 3;
  this.toy = -box.y0 + 3;
  this.tentacles = this.makeSprite(box.x1 - box.x0 + 6, box.y1 - box.y0 + 6);
  this.tentacles.translate(this.tox, this.toy);
  let tc = tw.flesh !== undefined && !this.clear ? this.bodyCol : c;
  drawSegments(this.tentacles, segs, tc, 1.6, form === "phantom" ? 220 : 170);

  this.box = unionBox({ x0: -this.ox, y0: -this.oy, x1: bw + 8 - this.ox, y1: sh - this.oy }, box);
};

// 2 - the siphonophore form: a float, a stack of clear bells, then a stem of polyps and tentacles
Body.prototype.growSiphonophore = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let bells = pickGeneInt(this.gene("bells"));
  let stemLen = pickGene(this.gene("stem"));
  let bw = 14; // *** width of a swimming bell
  let bh = 9;
  let nT = pickGeneInt(this.gene("tentacles"));
  let gens = min(pickGeneInt(this.gene("gens")), 2);
  let tLen = pickGene(this.gene("length")) * 0.35;
  let angle = radians(pickGene(this.gene("angle")));
  this.breathe = pickGene(this.gene("breathe"));
  let total = 8 + bells * bh * 1.05 + stemLen;
  let mid = total / 2;
  this.haloY = 0;

  // all the still parts, bells and stem and polyps, in one sprite
  let W = 44;
  this.ox = W / 2;
  this.oy = mid + 4;
  this.sprite = this.makeSprite(W, total + 8);
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  let y = -mid;
  // the float, the colony's own colour
  s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 220);
  s.ellipse(0, y + 4, 6, 8);
  y += 8;
  // the swimming bells: a stack of small clear domes
  let domePts = this.outline(bw / 2, bh, 0.06, 24);
  let dome = [];
  for (let i = 12; i < 24; i++) dome.push(domePts[i]);
  dome.push(domePts[0]);
  for (let b = 0; b < bells; b++) {
    s.push();
    s.translate((b % 2 === 0 ? -1 : 1) * bw * 0.3, y + bh); // modulo: the bells zigzag
    s.fill(c[0], c[1], c[2], 45);
    s.stroke(c[0], c[1], c[2], 140);
    s.strokeWeight(0.9);
    fillPolygon(s, dome);
    s.pop();
    this.lights.push({ x: (b % 2 === 0 ? -1 : 1) * bw * 0.3, y: y + bh, r: 1.2, k: b / max(1, bells) });
    y += bh * 1.05;
  }
  // the stem
  s.noFill();
  s.stroke(c[0], c[1], c[2], 120);
  s.strokeWeight(1);
  s.line(0, y, 0, y + stemLen);
  // polyp clusters along the stem, lit on every third (modulo), with
  // short L-system tentacles trailing from every other one
  let ls = this.genes.lsystem;
  let rule = growLsystem(ls.axiom, ls.rules, gens);
  let step = tLen / pow(3, gens);
  let segs = [];
  let box = { x0: -W / 2, y0: -mid, x1: W / 2, y1: y + stemLen };
  let n = floor(stemLen / 7);
  for (let i = 0; i < n; i++) {
    let py = y + 4 + i * 7;
    let side = i % 2 === 0 ? -1 : 1;
    s.noStroke();
    s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 200);
    s.ellipse(side * 2.5, py, 3.5, 2.4);
    if (i % 3 === 0) this.lights.push({ x: side * 2.5, y: py, r: 1.3, k: 0.3 + (0.7 * i) / n });
    if (i % 2 === 0 && nT > 0) {
      let walk = walkTurtle(rule, side * 3, py, HALF_PI + side * 0.3 + random(-0.1, 0.1), step, step, angle);
      for (let k = 0; k < walk.segs.length; k++) segs.push(walk.segs[k]);
      box = unionBox(box, walk.box);
    }
  }
  s.noStroke();
  this.bakeLights(s, 110);
  this.tox = -box.x0 + 3;
  this.toy = -box.y0 + 3;
  this.tentacles = this.makeSprite(box.x1 - box.x0 + 6, box.y1 - box.y0 + 6);
  this.tentacles.translate(this.tox, this.toy);
  drawSegments(this.tentacles, segs, c, 1, 150);
  this.box = unionBox({ x0: -this.ox, y0: -this.oy, x1: W - this.ox, y1: total + 8 - this.oy }, box);
};

// 3 - sea pen: an l-system feather on a stalk, standing upright, a polyp light on each pinna
Body.prototype.growSeaPen = function () {
  let c = this.look.col;
  let form = this.tweak.form !== undefined ? this.tweak.form : "pen";
  if (form !== "pen") {
    this.growColony(form);
    return;
  }
  let stemH = pickGene(this.gene("stem"));
  let stalk = pickGene(this.gene("stalk"));
  let gens = pickGeneInt(this.gene("gens"));
  let angle = radians(pickGene(this.gene("angle")));
  let step = pickGene(this.gene("step"));
  let weight = pickGene(this.gene("weight"));
  this.sway = pickGene(this.gene("sway"));
  this.stemH = stemH;
  // the stem starts here so the whole colony is centred on the position
  this.base = (stemH - stalk) / 2;
  this.haloY = this.base - stemH * 0.5;

  // L-system (week 10): the rule in planGenes[3]. Each generation
  // adds two stem steps and a pair of pinnae, and every pinna that
  // already exists grows one step, so the lowest ones are longest.
  let ls = this.genes.lsystem;
  let rule = growLsystem(ls.axiom, ls.rules, gens);
  let walk = walkTurtle(rule, 0, this.base, -HALF_PI, step, stemH / (2 * gens), angle);

  // the polyps light in order of height: k is 0 at the base, 1 at the tip
  for (let i = 0; i < walk.lights.length; i++) {
    let l = walk.lights[i];
    l.r = 1.5;
    l.k = constrain(map(l.y, this.base, this.base - stemH, 0, 1), 0, 1);
    this.lights.push(l);
  }

  let box = unionBox(walk.box, { x0: -4, y0: this.base, x1: 4, y1: this.base + stalk + 3 });
  this.ox = -box.x0 + 4;
  this.oy = -box.y0 + 4;
  this.sprite = this.makeSprite(box.x1 - box.x0 + 8, box.y1 - box.y0 + 8);
  let s = this.sprite;
  s.translate(this.ox, this.oy);

  // the stalk that anchors it in the mud, dull and thick
  let dull = this.tweak.flesh !== undefined ? this.bodyCol : mixColour(c, [40, 30, 30], 0.6);
  s.stroke(dull[0], dull[1], dull[2]);
  s.strokeWeight(weight + 1);
  s.line(0, this.base, 0, this.base + stalk);
  s.noStroke();
  s.fill(dull[0], dull[1], dull[2]);
  s.ellipse(0, this.base + stalk, weight * 3, weight * 2);

  drawSegments(s, walk.segs, this.tweak.flesh !== undefined ? this.bodyCol : c, weight, 200);
  this.bakeLights(s, 100);
  this.box = { x0: box.x0 - 4, y0: box.y0 - 4, x1: box.x1 + 4, y1: box.y1 + 4 };
};

// 3 - the other anchored colonies: a branching tree, a corkscrew, a sea lily, a bare stalk, a whip
Body.prototype.growColony = function (form) {
  let c = this.look.col;
  let stemH = pickGene(this.gene("stem"));
  let stalk = pickGene(this.gene("stalk"));
  let weight = pickGene(this.gene("weight"));
  this.sway = pickGene(this.gene("sway"));
  this.stemH = stemH;
  this.base = (stemH - stalk) / 2;
  this.haloY = this.base - stemH * 0.5;
  let fc = this.tweak.flesh !== undefined ? this.bodyCol : mixColour(c, [40, 30, 30], 0.5);
  let W = form === "whip" || form === "umbellula" ? 50 : stemH * 1.2;
  let top = this.base - stemH - 12;
  this.ox = W / 2;
  this.oy = -top;
  this.sprite = this.makeSprite(W, stemH + stalk + 24);
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  s.stroke(fc[0], fc[1], fc[2]);
  s.strokeWeight(weight + 1);
  s.line(0, this.base, 0, this.base + stalk);
  s.noStroke();
  s.fill(fc[0], fc[1], fc[2]);
  s.ellipse(0, this.base + stalk, weight * 3, weight * 2);

  if (form === "tree") {
    // recursion (week 9): branch() with a heavier stroke, knobs at the tips
    let tips = [];
    s.stroke(fc[0], fc[1], fc[2]);
    this.branchWeight = weight * 0.9;
    this.branch(s, 0, this.base, -HALF_PI, stemH * 0.38, 4, 0.55, tips);
    this.branchWeight = 1;
    s.noStroke();
    s.fill(fc[0], fc[1], fc[2]);
    for (let i = 0; i < tips.length; i++) {
      s.circle(tips[i].x, tips[i].y, 3);
      if (i % 3 === 0) this.lights.push({ x: tips[i].x, y: tips[i].y, r: 1.3, k: 1 - (tips[i].y - top) / (this.base - top) });
    }
  } else if (form === "spiral") {
    // waves (week 4): a sine in x as the stem climbs, the amplitude
    // growing with height, is a corkscrew seen from the side
    s.noFill();
    s.stroke(fc[0], fc[1], fc[2]);
    s.strokeWeight(weight);
    let n = 40;
    let prev = null;
    for (let i = 0; i <= n; i++) {
      let u = i / n;
      let y = this.base - u * stemH;
      let x = sin(u * 5 * PI) * stemH * 0.12 * (0.3 + 0.7 * u);
      if (prev !== null) s.line(prev.x, prev.y, x, y);
      if (i % 3 === 0 && i > 2) {
        // modulo (week 3): a side branch at every third point, on the outside of the turn
        let dir = sin(u * 5 * PI) >= 0 ? 1 : -1;
        s.strokeWeight(weight * 0.5);
        s.line(x, y, x + dir * 9, y - 4);
        s.strokeWeight(weight);
        this.lights.push({ x: x + dir * 9, y: y - 4, r: 1.2, k: u });
      }
      prev = { x: x, y: y };
    }
    s.noStroke();
  } else if (form === "lily") {
    // a jointed stalk, a cup, and a crown of arms curving out and down
    s.stroke(fc[0], fc[1], fc[2], 120);
    s.strokeWeight(0.6);
    // the joints
    for (let y = this.base; y > this.base - stemH * 0.65; y -= 5) s.line(-weight, y, weight, y);
    s.stroke(fc[0], fc[1], fc[2]);
    s.strokeWeight(weight);
    let cupY = this.base - stemH * 0.65;
    s.line(0, this.base, 0, cupY);
    s.noStroke();
    s.fill(fc[0], fc[1], fc[2]);
    s.ellipse(0, cupY, weight * 3, weight * 2.5);
    let arms = 10;
    s.noFill();
    s.strokeWeight(1);
    for (let a = 0; a < arms; a++) {
      let u = a / (arms - 1);
      let ang = lerp(-PI * 0.95, -PI * 0.05, u);
      let L = stemH * 0.4 * random(0.85, 1.1);
      let ex = cos(ang) * L;
      let ey = cupY + sin(ang) * L * 0.8 + L * 0.25; // the arms droop at the tips
      s.stroke(fc[0], fc[1], fc[2]);
      s.bezier(0, cupY, cos(ang) * L * 0.5, cupY + sin(ang) * L * 0.7, ex, ey - L * 0.2, ex, ey);
      // pinnules: short ticks along the arm (every other step, modulo)
      s.strokeWeight(0.5);
      for (let k = 1; k < 6; k++) {
        if (k % 2 === 0) continue;
        let v = k / 6;
        let px = bezierPoint(0, cos(ang) * L * 0.5, ex, ex, v);
        let py = bezierPoint(cupY, cupY + sin(ang) * L * 0.7, ey - L * 0.2, ey, v);
        s.line(px - 2, py - 2, px + 2, py + 2);
      }
      s.strokeWeight(1);
      if (a % 2 === 0) this.lights.push({ x: ex, y: ey, r: 1.2, k: u });
    }
    s.noStroke();
  } else if (form === "umbellula") {
    // a tall bare stalk with a tuft of big feathery polyps at the top
    s.stroke(fc[0], fc[1], fc[2]);
    s.strokeWeight(weight);
    let topY = this.base - stemH;
    s.line(0, this.base, 0, topY);
    let tips = [];
    for (let a = 0; a < 7; a++) {
      let ang = lerp(-PI * 0.9, -PI * 0.1, a / 6);
      this.branch(s, 0, topY, ang, 9, 1, 0.5, tips);
    }
    for (let i = 0; i < tips.length; i++) this.lights.push({ x: tips[i].x, y: tips[i].y, r: 1.4, k: 1 });
    s.noStroke();
  } else {
    // whip: a long thin stem with small polyps all along it, a light on every third (modulo)
    s.stroke(fc[0], fc[1], fc[2]);
    s.strokeWeight(weight);
    s.line(0, this.base, 0, this.base - stemH);
    s.strokeWeight(0.6);
    let n = floor(stemH / 4);
    for (let i = 1; i < n; i++) {
      let y = this.base - i * 4;
      let side = i % 2 === 0 ? -1 : 1;
      s.line(0, y, side * 3, y - 1);
      if (i % 3 === 0) this.lights.push({ x: side * 3, y: y - 1, r: 1.1, k: i / n });
    }
    s.noStroke();
  }
  this.bakeLights(s, 100);
  this.box = { x0: -this.ox, y0: top, x1: W - this.ox, y1: this.base + stalk + 8 };
};

// 4 - dragon: a long dark body, a searchlight under the eye, a branching lure and fin rays
Body.prototype.growDragon = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let len = pickGene(this.gene("length"));
  let h = len * pickGene(this.gene("height"));
  let n = this.genes.segments;
  let lightEvery = pickGeneInt(this.gene("lightEvery"));
  let depth = pickGeneInt(this.gene("antlerDepth"));
  let spread = radians(pickGene(this.gene("antlerAngle")));
  let aLen = pickGene(this.gene("antlerLen"));
  let rayDepth = pickGeneInt(this.gene("rayDepth"));
  let fangs = round(this.amount("fangs"));
  let fangLen = this.gene("fangLen") !== undefined ? pickGene(this.gene("fangLen")) : 1;
  let barbel = this.amount("barbel");
  let jaw = this.amount("jaw");
  let eyeSize = pickGene(this.gene("eyeSize"));
  this.len = len;
  this.tail = h * 0.9;
  this.beam = pickGene(this.gene("beam"));
  this.beamStrength = tw.beamStrength !== undefined ? tw.beamStrength : 1;
  this.flick = pickGene(this.gene("flick"));
  // nearly black, so it is the lights you see
  if (tw.flesh === undefined && !tw.ink) this.bodyCol = mixColour(c, [8, 6, 14], 0.88);

  // noise (week 5): the silhouette, long and thin
  let pts = this.outline(len / 2, h / 2, pickGene(this.gene("wobble")), 48);

  let top = 18 + (tw.spine || tw.lamp ? 22 : 0);
  let sh = h + top + 54;
  this.ox = len / 2 + 6;
  this.oy = h / 2 + top;
  this.sprite = this.makeSprite(len + 12, sh);
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  // a glass dragon is nearly clear, a black angler is only its lamp
  let hidden = this.clear || tw.lampOnly;
  if (hidden) {
    s.fill(c[0], c[1], c[2], tw.lampOnly ? 6 : 22);
    s.stroke(c[0], c[1], c[2], tw.lampOnly ? 18 : 90);
  } else {
    s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2]);
    s.stroke(c[0], c[1], c[2], 70);
  }
  s.strokeWeight(0.8);
  fillPolygon(s, pts);
  s.noStroke();
  // the tail fades too
  if (tw.lampOnly) this.bodyCol = [this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 30];

  // modulo (week 3): a faint stripe on every other segment, and a
  // photophore on every lightEvery-th one along the belly
  let segW = len / n;
  for (let i = 1; i < n - 1; i++) {
    let x0 = -len / 2 + i * segW;
    if (i % 2 === 0 && !hidden) {
      s.fill(c[0], c[1], c[2], 18);
      fillPolygon(s, outlineStrip(pts, x0, x0 + segW));
    }
    if (i % lightEvery === 0) {
      let sl = sliceOutline(pts, x0 + segW / 2);
      this.lights.push({ x: x0 + segW / 2, y: sl.bottom - 1.5, r: 1.4, k: i / n, lure: false });
    }
  }

  // the head: a pale eye, the jaw with its fangs (hanging open for a
  // loosejaw), and the searchlight photophore just under the eye
  let eyeX = len * 0.36;
  let eyeY = -h * 0.1;
  if (!tw.lampOnly) {
    s.fill(225, 225, 235);
    s.circle(eyeX, eyeY, h * 0.34 * eyeSize);
    s.fill(4, 4, 10);
    s.circle(eyeX + h * 0.04, eyeY, h * 0.2 * eyeSize);
  }
  if (tw.eyeLights) this.lights.push({ x: eyeX - h * 0.05, y: eyeY + h * 0.3, r: 2.4, k: 1, lure: false, eye: true });
  s.stroke(c[0], c[1], c[2], 110);
  s.strokeWeight(0.8);
  let jawTipX = len / 2 - 1;
  let jawTipY = h * 0.08;
  let jawBackX = len * 0.22;
  let jawBackY = h * 0.3;
  if (jaw > 0) {
    // the lower jaw swings down from its hinge at the back
    let open = jaw * 1.1;
    jawTipX = jawBackX + (len * 0.28) * cos(open);
    jawTipY = jawBackY + (len * 0.28) * sin(open);
    s.noFill();
    s.line(jawBackX, jawBackY, jawTipX, jawTipY);
    s.line(jawBackX, jawBackY, len / 2 - 1, jawTipY * 0.3); // the upper jaw stays
  } else {
    s.line(jawTipX, jawTipY, jawBackX, jawBackY);
  }
  for (let i = 0; i < fangs; i++) {
    let u = (i + 0.5) / fangs;
    let fx = lerp(jawTipX, jawBackX, u * 0.8);
    let fy = lerp(jawTipY, jawBackY, u * 0.8);
    // modulo (week 3): a viperfish's fangs alternate long and short
    let fl = (3.5 + (fangs > 4 ? 3 * (i % 2) : 0)) * fangLen;
    s.line(fx, fy, fx - 1, fy - fl);
  }
  if (tw.scales) {
    // the scaly dragonfish's hexagonal scales: a staggered grid of rings (modulo, week 3)
    s.noFill();
    s.stroke(220, 225, 235, 70);
    s.strokeWeight(0.5);
    for (let i = 2; i < n - 1; i++) {
      for (let row = 0; row < 3; row++) {
        let x = -len / 2 + (i + (row % 2) * 0.5) * segW;
        let sl = sliceOutline(pts, x);
        s.circle(x, lerp(sl.top, sl.bottom, (row + 0.5) / 3), segW * 0.7);
      }
    }
  }
  this.beamX = eyeX + h * 0.1;
  this.beamY = eyeY + h * 0.32;

  // recursion (week 9): the lure. A dragon hangs it from a chin
  // barbel, a viperfish arches it forward on a long dorsal spine, an
  // angler holds a round lamp on a short rod. A light on every tip.
  let tips = [];
  s.stroke(c[0], c[1], c[2], 140);
  if (tw.spine) {
    let sx = -len * 0.1;
    let sy = sliceOutline(pts, sx).top;
    s.noFill();
    s.bezier(sx, sy, sx + len * 0.2, sy - 26, len * 0.45, sy - 26, len * 0.55, sy - 12);
    this.branch(s, len * 0.55, sy - 12, HALF_PI - 0.3, aLen * 0.8, depth - 1, spread, tips);
  } else if (tw.lamp) {
    let rx = len * 0.3;
    let ry = sliceOutline(pts, rx).top;
    s.line(rx, ry, rx + 10, ry - 16);
    tips.push({ x: rx + 10, y: ry - 16, lamp: true });
  } else if (barbel > 0) {
    let chinX = len * 0.26;
    let chinY = sliceOutline(pts, chinX).bottom;
    s.line(chinX, chinY, chinX - barbel * 0.2, chinY + barbel);
    this.branch(s, chinX - barbel * 0.2, chinY + barbel, HALF_PI + 0.15, aLen, depth, spread, tips);
  }
  for (let i = 0; i < tips.length; i++) {
    this.lights.push({ x: tips[i].x, y: tips[i].y, r: tips[i].lamp ? 3.2 : 1.1, k: 1, lure: true, lamp: tips[i].lamp === true });
  }

  // recursion (week 9) again, shallower: fin rays above and below near the tail
  s.stroke(c[0], c[1], c[2], 90);
  let finX = -len * 0.26;
  let sl = sliceOutline(pts, finX);
  this.branch(s, finX, sl.top, -HALF_PI - 0.7, 7, rayDepth, 0.3, []);
  this.branch(s, finX, sl.bottom, HALF_PI + 0.7, 6, rayDepth, 0.3, []);

  this.bakeLights(s, 80);
  this.box = { x0: -this.ox - this.tail, y0: -this.oy, x1: len + 12 - this.ox, y1: sh - this.oy };
};

// 5 - squid: a soft mantle, head and eyes, a skirt of short arms. the long arms move live
Body.prototype.growSquid = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let ml = pickGene(this.gene("mantle"));
  let mh = ml * pickGene(this.gene("height"));
  let n = this.genes.segments;
  let lightEvery = pickGeneInt(this.gene("lightEvery"));
  let nArms = pickGeneInt(this.gene("arms"));
  let armLen = pickGene(this.gene("armLen"));
  let armDepth = pickGeneInt(this.gene("armDepth"));
  let eyeSize = pickGene(this.gene("eyeSize"));
  this.ml = ml;
  this.mh = mh;
  this.longArm = ml * pickGene(this.gene("longArm"));
  this.fin = pickGene(this.gene("fin"));
  this.ripple = pickGene(this.gene("ripple"));
  this.finShape = this.gene("finShape");
  this.haloY = 0;

  // noise (week 5): the mantle, a soft cone from the head to the tip
  let pts = this.outline(ml / 2, mh / 2, pickGene(this.gene("wobble")), 36);
  for (let i = 0; i < pts.length; i++) {
    pts[i].y *= 1.15 - 0.45 * (pts[i].x / ml + 0.5); // tapers toward the tip at +x
    pts[i].x += ml / 2;
  }

  let skirt = armLen * 1.9 + 10;
  let hh = max(mh, 2 * armLen * 0.9) + 8;
  this.ox = skirt + 2;
  this.oy = hh / 2;
  this.sprite = this.makeSprite(ml + skirt + 6, hh);
  let s = this.sprite;
  s.translate(this.ox, this.oy);

  // recursion (week 9): the skirt of short arms, each a tiny branch()
  // tree, fanned out behind the head. The vampire squid's are joined
  // by a web.
  let tips = [];
  let headX = -4;
  s.stroke(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 230);
  for (let a = 0; a < nArms; a++) {
    let u = nArms === 1 ? 0.5 : a / (nArms - 1);
    let ang = PI + (u - 0.5) * 1.5;
    this.branch(s, headX - 4, (u - 0.5) * mh * 0.6, ang, armLen, armDepth, 0.3, tips);
  }
  if (tw.web) {
    s.noStroke();
    s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 150);
    s.beginShape();
    s.vertex(headX - 4, -mh * 0.3);
    for (let i = 0; i < tips.length; i += 2) s.vertex(tips[i].x, tips[i].y);
    s.vertex(headX - 4, mh * 0.3);
    s.endShape(CLOSE);
  }
  s.noStroke();

  // the mantle and the head
  this.fleshStyle(s);
  fillPolygon(s, pts);
  s.ellipse(headX, 0, 12, mh * 0.85);
  s.noStroke();
  let eyeR = mh * 0.2 * eyeSize;
  // the strawberry squid: one big eye looks up, one small looks down
  let eyeTop = tw.unevenEyes ? eyeR * 1.7 : eyeR;
  let eyeBot = tw.unevenEyes ? eyeR * 0.6 : eyeR;
  s.fill(225, 235, 240);
  s.circle(headX, -mh * 0.22, eyeTop);
  s.circle(headX, mh * 0.22, eyeBot);
  s.fill(4, 8, 16);
  s.circle(headX + 0.5, -mh * 0.22, eyeTop * 0.55);
  s.circle(headX + 0.5, mh * 0.22, eyeBot * 0.55);

  // modulo (week 3): a light on every lightEvery-th mantle segment,
  // on both flanks
  let segW = ml / n;
  for (let i = 1; i < n - 1; i++) {
    if (i % lightEvery !== 0) continue;
    let x = (i + 0.5) * segW;
    let sl = sliceOutline(pts, x);
    this.lights.push({ x: x, y: sl.top + 1.5, r: 1.2, k: i / n });
    this.lights.push({ x: x, y: sl.bottom - 1.5, r: 1.2, k: i / n });
  }
  if (!this.clear) this.bakeLights(s, 90); // a glass squid shows nothing until it is lit
  this.box = { x0: -this.ox - this.longArm, y0: -this.oy - mh * 0.3, x1: ml + 6, y1: hh - this.oy + mh * 0.3 };
};

// 6 - eel: only the head is a sprite. the body rides a travelling sine and is drawn live
Body.prototype.growEel = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let n = this.genes.segments;
  this.len = pickGene(this.gene("length"));
  this.thick = pickGene(this.gene("thick"));
  this.segs = n;
  this.amp = pickGene(this.gene("amp"));
  this.freq = pickGene(this.gene("freq")) / this.size; // big eels undulate slowly
  this.waves = pickGene(this.gene("waves"));
  let hl = pickGene(this.gene("head"));
  let lightEvery = pickGeneInt(this.gene("lightEvery"));
  let snipe = this.amount("snipe") * hl;
  let eyeSize = pickGene(this.gene("eyeSize"));
  this.tailLight = tw.tailLight === true;
  this.finCol = tw.finCol !== undefined ? tw.finCol : null;
  this.haloY = 0;

  // modulo (week 3): which segments carry a light. Their positions
  // move with the wave, so only the segment numbers are kept.
  this.lightSegs = [];
  for (let i = 2; i < n - 1; i++) {
    if (i % lightEvery === 0) this.lightSegs.push(i);
  }

  // noise (week 5): the head, a short wobbled ellipse. The gulper's
  // is mostly an open jaw, the snipe eel's runs out into a thin beak.
  let hh = tw.mouth ? hl * 0.9 : this.thick * 1.3;
  let pts = this.outline(hl / 2, hh / 2, pickGene(this.gene("wobble")), 24);
  let crestRoom = tw.crest ? 26 : 0;
  this.ox = hl / 2 + 3 + (tw.crest ? 22 : 0);
  this.oy = hh / 2 + 3 + (tw.mouth ? 2 : 0) + crestRoom;
  this.sprite = this.makeSprite(hl + 6 + snipe + (tw.crest ? 22 : 0), hh + 6 + (tw.mouth ? hh * 0.9 : 0) + crestRoom);
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  this.fleshStyle(s);
  fillPolygon(s, pts);
  s.noStroke();
  if (tw.mouth) {
    // the lower jaw hangs open below the head
    s.fill(this.bodyCol[0] * 0.8, this.bodyCol[1] * 0.8, this.bodyCol[2] * 0.8);
    s.triangle(hl * 0.45, 0, -hl * 0.3, hh * 0.1, hl * 0.1, hh * 0.95);
    s.stroke(c[0], c[1], c[2], 90);
    s.strokeWeight(0.8);
    s.line(hl * 0.45, 0, -hl * 0.3, hh * 0.1);
    s.noStroke();
  }
  if (snipe > 0) {
    // two thin jaws that curve apart at the tip, like a snipe's bill
    s.stroke(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2]);
    s.strokeWeight(1);
    s.noFill();
    s.bezier(hl * 0.4, -1, hl * 0.4 + snipe * 0.6, -1, hl * 0.4 + snipe * 0.8, -3, hl * 0.4 + snipe, -4);
    s.bezier(hl * 0.4, 1, hl * 0.4 + snipe * 0.6, 1, hl * 0.4 + snipe * 0.8, 3, hl * 0.4 + snipe, 4);
    s.noStroke();
  }
  if (tw.crest) {
    // the oarfish's crest: long red rays streaming back from the head
    let fcol = this.finCol !== null ? this.finCol : c;
    s.stroke(fcol[0], fcol[1], fcol[2], 220);
    s.strokeWeight(0.9);
    for (let i = 0; i < 5; i++) s.line(hl * 0.1 - i * 2, -hh * 0.45, hl * 0.1 - i * 2 - 8 - i * 3, -hh * 0.45 - 14 - i * 2);
    s.noStroke();
  }
  let eye = (tw.mouth ? hh * 0.18 : hh * 0.34) * eyeSize;
  s.fill(225, 238, 242);
  s.circle(hl * 0.2, -hh * 0.12, eye);
  s.fill(4, 8, 16);
  s.circle(hl * 0.22, -hh * 0.12, eye * 0.55);
  this.box = { x0: -this.len - 4, y0: -this.amp - this.thick - (tw.crest ? 24 : 0), x1: hl / 2 + 3 + snipe, y1: this.amp + this.thick + (tw.mouth ? hh : 0) };
};

// 7 - angler: a round body that is mostly mouth, needle teeth, and a rod ending in a glowing esca
Body.prototype.growAngler = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let len = pickGene(this.gene("body"));
  let h = len * pickGene(this.gene("round"));
  let mouth = pickGene(this.gene("mouth"));
  let teeth = pickGeneInt(this.gene("teeth"));
  let rod = pickGene(this.gene("rod"));
  let curl = pickGene(this.gene("curl"));
  let esca = pickGene(this.gene("esca"));
  let eye = pickGene(this.gene("eye"));
  let fin = pickGene(this.gene("fin"));
  let tuft = pickGene(this.gene("tuft"));
  this.len = len;
  this.tail = fin;
  this.flick = pickGene(this.gene("flick"));
  // anglers are near black
  if (tw.flesh === undefined) this.bodyCol = mixColour(c, [10, 8, 14], 0.86);
  this.haloY = 0;

  // noise (week 5): the silhouette, a lumpy ball
  let pts = this.outline(len / 2, h / 2, pickGene(this.gene("wobble")), 40);

  let top = rod + esca + 8 + (tw.rays ? len * 0.4 : 0);
  let below = (tw.chinTree ? 24 : 0) + (tw.rays ? len * 0.4 : 0);
  this.ox = len / 2 + fin + 4 + (tw.rays ? len * 0.4 : 0);
  this.oy = h / 2 + top;
  this.sprite = this.makeSprite(len + fin + rod + 12 + (tw.rays ? len * 0.4 : 0), h + top + 8 + below);
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  this.fleshStyle(s);
  fillPolygon(s, pts);
  s.noStroke();

  // the mouth: a wedge cut from the front, hinged well back, gaping
  // by the mouth gene, with needle teeth along both jaws (modulo,
  // week 3: every other tooth is the long one)
  let hingeX = len * 0.05;
  let gape = mouth * 0.6;
  let tipX = len / 2 - 1;
  let upY = -sin(gape) * h * 0.5;
  let loY = sin(gape) * h * 0.55;
  // the throat, a shade of the glow so it shows on a black body
  let inside = mixColour(c, [20, 6, 10], 0.75);
  let lip = mixColour(this.bodyCol, [230, 230, 235], 0.35);
  s.fill(inside[0], inside[1], inside[2]);
  s.triangle(hingeX, 0, tipX, upY, tipX, loY);
  s.stroke(lip[0], lip[1], lip[2], 220);
  s.strokeWeight(0.9);
  s.line(hingeX, 0, tipX, upY); // the jaws' edges
  s.line(hingeX, 0, tipX, loY);
  s.stroke(230, 232, 238, 220);
  s.strokeWeight(0.6);
  for (let i = 0; i < teeth; i++) {
    let u = 0.3 + 0.7 * ((i + 0.5) / teeth); // no teeth in the throat, where the jaws meet
    let long = i % 2 === 0 ? 1 : 0.6;
    let x = lerp(hingeX, tipX, u);
    let yu = lerp(0, upY, u);
    let yl = lerp(0, loY, u);
    s.line(x, yu, x - 0.5, yu + 3.5 * long * mouth);
    s.line(x, yl, x - 0.5, yl - 3.5 * long * mouth);
  }
  s.noStroke();

  // a small eye above the jaw, and a pectoral fin
  s.fill(225, 225, 235);
  s.circle(len * 0.18, -h * 0.22, eye);
  s.fill(4, 4, 10);
  s.circle(len * 0.19, -h * 0.22, eye * 0.55);
  s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 200);
  s.triangle(-len * 0.05, h * 0.15, -len * 0.05 - fin, h * 0.05, -len * 0.05 - fin * 0.6, h * 0.4);

  // the rod: a curve from the forehead (or the chin) that curls over
  // toward the mouth by curl, then the esca and its tuft
  // (recursion, week 9, one or two levels)
  let fromChin = tw.rodFrom === "chin";
  let rx = len * 0.15;
  let ry = fromChin ? sliceOutline(pts, rx).bottom : sliceOutline(pts, rx).top;
  let dir = fromChin ? 1 : -1;
  let ex = rx + rod * (0.5 + 0.5 * curl);
  let ey = ry + dir * rod * (1 - 0.6 * curl);
  s.stroke(c[0], c[1], c[2], 150);
  s.strokeWeight(0.9);
  s.noFill();
  s.bezier(rx, ry, rx + rod * 0.1, ry + dir * rod * 0.9, rx + rod * 0.9 * curl + rod * 0.2, ry + dir * rod * 0.9, ex, ey);
  let tips = [];
  if (tuft > 0.4) this.branch(s, ex, ey, fromChin ? HALF_PI : -HALF_PI, 4, tuft > 0.7 ? 2 : 1, 0.6, tips);
  this.lights.push({ x: ex, y: ey, r: esca, k: 1, esca: true });
  for (let i = 0; i < tips.length; i++) this.lights.push({ x: tips[i].x, y: tips[i].y, r: 1, k: 1, esca: false });

  if (tw.chinTree) {
    // the netdevil's barbel: a lit tree under the chin (recursion, week 9)
    let ct = [];
    let cy = sliceOutline(pts, 0).bottom;
    s.stroke(c[0], c[1], c[2], 150);
    this.branch(s, 0, cy, HALF_PI, 8, 3, 0.5, ct);
    for (let i = 0; i < ct.length; i++) this.lights.push({ x: ct[i].x, y: ct[i].y, r: 1.1, k: 1, esca: false });
  }
  let warts = round(this.amount("warts"));
  for (let i = 0; i < warts; i++) {
    // glowing warts on the back
    let wx = -len * 0.25 + (i * len * 0.18) / max(1, warts - 1) * 1.5;
    this.lights.push({ x: wx, y: sliceOutline(pts, wx).top + 1, r: 1.8, k: 1, esca: false });
  }
  if (tw.male) {
    // a tiny parasitic male fused to her belly, with his own small light
    let mx = -len * 0.15;
    let my = sliceOutline(pts, mx).bottom;
    s.noStroke();
    s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2]);
    s.ellipse(mx, my + 3, 9, 5);
    this.lights.push({ x: mx - 4, y: my + 3, r: 0.9, k: 1, esca: false });
  }
  if (tw.rays) {
    // the fanfin's long fin rays, fanned above and below (recursion, week 9, one level)
    s.stroke(c[0], c[1], c[2], 110);
    for (let i = 0; i < 4; i++) {
      let ang = -HALF_PI - 0.9 + i * 0.5;
      this.branch(s, -len * 0.2, sliceOutline(pts, -len * 0.2).top, ang, len * 0.5, 1, 0.25, []);
      this.branch(s, -len * 0.2, sliceOutline(pts, -len * 0.2).bottom, -ang, len * 0.45, 1, 0.25, []);
    }
  }
  if (tw.bumps) {
    // the footballfish's bony bumps: a staggered grid of dots (modulo, week 3)
    s.noStroke();
    s.fill(230, 225, 215, 120);
    for (let i = -4; i <= 4; i++) {
      for (let j = -2; j <= 2; j++) {
        let bx = i * len * 0.1 + (j % 2) * len * 0.05;
        let by = j * h * 0.18;
        let sl = sliceOutline(pts, bx);
        if (by > sl.top + 2 && by < sl.bottom - 2 && bx < hingeX) s.circle(bx, by, 1.4);
      }
    }
  }
  s.noStroke();
  this.bakeLights(s, 120);
  this.box = { x0: -this.ox - (tw.rays ? len * 0.4 : 0), y0: -this.oy - (tw.rays ? len * 0.3 : 0), x1: len + fin + rod + 12 - this.ox, y1: h + top + 8 - this.oy + (tw.chinTree ? 20 : 0) };
};

// 8 - comb jelly: a see-through oval with eight shimmering comb rows, and two tentacles for some
Body.prototype.growComb = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let len = pickGene(this.gene("length"));
  let w = len * pickGene(this.gene("width"));
  let shape = this.gene("shape");
  let rows = round(this.amount("rows"));
  let rowLen = pickGene(this.gene("rowLen"));
  let dashes = pickGeneInt(this.gene("dashes"));
  this.shimmer = pickGene(this.gene("shimmer"));
  this.hasTentacles = round(this.amount("tentacles")) > 0;
  this.tentLen = len * pickGene(this.gene("tentLen"));
  if (shape === "belt") {
    len *= 2.4;
    w *= 0.35;
  }
  this.len = len;
  this.haloY = 0;

  // noise (week 5): the body. A lobed comb bulges at the front.
  let pts = this.outline(len / 2, w / 2, pickGene(this.gene("wobble")), 40);
  if (shape === "lobed") {
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].x > 0) pts[i].y *= 1 + 0.5 * (pts[i].x / (len / 2));
    }
    w *= 1.5;
  }
  if (shape === "sac") {
    // Beroe: a thimble, open at the front where the mouth is
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].x > len * 0.3) pts[i].x = len * 0.3;
    }
  }
  this.bodyPts = pts;

  this.ox = len / 2 + 3;
  this.oy = w / 2 + 3;
  this.sprite = this.makeSprite(len + 6, w + 6);
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  if (tw.flesh !== undefined) {
    // a tinted comb jelly (the bloodybelly's red, Beroe's pink)
    s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 130);
    s.stroke(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 200);
  } else {
    s.fill(c[0], c[1], c[2], 22);
    s.stroke(c[0], c[1], c[2], 120);
  }
  s.strokeWeight(0.9);
  fillPolygon(s, pts);
  if (shape === "sac") s.line(len * 0.3, -w * 0.4, len * 0.3, w * 0.4); // the open mouth
  s.noStroke();
  // the gut, a faint line down the middle
  s.stroke(c[0], c[1], c[2], 60);
  s.line(-len * 0.3, 0, len * 0.4, 0);
  s.noStroke();

  // the comb rows: meridians from pole to pole, four seen on each
  // side at different heights, each a line of dashes (the ctenes)
  this.rows = [];
  let perSide = max(1, floor(rows / 2));
  for (let r = 0; r < rows; r++) {
    let side = r < perSide ? -1 : 1;
    let f = ((r % perSide) + 0.5) / perSide; // 0..1 across the visible half
    let row = [];
    for (let d = 0; d < dashes; d++) {
      let u = (d + 0.5) / dashes;
      let x = lerp(-len / 2 * rowLen, len / 2 * rowLen, u);
      let sl = sliceOutline(pts, x);
      let edge = side < 0 ? sl.top : sl.bottom;
      row.push({ x: x, y: edge * (0.35 + 0.6 * f) });
    }
    this.rows.push(row);
  }
  this.box = { x0: -this.ox - (this.hasTentacles ? this.tentLen : 0), y0: -this.oy - 4, x1: len + 6 - this.ox, y1: w + 6 - this.oy + (this.hasTentacles ? this.tentLen * 0.4 : 0) };
};

// 9 - shrimp: a carapace with a rostrum and stalked eyes, a curled abdomen, legs and a tail fan
Body.prototype.growShrimp = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let len = pickGene(this.gene("length"));
  let nSeg = tw.copepod ? 2 : pickGeneInt(this.gene("segments"));
  let curl = tw.copepod ? 0.1 : pickGene(this.gene("curl"));
  this.copepod = tw.copepod === true;
  let legs = pickGeneInt(this.gene("legs"));
  let lightEvery = pickGeneInt(this.gene("lightEvery"));
  let rostrum = len * pickGene(this.gene("rostrum"));
  let eye = pickGene(this.gene("eye"));
  let fan = pickGene(this.gene("fan"));
  this.antenna = len * pickGene(this.gene("antenna"));
  this.flick = pickGene(this.gene("flick"));
  this.len = len;
  // most deep shrimp are red, the glow tints it
  if (tw.flesh === undefined) this.bodyCol = mixColour(c, [120, 50, 40], 0.55);
  this.haloY = 0;

  // noise (week 5): the carapace, the front third of the animal
  let cl = len * 0.4;
  let ch = len * 0.22;
  let pts = this.outline(cl / 2, ch / 2, pickGene(this.gene("wobble")), 28);

  let drop = len * 0.6 * sin(curl * 0.9) + fan; // how far the curled tail hangs below
  this.ox = len * 0.6 + 4;
  this.oy = ch / 2 + 6;
  this.sprite = this.makeSprite(len * 0.6 + cl / 2 + rostrum + 6, ch + drop + 14);
  let s = this.sprite;
  s.translate(this.ox, this.oy);

  // the abdomen: segments as overlapping ovals along an arc that
  // bends down by curl. Drawn tail first so each overlaps the next.
  let segLen = (len * 0.6) / nSeg;
  let x = -cl / 2 + 2;
  let y = 0;
  let a = PI; // walking backward
  let joints = [];
  for (let i = 0; i < nSeg; i++) {
    joints.push({ x: x, y: y, a: a, w: ch * (0.95 - 0.1 * i) });
    a -= (curl * 1.3) / nSeg; // turning down (y grows)
    x += cos(a) * segLen;
    y -= sin(a) * segLen;
  }
  // the tail fan at the last joint: a few triangles spread like a hand
  let last = joints[nSeg - 1];
  s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 200);
  s.noStroke();
  for (let f = -1; f <= 1; f++) {
    let fa = last.a + f * 0.35;
    s.triangle(last.x, last.y, last.x + cos(fa + 0.2) * fan, last.y - sin(fa + 0.2) * fan, last.x + cos(fa - 0.2) * fan, last.y - sin(fa - 0.2) * fan);
  }
  for (let i = nSeg - 1; i >= 0; i--) {
    let j = joints[i];
    s.push();
    s.translate(j.x, j.y);
    s.rotate(-j.a + PI);
    this.fleshStyle(s);
    s.ellipse(segLen * 0.4, 0, segLen * 1.3, j.w);
    // a darker line marks the joint between segments
    s.noFill();
    s.stroke(10, 8, 12, 120);
    s.strokeWeight(0.7);
    s.arc(segLen * 0.9, 0, segLen * 0.5, j.w, -HALF_PI, HALF_PI);
    s.pop();
    // modulo (week 3): a photophore under every lightEvery-th segment
    if (i % lightEvery === 0) {
      let ux = j.x + cos(j.a - HALF_PI) * j.w * 0.5;
      let uy = j.y - sin(j.a - HALF_PI) * j.w * 0.5;
      this.lights.push({ x: ux, y: uy, r: 1.2, k: i / nSeg });
    }
  }
  s.noStroke();

  // the carapace on top, the rostrum spiking forward, stalked eyes
  this.fleshStyle(s);
  fillPolygon(s, pts);
  s.noStroke();
  s.stroke(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2]);
  s.strokeWeight(1.2);
  s.line(cl / 2 - 2, -ch * 0.15, cl / 2 + rostrum, -ch * 0.35);
  s.strokeWeight(0.8);
  s.line(cl * 0.38, -ch * 0.1, cl * 0.5, -ch * 0.5);
  s.noStroke();
  if (eye > 0) {
    s.fill(4, 6, 12);
    s.circle(cl * 0.5, -ch * 0.5, eye);
  }
  // legs: thin lines hanging from the carapace, angled back
  s.stroke(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 180);
  s.strokeWeight(0.7);
  for (let l = 0; l < legs; l++) {
    let lx = lerp(cl * 0.3, -cl * 0.35, l / max(1, legs - 1));
    let ly = sliceOutline(pts, lx).bottom;
    s.line(lx, ly, lx - 3, ly + ch * 0.55);
    s.line(lx - 3, ly + ch * 0.55, lx - 6, ly + ch * 0.9);
  }
  s.noStroke();
  // lights under the carapace too
  for (let l = 0; l < 3; l++) {
    let lx = lerp(cl * 0.3, -cl * 0.3, l / 2);
    this.lights.push({ x: lx, y: sliceOutline(pts, lx).bottom - 1, r: 1.3, k: 0 });
  }
  this.bakeLights(s, 90);
  this.box = { x0: -this.ox, y0: -this.oy - 2, x1: cl / 2 + rostrum + 4, y1: ch + drop + 14 - this.oy };
};

// 10 - octopus: a rounded mantle at the front, big eyes, ear fins for some. the arms move live
Body.prototype.growOctopus = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let ml = pickGene(this.gene("mantle"));
  let mh = ml * pickGene(this.gene("round"));
  let fins = ml * this.amount("fins");
  let eye = pickGene(this.gene("eye"));
  this.ml = ml;
  this.mh = mh;
  this.arms = round(this.amount("arms"));
  this.armLen = ml * pickGene(this.gene("armLen"));
  this.web = this.amount("web");
  this.spread = pickGene(this.gene("spread"));
  this.wave = pickGene(this.gene("wave"));
  this.armLights = round(this.amount("armLights")); // 0 none, 1 tips, 2 a row down every arm
  this.mouthRing = tw.mouthRing === true;
  this.armTips = [];
  this.armPts = [];
  if (tw.flesh === undefined) this.bodyCol = mixColour(c, [90, 40, 50], 0.6);
  this.haloY = 0;

  // noise (week 5): the mantle, a soft rounded sack
  let pts = this.outline(ml / 2, mh / 2, pickGene(this.gene("wobble")), 36);
  for (let i = 0; i < pts.length; i++) pts[i].x += ml * 0.3;

  let hh = mh + 2 * fins + 8;
  this.ox = ml * 0.25 + 6;
  this.oy = hh / 2;
  this.sprite = this.makeSprite(ml * 1.05 + 10, hh);
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  // ear fins, if any, behind the mantle's widest point
  if (fins > 0) {
    s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 220);
    s.ellipse(ml * 0.35, -mh * 0.45 - fins * 0.4, fins * 1.4, fins);
    s.ellipse(ml * 0.35, mh * 0.45 + fins * 0.4, fins * 1.4, fins);
  }
  this.fleshStyle(s);
  fillPolygon(s, pts);
  s.ellipse(0, 0, ml * 0.5, mh * 0.75); // the head
  s.noStroke();
  s.fill(225, 235, 240);
  s.circle(-ml * 0.02, -mh * 0.22, eye);
  s.circle(-ml * 0.02, mh * 0.22, eye);
  s.fill(4, 8, 16);
  s.circle(-ml * 0.02, -mh * 0.22, eye * 0.5);
  s.circle(-ml * 0.02, mh * 0.22, eye * 0.5);
  this.box = { x0: -this.ox - this.armLen, y0: -hh / 2 - this.armLen * 0.4, x1: ml * 1.05 + 10 - this.ox, y1: hh / 2 + this.armLen * 0.4 };
};

// draws each light dimly into the sprite, so the body still reads when nothing lights it
Body.prototype.bakeLights = function (g, alpha) {
  let c = this.look.col;
  if (this.noLight) return;
  g.noStroke();
  g.fill(c[0], c[1], c[2], min(255, alpha * this.glow));
  for (let i = 0; i < this.lights.length; i++) {
    g.circle(this.lights[i].x, this.lights[i].y, this.lights[i].r * 1.4);
  }
};

// the fill for a body part: the flesh colour, or a faint wash with a bright edge if see-through
Body.prototype.fleshStyle = function (g) {
  let c = this.look.col;
  let b = this.bodyCol;
  if (this.clear) {
    g.fill(c[0], c[1], c[2], 26);
    g.stroke(c[0], c[1], c[2], 110);
    g.strokeWeight(0.8);
  } else if (b[0] + b[1] + b[2] < 60) {
    // a near-black body would vanish in the water, so it gets a faint edge in its own light
    g.fill(b[0], b[1], b[2]);
    g.stroke(c[0], c[1], c[2], 60);
    g.strokeWeight(0.7);
  } else {
    g.fill(b[0], b[1], b[2]);
    g.noStroke();
  }
};

///////////////////////////////////////////////////////////////////
// Techniques
// The generative tools the grow functions share. All of these run
// once at birth, so none of them needs to be fast.
///////////////////////////////////////////////////////////////////

// noise (week 5): an ellipse wobbled by noise read round a circle, so it closes without a seam
Body.prototype.outline = function (rx, ry, wobble, steps) {
  // shiffman's polar noise loop: the noise is read on a small circle in noise space,
  // so the last point meets the first. the nose is at index 0, facing right
  let pts = [];
  let off = (this.mix % 1000) * 0.37;
  for (let i = 0; i < steps; i++) {
    let a = (i / steps) * TWO_PI;
    let n = noise(off + 1.2 * cos(a), off + 1.2 * sin(a));
    let w = 1 - wobble + 2 * wobble * n;
    pts.push({ x: cos(a) * rx * w, y: sin(a) * ry * w });
  }
  return pts;
};

// where the outline crosses the vertical line at x: the top and bottom of the body there
function sliceOutline(pts, x) {
  let top = 0;
  let bottom = 0;
  for (let i = 0; i < pts.length; i++) {
    let a = pts[i];
    let b = pts[(i + 1) % pts.length];
    if ((a.x <= x && b.x > x) || (b.x <= x && a.x > x)) {
      let y = a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  return { top: top, bottom: bottom };
}

// the piece of the outline between two vertical lines, as a closed shape. used for stripes
function outlineStrip(pts, x0, x1) {
  let a = sliceOutline(pts, x0);
  let b = sliceOutline(pts, x1);
  let half = pts.length / 2;
  let poly = [{ x: x0, y: a.top }];
  for (let i = half; i < pts.length; i++) {
    if (pts[i].x > x0 && pts[i].x < x1) poly.push(pts[i]);
  }
  poly.push({ x: x1, y: b.top });
  poly.push({ x: x1, y: b.bottom });
  for (let i = 0; i <= half; i++) {
    if (pts[i].x > x0 && pts[i].x < x1) poly.push(pts[i]);
  }
  poly.push({ x: x0, y: a.bottom });
  return poly;
}

// l-system (week 10): rewrites every letter with its rule, gens times
function growLsystem(axiom, rules, gens) {
  let s = axiom;
  for (let g = 0; g < gens; g++) {
    let next = "";
    for (let i = 0; i < s.length; i++) {
      let ch = s.charAt(i);
      next += rules[ch] !== undefined ? rules[ch] : ch;
    }
    s = next;
  }
  return s;
}

// l-system (week 10): the turtle from the plant demo, returning segments, lights and their box
function walkTurtle(s, x, y, heading, step, stemStep, angle) {
  // F and G step forward (G is the thicker stem step), + and - turn, [ and ] save and
  // restore the state, L marks a light. we keep our own x, y and heading instead of
  // translate() and rotate() so we can remember where the lights are
  let segs = [];
  let lights = [];
  let stack = [];
  let depth = 0;
  let box = { x0: x, y0: y, x1: x, y1: y };
  for (let i = 0; i < s.length; i++) {
    let ch = s.charAt(i);
    if (ch === "F" || ch === "G") {
      let len = ch === "G" ? stemStep : step;
      let nx = x + cos(heading) * len;
      let ny = y + sin(heading) * len;
      segs.push({ x0: x, y0: y, x1: nx, y1: ny, depth: depth });
      x = nx;
      y = ny;
      box = unionBox(box, { x0: x, y0: y, x1: x, y1: y });
    } else if (ch === "+") {
      heading += angle;
    } else if (ch === "-") {
      heading -= angle;
    } else if (ch === "[") {
      stack.push({ x: x, y: y, heading: heading });
      depth++;
    } else if (ch === "]") {
      let st = stack.pop();
      x = st.x;
      y = st.y;
      heading = st.heading;
      depth--;
    } else if (ch === "L") {
      lights.push({ x: x, y: y, r: 1.5, k: 0 });
    }
  }
  return { segs: segs, lights: lights, box: box };
}

// recursion (week 9): the branch() tree from class, kept shallow, collecting its tips
Body.prototype.branch = function (g, x, y, heading, len, depth, spread, tips) {
  // one line, then two smaller branches from its end. the angles jitter with random(),
  // which is stable because the seed was set at birth
  let nx = x + cos(heading) * len;
  let ny = y + sin(heading) * len;
  g.strokeWeight((0.5 + depth * 0.35) * (this.branchWeight !== undefined ? this.branchWeight : 1));
  g.line(x, y, nx, ny);
  if (depth <= 0) {
    tips.push({ x: nx, y: ny });
    return;
  }
  this.branch(g, nx, ny, heading + spread * random(0.7, 1.3), len * 0.68, depth - 1, spread, tips);
  this.branch(g, nx, ny, heading - spread * random(0.7, 1.3), len * 0.68, depth - 1, spread, tips);
};

// strokes a list of turtle segments, thinner and fainter the deeper the branch
function drawSegments(g, segs, c, weight, alpha) {
  for (let i = 0; i < segs.length; i++) {
    let s = segs[i];
    let d = max(s.depth, 0);
    g.stroke(c[0], c[1], c[2], alpha * pow(0.8, d));
    // depth below 0 means thicker
    g.strokeWeight(max(weight * pow(0.55, d) * (s.depth < 0 ? 1 - s.depth : 1), 0.6));
    g.line(s.x0, s.y0, s.x1, s.y1);
  }
}

// fills a closed shape through a list of points
function fillPolygon(g, pts) {
  g.beginShape();
  for (let i = 0; i < pts.length; i++) g.vertex(pts[i].x, pts[i].y);
  g.endShape(CLOSE);
}

// a fresh transparent sprite, drawn sk times larger so big species stay sharp when scaled up
Body.prototype.makeSprite = function (w, h) {
  let g = createGraphics(ceil(w * this.sk), ceil(h * this.sk));
  g.scale(this.sk);
  g.noStroke();
  return g;
};

// draws a sprite at its body-unit size, or a dark copy of it for a locked guide row
Body.prototype.blit = function (name, x, y, w, h, shadow) {
  let g = this[name];
  if (shadow) {
    if (this.shadows[name] === undefined) this.shadows[name] = shadowSprite(g);
    g = this.shadows[name];
  }
  if (w === undefined) {
    w = g.width / this.sk;
    h = g.height / this.sk;
  }
  image(g, x, y, w, h);
};

// a dark copy of a sprite: the same shape and alpha in one flat colour
function shadowSprite(g) {
  let d = createGraphics(g.width, g.height);
  d.image(g, 0, 0);
  d.loadPixels();
  for (let i = 0; i < d.pixels.length; i += 4) {
    d.pixels[i] = shadowCol[0];
    d.pixels[i + 1] = shadowCol[1];
    d.pixels[i + 2] = shadowCol[2];
  }
  d.updatePixels();
  return d;
}

// the smallest box that holds both boxes
function unionBox(a, b) {
  return { x0: min(a.x0, b.x0), y0: min(a.y0, b.y0), x1: max(a.x1, b.x1), y1: max(a.y1, b.y1) };
}

// between two [r, g, b] colours, t = 0 is the first
function mixColour(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

// a value from a [low, high] range, chosen with the seeded random()
function pickGene(range) {
  return random(range[0], range[1]);
}

// a whole number from a [low, high] range, both ends included
function pickGeneInt(range) {
  return floor(random(range[0], range[1] + 1));
}

///////////////////////////////////////////////////////////////////
// Rendering
// render() runs every frame for every creature on screen, so it is
// one image() for the still body plus a few shapes for the parts
// that move or glow. Glows use blendMode(ADD), reset to BLEND after.
///////////////////////////////////////////////////////////////////

// draws the creature at x, y facing heading, with flash (just struck) and lit (lure nearby)
Body.prototype.render = function (x, y, heading, flash, lit) {
  if (this.plan === 0) {
    this.drawSparkle(x, y, flash, lit, frameCount, false);
    return;
  }
  push();
  translate(x, y);
  if (this.plan === 2 || this.plan === 3) {
    rotate(heading + HALF_PI); // drawn pointing up, so -HALF_PI is upright
  } else {
    rotate(heading);
    if (cos(heading) < 0) scale(1, -1); // swimming left: flip so the belly stays down
  }
  if (this.size !== 1) scale(this.size);
  this.drawStill(frameCount, false);
  this.drawMoving(frameCount, flash, false);
  this.drawLights(flash, lit, frameCount);
  pop();
};

// a still lit portrait for the field guide, fitted inside px pixels
Body.prototype.renderIcon = function (x, y, px) {
  this.portrait(x, y, px, false);
};

// the same footprint dark and unlit, for a row not yet found
Body.prototype.renderSilhouette = function (x, y, px) {
  this.portrait(x, y, px, true);
};

// fits the whole drawing inside px pixels, every guide row the same size whatever the species
Body.prototype.portrait = function (x, y, px, shadow) {
  let c = this.look.col;
  push();
  translate(x, y);
  noStroke();
  if (this.plan === 0) {
    if (shadow) {
      fill(shadowCol[0], shadowCol[1], shadowCol[2]);
      circle(0, 0, px * 0.3);
    } else {
      if (!this.noLight) {
        blendMode(ADD);
        image(haloSprites[this.species], -px / 2, -px / 2, px, px);
        blendMode(BLEND);
      }
      let k = (px * 0.3) / this.dot;
      scale(k);
      this.drawSparkle(0, 0, 0, 1, 0);
    }
  } else {
    // the fit ignores this.size so every guide row has the same footprint
    let b = this.box;
    let k = px / max(b.x1 - b.x0, b.y1 - b.y0);
    scale(k);
    translate(-(b.x0 + b.x1) / 2, -(b.y0 + b.y1) / 2);
    this.drawStill(0, shadow);
    this.drawMoving(0, 0.4, shadow);
    if (!shadow) this.drawLights(0.45, 1, 0);
  }
  pop();
};

// 0 - sparkle, the cheap path: one of eight small shapes drawn live, a halo while it flashes
Body.prototype.drawSparkle = function (x, y, flash, lit, t) {
  let c = this.dotCol;
  // waves (week 4): a slow twinkle on its own phase
  let tw = 0.5 + 0.5 * sin(t * this.twinkle + this.phase);
  let a = 80 + 100 * tw + 75 * max(flash, lit);
  let d = this.dot * (1 + 1.5 * flash + 0.5 * lit);
  let sh = this.shape;
  noStroke();
  if (sh === "dot") {
    fill(c[0], c[1], c[2], a);
    circle(x, y, d);
  } else if (sh === "bead") {
    // an ostracod: a see-through round shell with two silver eyes
    fill(c[0], c[1], c[2], 70 + 60 * max(flash, lit));
    stroke(c[0], c[1], c[2], 160);
    strokeWeight(0.7);
    circle(x, y, this.dot);
    noStroke();
    fill(220, 225, 235, 230);
    circle(x + this.dot * 0.22, y - this.dot * 0.12, this.dot * 0.22);
    circle(x + this.dot * 0.22, y + this.dot * 0.12, this.dot * 0.22);
  } else if (sh === "spindle") {
    // a cell pointed at both ends
    fill(c[0], c[1], c[2], a);
    push();
    translate(x, y);
    rotate(this.phase);
    ellipse(0, 0, d * 2.4, d * 0.7);
    pop();
  } else if (sh === "spiny") {
    // an armoured cell with spines
    stroke(c[0], c[1], c[2], a * 0.7);
    strokeWeight(0.6);
    for (let i = 0; i < 5; i++) {
      let ang = this.phase + (i * TWO_PI) / 5;
      line(x, y, x + cos(ang) * d * 1.3, y + sin(ang) * d * 1.3);
    }
    noStroke();
    fill(c[0], c[1], c[2], a);
    circle(x, y, d);
  } else if (sh === "copepod") {
    // a teardrop with two antennae held out sideways
    stroke(c[0], c[1], c[2], a * 0.6);
    strokeWeight(0.6);
    line(x - d * 2, y - d * 0.6, x + d * 2, y - d * 0.6);
    noStroke();
    fill(c[0], c[1], c[2], a);
    ellipse(x, y, d, d * 1.6);
  } else if (sh === "worm") {
    // a short segmented worm with paddles, the light is yellow
    stroke(c[0], c[1], c[2], a * 0.8);
    strokeWeight(1.2);
    noFill();
    beginShape();
    for (let i = 0; i <= 5; i++) {
      curveVertex(x - d * 1.6 + i * d * 0.65, y + sin(t * 0.1 + this.phase + i) * d * 0.4);
      if (i === 0 || i === 5) curveVertex(x - d * 1.6 + i * d * 0.65, y + sin(t * 0.1 + this.phase + i) * d * 0.4);
    }
    endShape();
    noStroke();
  } else if (sh === "sapphire") {
    // a flat speck that flashes iridescent as it turns (waves, week 4):
    // bright only for a moment each turn, and never a glow
    let turn = sin(t * 0.06 + this.phase);
    let p = t * 0.06 + this.phase;
    let k = max(0, turn);
    fill(128 + 127 * sin(p), 128 + 127 * sin(p + 2.094), 128 + 127 * sin(p + 4.189), 40 + 215 * k * k);
    ellipse(x, y, d * 1.2, d * (0.3 + 0.9 * abs(turn)));
  } else {
    // "bean": a sea firefly, a tiny double shell
    fill(c[0], c[1], c[2], a);
    ellipse(x, y, d * 1.3, d);
    fill(4, 8, 16, 200);
    circle(x + d * 0.35, y, d * 0.3);
  }
  if (flash > 0.05 && !this.noLight) {
    blendMode(ADD);
    let hd = (10 + 34 * flash) * this.halo * this.size;
    image(haloSprites[this.species], x - hd / 2, y - hd / 2, hd, hd);
    blendMode(BLEND);
  }
};

// the cached still parts. the jelly breathes and the sea pen sways here, the others just blit
Body.prototype.drawStill = function (t, shadow) {
  if (this.plan === 2) {
    let b = sin(t * this.breathe + this.phase);
    push();
    shearX(0.1 * sin(t * this.breathe * 0.6 + this.phase)); // the tentacles trail behind the pulse
    this.blit("tentacles", -this.tox, -this.toy, undefined, undefined, shadow);
    pop();
    let sx = 1 + 0.07 * b; // the bell widens as it flattens
    let sy = 1 - 0.06 * b;
    this.blit("sprite", -this.ox * sx, -this.oy * sy, (this.sprite.width / this.sk) * sx, (this.sprite.height / this.sk) * sy, shadow);
  } else if (this.plan === 3) {
    // sway about the foot of the stalk. Left in place so the lights follow.
    let foot = this.box.y1 - 4;
    translate(0, foot);
    rotate(0.05 * sin(t * this.sway + this.phase));
    translate(0, -foot);
    this.blit("sprite", -this.ox, -this.oy, undefined, undefined, shadow);
  } else {
    this.blit("sprite", -this.ox, -this.oy, undefined, undefined, shadow);
  }
};

// the moving flesh: tails, squid arms and fins, eel bodies, comb tentacles, antennae, octopus arms
Body.prototype.drawMoving = function (t, flash, shadow) {
  let b = shadow ? shadowCol : this.bodyCol;
  noStroke();
  if (this.plan === 1 || this.plan === 4 || this.plan === 7) this.drawTail(t, flash, b);
  else if (this.plan === 5) this.drawSquidArms(t, flash, b, shadow);
  else if (this.plan === 6) this.drawEelBody(t, b, shadow);
  else if (this.plan === 8) this.drawCombTentacles(t, flash, b);
  else if (this.plan === 9) this.drawAntennae(t, flash, b);
  else if (this.plan === 10) this.drawOctopusArms(t, flash, b, shadow);
};

// waves (week 4): the tail flicks with sin(), harder when struck
Body.prototype.drawTail = function (t, flash, b) {
  let k = sin(t * this.flick + this.phase) * 0.4 * (1 + flash);
  let tl = this.tail;
  push();
  translate(-this.len / 2 + 1, 0);
  rotate(k);
  fill(b[0], b[1], b[2], b[3] !== undefined ? b[3] : 220);
  if (this.plan === 4) quad(0, 0, -tl, -tl * 0.5, -tl * 0.7, 0, -tl, tl * 0.5);
  else triangle(0, 0, -tl, -tl * 0.55, -tl, tl * 0.55);
  pop();
};

// waves (week 4): the two long arms trail and wave, the fins ripple, firefly arms carry lights
Body.prototype.drawSquidArms = function (t, flash, b, shadow) {
  let c = this.look.col;
  let steps = 7;
  let armX = -10;
  let sway = 0.2 + flash; // a struck squid thrashes
  stroke(b[0], b[1], b[2], 220);
  strokeWeight(1.3);
  noFill();
  for (let side = -1; side <= 1; side += 2) {
    beginShape();
    for (let i = 0; i <= steps; i++) {
      let u = i / steps;
      let y = side * (2 + u * u * this.mh * 0.45) + sin(t * 0.08 + this.phase + u * 4) * 4 * u * sway;
      curveVertex(armX - u * this.longArm, y);
      if (i === 0 || i === steps) curveVertex(armX - u * this.longArm, y);
    }
    endShape();
  }
  noStroke();
  if (this.tweak.armLights && !shadow) {
    blendMode(ADD);
    this.lightFill(c, 0.47 + 0.53 * flash);
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 1; i <= steps; i++) {
        if (i % 3 !== 0) continue;
        let u = i / steps;
        let y = side * (2 + u * u * this.mh * 0.45) + sin(t * 0.08 + this.phase + u * 4) * 4 * u * sway;
        circle(armX - u * this.longArm, y, 1.6 + flash);
      }
    }
    blendMode(BLEND);
  }
  // the fins: a pair of rhombs (or rounded lobes) at the tip, rippling
  let r = 1 + 0.3 * sin(t * this.ripple + this.phase);
  let fx = this.ml * 0.55;
  let fw = this.ml * 0.42;
  let fh = this.mh * this.fin * 1.6 * r;
  fill(b[0], b[1], b[2], 170);
  if (this.finShape === "round") {
    ellipse(fx + fw * 0.5, -this.mh * 0.25 - fh * 0.5, fw, fh);
    ellipse(fx + fw * 0.5, this.mh * 0.25 + fh * 0.5, fw, fh);
  } else {
    triangle(fx, -this.mh * 0.2, fx + fw * 0.45, -this.mh * 0.3 - fh, fx + fw, -this.mh * 0.05);
    triangle(fx, this.mh * 0.2, fx + fw * 0.45, this.mh * 0.3 + fh, fx + fw, this.mh * 0.05);
  }
};

// waves (week 4): where segment i of the eel is now. the head barely moves, the tail swings
Body.prototype.eelY = function (i, t) {
  let u = i / this.segs;
  return this.amp * (0.1 + 0.9 * u) * sin(t * this.freq - u * TWO_PI * this.waves + this.phase);
};

// the eel's body as one tapered shape along the wave, and a fin along the back for ribbons
Body.prototype.drawEelBody = function (t, b, shadow) {
  let n = this.segs;
  let segLen = this.len / n;
  let c = this.look.col;
  let ys = [];
  for (let i = 0; i <= n; i++) ys.push(this.eelY(i, t));

  if (this.tweak.fin) {
    if (shadow) fill(b[0], b[1], b[2], 120);
    else if (this.finCol !== null) fill(this.finCol[0], this.finCol[1], this.finCol[2], 170);
    else fill(c[0], c[1], c[2], 60);
    beginShape();
    for (let i = 1; i < n; i++) vertex(-i * segLen, ys[i] - this.thick * 0.5 - 3 - 2 * sin(i * 0.9 + t * 0.1));
    for (let i = n - 1; i >= 1; i--) vertex(-i * segLen, ys[i]);
    endShape(CLOSE);
  }

  if (this.clear && !shadow) {
    fill(c[0], c[1], c[2], 40);
    stroke(c[0], c[1], c[2], 110);
    strokeWeight(0.7);
  } else {
    fill(b[0], b[1], b[2]);
  }
  beginShape();
  for (let i = 0; i <= n; i++) {
    let w = this.thick * 0.5 * pow(1 - i / n, 0.7) + 0.3;
    vertex(-i * segLen, ys[i] - w);
  }
  for (let i = n; i >= 0; i--) {
    let w = this.thick * 0.5 * pow(1 - i / n, 0.7) + 0.3;
    vertex(-i * segLen, ys[i] + w);
  }
  endShape(CLOSE);
  noStroke();
};

// waves (week 4): the comb jelly's two tentacles trail behind, with side threads every second point
Body.prototype.drawCombTentacles = function (t, flash, b) {
  if (!this.hasTentacles) return;
  let steps = 8;
  stroke(b[0], b[1], b[2], 200);
  strokeWeight(0.9);
  noFill();
  for (let side = -1; side <= 1; side += 2) {
    beginShape();
    for (let i = 0; i <= steps; i++) {
      let u = i / steps;
      let x = -this.len * 0.3 - u * this.tentLen;
      let y = side * (3 + u * u * this.len * 0.2) + sin(t * 0.05 + this.phase + u * 3) * 3 * u * (1 + flash);
      curveVertex(x, y);
      if (i === 0 || i === steps) curveVertex(x, y);
      if (i % 2 === 0 && i > 0) line(x, y, x - 2, y + side * 4); // a tentillum
    }
    endShape();
  }
  noStroke();
};

// waves (week 4): the shrimp's two long antennae sweep back and sway, harder when struck
Body.prototype.drawAntennae = function (t, flash, b) {
  stroke(b[0], b[1], b[2], 200);
  strokeWeight(0.7);
  noFill();
  if (this.copepod) {
    // a copepod holds its two antennae straight out sideways
    let wag = sin(t * this.flick + this.phase) * 0.1 * (1 + 3 * flash);
    for (let side = -1; side <= 1; side += 2) {
      line(this.len * 0.2, 0, this.len * 0.2 - this.antenna * 0.3, side * this.antenna * (0.9 + wag));
    }
    noStroke();
    return;
  }
  for (let side = -1; side <= 1; side += 2) {
    let wag = sin(t * this.flick + this.phase + side) * 0.15 * (1 + 3 * flash);
    let ex = this.len * 0.22 - this.antenna * cos(0.6 + wag);
    let ey = -this.len * 0.05 - side * this.antenna * sin(0.6 + wag) * 0.5;
    bezier(this.len * 0.22, -this.len * 0.06, this.len * 0.3, -this.len * 0.2 - side * 4, ex + this.antenna * 0.3, ey, ex, ey);
  }
  noStroke();
};

// waves (week 4): eight arms fan out behind the head and wave, webbed for the cirrate kinds
Body.prototype.drawOctopusArms = function (t, flash, b, shadow) {
  let n = this.arms;
  let steps = 6;
  let baseX = -this.ml * 0.2;
  let pts = [];
  this.armTips = [];
  for (let a = 0; a < n; a++) {
    let u = n === 1 ? 0.5 : a / (n - 1);
    let ang = PI + (u - 0.5) * this.spread * 2;
    let arm = [];
    let x = baseX;
    let y = (u - 0.5) * this.mh * 0.5;
    let heading = ang;
    for (let i = 0; i <= steps; i++) {
      arm.push({ x: x, y: y });
      let v = i / steps;
      // the wave runs out along the arm, and a struck octopus flares them wide
      heading += sin(t * this.wave + this.phase + a * 0.8 - v * 3) * 0.25 * (v + 0.2) + (u - 0.5) * 0.15 * flash;
      let step = this.armLen / steps;
      x += cos(heading) * step;
      y += sin(heading) * step;
    }
    pts.push(arm);
    this.armTips.push(arm[steps]);
  }
  this.armPts = pts;
  if (this.web > 0) {
    // the umbrella: a skin from the head out to a point on every arm
    let k = max(1, round(this.web * steps));
    fill(b[0], b[1], b[2], shadow ? 255 : 130);
    beginShape();
    vertex(baseX + 2, -this.mh * 0.3);
    for (let a = 0; a < n; a++) {
      for (let i = 1; i <= k; i++) {
        if (a === 0 || a === n - 1 || i === k) vertex(pts[a][i].x, pts[a][i].y);
      }
    }
    vertex(baseX + 2, this.mh * 0.3);
    endShape(CLOSE);
  }
  for (let a = 0; a < n; a++) {
    for (let i = 0; i < steps; i++) {
      stroke(b[0], b[1], b[2], 230);
      strokeWeight(3 * (1 - i / steps) + 0.6);
      line(pts[a][i].x, pts[a][i].y, pts[a][i + 1].x, pts[a][i + 1].y);
    }
  }
  noStroke();
};

// sets the fill for a light: the glow colour at brightness b, scaled by the species' glow gene
Body.prototype.lightFill = function (c, b) {
  fill(c[0], c[1], c[2], 255 * min(1, b * this.glow));
};

// the glowing parts, added onto the water: the flash halo and the photophores of each plan
Body.prototype.drawLights = function (flash, lit, t) {
  let c = this.look.col;
  noStroke();
  blendMode(ADD);
  if (this.noLight) {
    // no light of its own: a strike only catches the lure's light on
    // its body for a moment, a faint reflected flash and nothing else
    if (flash > 0.05) {
      let d = planRadius[this.plan] * (1.5 + 1.5 * flash);
      image(haloSprites[this.species], -d / 2, this.haloY - d / 2, d, d);
    }
    blendMode(BLEND);
    return;
  }
  if (flash > 0.05) {
    let d = planRadius[this.plan] * (3 + 4 * flash);
    image(haloSprites[this.species], -d / 2, this.haloY - d / 2, d, d);
  }
  if (this.plan === 1 || this.plan === 5 || this.plan === 9) this.drawRowLights(c, flash, lit);
  else if (this.plan === 2) this.drawJellyLights(c, flash, lit, t);
  else if (this.plan === 3) this.drawSeaPenLights(c, flash, lit);
  else if (this.plan === 4) this.drawDragonLights(c, flash, lit, t);
  else if (this.plan === 6) this.drawEelLights(c, flash, lit, t);
  else if (this.plan === 7) this.drawAnglerLights(c, flash, lit, t);
  else if (this.plan === 8) this.drawCombLights(c, flash, lit, t);
  else this.drawOctopusLights(c, flash, lit, t);
  blendMode(BLEND);
};

// photophores that brighten with the flash and the lure. a glass creature stays dark until lit
Body.prototype.drawRowLights = function (c, flash, lit) {
  let base = this.clear ? 0.05 : 0.2;
  let b = base + (1 - base) * max(flash, lit);
  this.lightFill(c, b);
  let L = this.lights;
  for (let i = 0; i < L.length; i++) {
    circle(L[i].x, L[i].y, L[i].r * (1.4 + 1.2 * flash));
  }
};

// the alarm: a pulse of light runs round the ring of rim lights
Body.prototype.drawJellyLights = function (c, flash, lit, t) {
  let sx = 1 + 0.07 * sin(t * this.breathe + this.phase); // follow the breathing bell
  let sy = 1 - 0.06 * sin(t * this.breathe + this.phase);
  let L = this.lights;
  for (let i = 0; i < L.length; i++) {
    let run = 0.5 + 0.5 * sin(t * 0.35 - L[i].k * TWO_PI * 2);
    this.lightFill(c, 0.15 + 0.5 * lit + flash * (0.4 + 0.8 * run));
    circle(L[i].x * sx, L[i].y * sy, L[i].r * (1.4 + 1.5 * flash * run));
  }
};

// the light climbs the stem as the flash fades, lighting each polyp. the ember whip flares at once
Body.prototype.drawSeaPenLights = function (c, flash, lit) {
  let pos = 1 - flash;
  let f = sqrt(flash);
  let L = this.lights;
  for (let i = 0; i < L.length; i++) {
    let near = this.tweak.flare ? 1 : max(0, 1 - abs(L[i].k - pos) * 3);
    this.lightFill(c, 0.12 + 0.5 * lit + f * near);
    circle(L[i].x, L[i].y, L[i].r * (1.4 + 2 * f * near));
  }
  if (flash > 0.03 && !this.tweak.flare) {
    let y = this.base - pos * this.stemH;
    this.lightFill(c, 0.86 * f);
    circle(0, y, 3 + 3 * f);
    let d = 8 + 24 * f;
    image(haloSprites[this.species], -d / 2, y - d / 2, d, d);
  }
};

// belly lights, a flickering lure, the sweeping searchlight. the angler's lamp dims as you near
Body.prototype.drawDragonLights = function (c, flash, lit, t) {
  let b = 0.15 + 0.85 * max(flash, lit);
  let L = this.lights;
  for (let i = 0; i < L.length; i++) {
    let l = L[i];
    let a = b;
    if (l.lamp) a = this.tweak.lampSteady ? 0.8 + 0.2 * flash : 0.7 * (1 - lit) + flash;
    // blinks, and switches off when you come close
    else if (l.eye) a = 0.6 * (0.5 + 0.5 * sin(t * 0.05 + this.phase)) * (1 - lit) + flash;
    else if (l.lure) a = 0.35 + 0.35 * sin(t * 0.09 + this.phase + l.x) + 0.3 * flash;
    this.lightFill(c, a);
    circle(l.x, l.y, l.r * (1.4 + 1.2 * flash));
    if (l.lamp) {
      let d = 18 + 20 * a;
      image(haloSprites[this.species], l.x - d / 2, l.y - d / 2, d, d);
    }
  }
  if (this.beamStrength > 0) {
    let sweep = 0.12 * sin(t * 0.017 + this.phase);
    let glow = (0.1 + 0.55 * max(flash, lit * 0.7)) * this.beamStrength;
    push();
    translate(this.beamX, this.beamY);
    rotate(sweep);
    fill(c[0], c[1], c[2], 70 * glow);
    triangle(0, 0, this.beam, -this.beam * 0.24, this.beam, this.beam * 0.24);
    fill(c[0], c[1], c[2], 110 * glow);
    triangle(0, 0, this.beam * 0.8, -this.beam * 0.1, this.beam * 0.8, this.beam * 0.1);
    fill(c[0], c[1], c[2], 255 * min(1, 0.5 + glow));
    circle(0, 0, 2.6 + 2 * flash);
    pop();
  }
};

// the eel's lights sit on the moving segments. a pulse runs tailward when struck
Body.prototype.drawEelLights = function (c, flash, lit, t) {
  let segLen = this.len / this.segs;
  let S = this.lightSegs;
  for (let i = 0; i < S.length; i++) {
    let k = S[i] / this.segs;
    let run = 0.5 + 0.5 * sin(t * 0.3 - k * 8);
    this.lightFill(c, 0.2 + 0.6 * lit + flash * (0.4 + 0.6 * run));
    circle(-S[i] * segLen, this.eelY(S[i], t), 1.8 + 1.5 * flash);
  }
  if (this.tailLight) {
    // the gulper's tail organ: a brighter light at the very tip, pulsing (waves, week 4)
    let a = 0.5 + 0.3 * sin(t * 0.08 + this.phase) + 0.4 * lit + flash;
    this.lightFill(c, a);
    let y = this.eelY(this.segs, t);
    circle(-this.len, y, 2.6 + 2 * flash);
    let d = 10 + 8 * a;
    image(haloSprites[this.species], -this.len - d / 2, y - d / 2, d, d);
  }
};

// the esca pulses slowly to tempt prey and flares when struck. the tuft's tips glow with it
Body.prototype.drawAnglerLights = function (c, flash, lit, t) {
  let L = this.lights;
  for (let i = 0; i < L.length; i++) {
    let l = L[i];
    let a = (l.esca ? 0.55 + 0.3 * sin(t * 0.06 + this.phase) : 0.3) + 0.3 * lit + flash;
    this.lightFill(c, a);
    circle(l.x, l.y, l.r * (1.4 + flash));
    if (l.esca) {
      let d = l.r * (5 + 6 * a);
      image(haloSprites[this.species], l.x - d / 2, l.y - d / 2, d, d);
    }
  }
};

// each comb dash takes its colour from a rainbow wave along the row. the body glows when struck
Body.prototype.drawCombLights = function (c, flash, lit, t) {
  let bright = 0.35 + 0.65 * max(flash, lit);
  strokeWeight(1.2);
  for (let r = 0; r < this.rows.length; r++) {
    let row = this.rows[r];
    for (let d = 0; d < row.length; d++) {
      let p = t * this.shimmer - d * 0.7 + r * 0.4 + this.phase;
      stroke(128 + 127 * sin(p), 128 + 127 * sin(p + 2.094), 128 + 127 * sin(p + 4.189), 255 * bright * this.glow);
      line(row[d].x - 1, row[d].y, row[d].x + 1, row[d].y);
    }
  }
  noStroke();
  if (flash > 0.02) {
    this.lightFill(c, 0.6 * flash);
    beginShape();
    for (let i = 0; i < this.bodyPts.length; i++) vertex(this.bodyPts[i].x, this.bodyPts[i].y);
    endShape(CLOSE);
  }
};

// arm tip or sucker lights for the species that have them, a mouth ring, a glow when struck
Body.prototype.drawOctopusLights = function (c, flash, lit, t) {
  if (this.armLights === 1) {
    this.lightFill(c, 0.3 + 0.5 * lit + flash);
    for (let i = 0; i < this.armTips.length; i++) {
      circle(this.armTips[i].x, this.armTips[i].y, 2 + 1.5 * flash);
    }
  } else if (this.armLights === 2) {
    // a row of glowing suckers down every arm, every other point (modulo, week 3)
    this.lightFill(c, 0.25 + 0.5 * lit + flash);
    for (let a = 0; a < this.armPts.length; a++) {
      for (let i = 2; i < this.armPts[a].length; i += 2) {
        circle(this.armPts[a][i].x, this.armPts[a][i].y, 1.4 + flash);
      }
    }
  }
  if (this.mouthRing) {
    // a ring of light round the mouth, between the eyes
    noFill();
    stroke(c[0], c[1], c[2], 255 * min(1, (0.5 + 0.5 * lit + flash) * this.glow));
    strokeWeight(1.5 + flash);
    circle(-this.ml * 0.12, 0, this.mh * 0.35);
    noStroke();
  }
  if (flash > 0.02) {
    this.lightFill(c, 0.35 * flash);
    ellipse(this.ml * 0.3, 0, this.ml, this.mh);
  }
};

///////////////////////////////////////////////////////////////////
// 6. CREATURES
// How the creatures move, school, migrate and react to the line.
///////////////////////////////////////////////////////////////////

// (week 6 boids) that also drifts on a noise field (week 5),
// rises and sinks with the tide, and reacts to the fishing line.
// It does not draw itself, it asks its Body (the Anatomy section) to. The
// Shoal manages the whole population: which period's species are
// alive, the slow swap when the period changes, and the plankton
// chain reaction.
//
// A creature is one species (the Species section) on one body plan. The plan
// decides how it moves (planBehaviour below, eleven plans), the
// species decides its depth band, its period and how many there are.
//
// Flocking adapted from the Week 6 boids template (Ashley Hi), which
// is based on Daniel Shiffman's Flocking example for p5.js, by way of
// our earlier haze project (its boid and flock files): neighbours from
// a spatial grid, alignment and cohesion within one species only, a
// noise flow field and the energy feedback loop. Rewritten here with
// plain x and y numbers instead of p5.Vector objects, so 800
// creatures can move without allocating anything each frame.

///////////////////////////////////////////////////////////////////
// Plan behaviour
// Same index as bodyPlans in the Species section. Add to the end, never reorder.
//   maxSpeed, maxForce     how fast it swims and how hard it can turn
//   sep, ali, coh          week 6 weights. 0 means the rule is off
//   flee                   how hard a moving line pushes it, as a
//                          multiple of maxForce
//   sense                  how far away it notices the line, in pixels
//   cool                   frames before it can light up again
//   dayDepth / nightDepth  where the plan sits as fractions of the
//                          canvas height, [shallowest, deepest]. A
//                          species' band picks a third of that range.
//                          Both stay inside the screen, so everything
//                          in the current period is reachable at any
//                          hour: the migration only shifts the set up
//                          at night and down by day. Only a species
//                          out of its period sinks below the screen.
///////////////////////////////////////////////////////////////////

// *** change how each body plan behaves here
let planBehaviour = [
  // 0 - sparkle: drifts only, no flocking. the line's wake nudges it
  { maxSpeed: 0.6, maxForce: 0.02, sep: 0, ali: 0, coh: 0, flee: 2.5, sense: 60, cool: 45, dayDepth: [0.25, 0.95], nightDepth: [0.06, 0.88] },
  // 1 - fish: tight schools that scatter from the line
  { maxSpeed: 2.1, maxForce: 0.045, sep: 1.7, ali: 1.0, coh: 0.75, flee: 14, sense: 110, cool: 45, dayDepth: [0.3, 0.92], nightDepth: [0.1, 0.78] },
  // 2 - jelly: slow, alone, moves in pulses, drifts aside
  { maxSpeed: 0.8, maxForce: 0.02, sep: 0.5, ali: 0, coh: 0, flee: 3, sense: 80, cool: 60, dayDepth: [0.3, 0.94], nightDepth: [0.12, 0.84] },
  // 3 - sea pen: anchored, only sways. speed 0 keeps it still
  { maxSpeed: 0, maxForce: 0, sep: 0, ali: 0, coh: 0, flee: 0, sense: 70, cool: 60, dayDepth: [0.62, 0.96], nightDepth: [0.5, 0.92] },
  // 4 - dragon: hunts alone with wide slow turns
  { maxSpeed: 0.9, maxForce: 0.03, sep: 0, ali: 0, coh: 0, flee: 1, sense: 60, cool: 60, dayDepth: [0.5, 0.95], nightDepth: [0.4, 0.86] },
  // 5 - squid: jets in bursts, then drifts. bolts from the line
  { maxSpeed: 2.6, maxForce: 0.03, sep: 0.6, ali: 0, coh: 0, flee: 12, sense: 100, cool: 50, dayDepth: [0.3, 0.94], nightDepth: [0.1, 0.84] },
  // 6 - eel: a slow travelling sine, keeps its heading, drifts aside
  { maxSpeed: 0.7, maxForce: 0.02, sep: 0.4, ali: 0, coh: 0, flee: 1.5, sense: 70, cool: 120, dayDepth: [0.3, 0.94], nightDepth: [0.15, 0.88] },
  // 7 - angler: hangs still in ambush, lunges at prey, ignores the line until struck
  { maxSpeed: 0.4, maxForce: 0.015, sep: 0.3, ali: 0, coh: 0, flee: 0, sense: 40, cool: 90, dayDepth: [0.55, 0.96], nightDepth: [0.42, 0.9] },
  // 8 - comb jelly: a steady gentle glide on its comb rows, slow turns, drifts aside
  { maxSpeed: 0.5, maxForce: 0.015, sep: 0.3, ali: 0, coh: 0, flee: 2, sense: 80, cool: 60, dayDepth: [0.3, 0.94], nightDepth: [0.1, 0.84] },
  // 9 - shrimp: small swarms, paddles forward in bursts, escapes with a backward tail flip
  { maxSpeed: 1.6, maxForce: 0.05, sep: 1.2, ali: 0.8, coh: 0.9, flee: 2, sense: 90, cool: 45, dayDepth: [0.3, 0.94], nightDepth: [0.08, 0.8] },
  // 10 - octopus: hovers on slow arm pulses, or crawls along the bottom. jets away when startled
  { maxSpeed: 0.6, maxForce: 0.02, sep: 0.4, ali: 0, coh: 0, flee: 1, sense: 90, cool: 60, dayDepth: [0.5, 0.96], nightDepth: [0.38, 0.9] }
];

// How many of a species to spawn, per 100k pixels of canvas, clamped.
// Bigger species are fewer (the count is divided by size).
// *** change the population here
let rarityCount = {
  common: { perArea: 1.8, min: 15, max: 30 }, // schools
  uncommon: { perArea: 0.3, min: 3, max: 5 },
  rare: { perArea: 0.1, min: 1, max: 2 }
};
// *** common plan 0 species, about 600 in all
let planktonCount = { perArea: 15, min: 60, max: 210 };
// *** where a species out of its period waits, as a fraction of height (below the screen)
let goneDepth = 1.3;
// *** how long a period's set takes to sink away, and the next to rise, at 60 fps
let swapSeconds = 20;
// *** how many of the new set are born each frame. growing a body costs about 1 ms,
// so 6 keeps the frame
let spawnPerFrame = 6;

// Shared tuning. Distances are squared once here so the loops never sqrt.
// *** alignment and cohesion range, keep <= the grid cell size (60 in the Main section)
let neighbourDist = 55;
let neighbourDistSq = neighbourDist * neighbourDist;
let flowScale = 0.002; // *** size of the swirls in the noise field
let flowSpeed = 0.002; // *** how fast the field itself changes
// *** sound.energy at which schools fully break up (one plankton chain is about 16)
let scatterEnergy = 40;
let litRange = 160; // *** how far the lure's glow reaches a creature

// Plankton chain reaction (see Shoal.spark). The struck one is
// generation 0, the ones it lights are generation 1, and so on.
let chainFanout = [3, 2, 1]; // *** how many neighbours each generation lights
let chainFlash = [1, 0.8, 0.65, 0.5]; // *** flash strength per generation
let chainDelay = 7; // *** frames between one light and the next
let chainDist = 42; // *** how far a spark can jump, keep <= grid cell size
let chainDistSq = chainDist * chainDist;
// *** lights waiting at once. keeps a sweep through a thick cloud from playing hundreds of notes
let chainMax = 36;

// Jelly pulse and squid jet.
let jellyBeat = 0.04; // *** phase per frame, about one squeeze every 2.5 s
let jellyThrust = 0.06; // *** push on each squeeze
let squidJetEvery = 130; // *** frames between jets, give or take a third
let squidJet = 2.2; // *** speed a jet adds, in pixels per frame

// The new deep-sea plans. Speeds in pixels per frame, times in frames.
let anglerLunge = 2.5; // *** speed of the lunge at prey
let anglerReach = 55; // *** how close prey must come, keep <= grid cell size
let anglerRest = 150; // *** frames between lunges
let anglerDart = 2; // *** speed of the startled dart when struck
let combThrust = 0.012; // *** the steady push of the comb rows
let shrimpPaddle = 0.09; // *** push of one paddle stroke
let shrimpFlip = 4; // *** speed of the backward tail flip
let shrimpFlipRest = 40; // *** frames before it can flip again
let octoPulse = 0.035; // *** push of one arm pulse
let octoBeat = 0.03; // *** phase per frame, one pulse every 3.5 s
let octoJet = 3.5; // *** speed of the escape jet
let octoJetRest = 90; // *** frames before it can jet again

///////////////////////////////////////////////////////////////////
// Creature Object
// One animal. Each plan has its own way of moving (see run), but
// they all feel the tide and their period, notice the line, and
// light up when struck. Interface the rest of the sketch relies on:
//   creature.species, .plan, .position, .velocity, .body, .gen
//   creature.family            same as .plan, kept for one round
//   creature.run(neighbours)   move, react, render
//   creature.strike()          the line hit it (flash, sound, guide)
///////////////////////////////////////////////////////////////////

// one animal: its species, body, position, speed, depth band, and how bright it glows
function Creature(x, y, species) {
  this.species = species;
  this.info = speciesList[species];
  this.plan = this.info.plan;
  this.family = this.plan; // the sound engine reads family too
  this.settings = planBehaviour[this.plan];
  this.body = new Body(species, random(100000));
  // how far the drawing reaches from its centre in any direction, so a
  // long body (an oarfish, a siphonophore) never pokes out of the water
  let bx = this.body.box;
  this.reach = max(abs(bx.x0), abs(bx.x1), abs(bx.y0), abs(bx.y1));

  this.position = createVector(x, y);
  this.maxSpeed = this.settings.maxSpeed / sqrt(this.info.size); // big things are slower
  this.maxForce = this.settings.maxForce;
  this.velocity = p5.Vector.random2D().mult(this.maxSpeed);
  this.ax = 0; // acceleration as two numbers, so no vectors are made per frame
  this.ay = 0;

  // the band takes a third of the plan's depth range, pref varies inside it
  let third = ["shallow", "mid", "deep"].indexOf(this.info.band);
  if (third < 0) third = 1;
  this.pref = (third + random()) / 3;
  this.present = 0; // 0 waiting below the screen, 1 at its depth. Ramps over swapSeconds
  // true once its period is over: present ramps back to 0, then the shoal removes it
  this.leaving = false;

  this.flash = 0; // 1 just after a strike, fades to 0
  this.panic = 0; // 1 while the line is shoving it, lets it go faster than it swims
  this.cooldown = 0; // frames until it can light up again
  this.gen = 0; // chain reaction generation of the last flash, the Sound section reads it
  this.seed = random(1000); // for its own noise wander

  // plan quirks
  this.angle = this.velocity.heading(); // where a jelly, squid, eel or dragon points
  this.phase = random(TWO_PI); // a jelly's pulse, an eel's wiggle
  this.jetIn = random(squidJetEvery); // frames until a squid's next jet
  this.burst = 0; // extra speed allowed after a dart, decays fast
  this.rest = 0; // frames until the next lunge, tail flip or escape jet
  // a bottom-dwelling octopus crawls instead of hovering
  this.crawl = this.plan === 10 && this.info.band === "deep";
  this.anchorX = x; // a sea pen never leaves this column
  this.sway = 0; // a sea pen's lean in radians, 0 is upright
  this.swayVel = 0;
}

// moves the creature its plan's way, feels the line, then draws it. below the screen only the tide
Creature.prototype.run = function (neighbours) {
  // coming or going: present ramps so a change of period, or a jump
  // of the clock, is a slow rise or sinking, never a teleport
  let step = 1 / (swapSeconds * 60);
  if (this.leaving) this.present = max(0, this.present - step);
  else this.present = min(1, this.present + step);

  let reachable = this.position.y < height + 40;

  if (!reachable && this.plan !== 3) {
    // out of sight, so only the tide matters. Keeps a waiting set cheap
    this.migrate(2);
  } else if (this.plan === 0) this.drift();
  else if (this.plan === 1) this.school(neighbours);
  else if (this.plan === 2) this.pulse(neighbours);
  else if (this.plan === 3) this.lean();
  else if (this.plan === 4) this.hunt(neighbours);
  else if (this.plan === 5) this.jet(neighbours);
  else if (this.plan === 6) this.undulate(neighbours);
  else if (this.plan === 7) this.ambush(neighbours);
  else if (this.plan === 8) this.glide(neighbours);
  else if (this.plan === 9) this.paddle(neighbours);
  else this.hover(neighbours);

  if (reachable) this.sense();
  this.update();
  this.borders();
  if (reachable) this.render();
};

// adds a steering force the reynolds way: desired minus velocity, capped at limit
Creature.prototype.steer = function (fx, fy, limit) {
  let m2 = fx * fx + fy * fy;
  if (m2 > limit * limit) {
    let s = limit / sqrt(m2);
    fx *= s;
    fy *= s;
  }
  this.ax += fx;
  this.ay += fy;
};

// noise flow field (week 5): one current for the whole sea, so neighbours swirl together
Creature.prototype.flow = function (w) {
  let a = noise(this.position.x * flowScale, this.position.y * flowScale, frameCount * flowSpeed) * TWO_PI * 2;
  this.steer(cos(a) * this.maxSpeed - this.velocity.x, sin(a) * this.maxSpeed - this.velocity.y, this.maxForce * w);
};

// where it belongs now: its band's depth this hour, or the waiting depth below the screen
Creature.prototype.wantDepth = function () {
  let home = tide.depthFor(this.pref, this.settings.dayDepth, this.settings.nightDepth);
  let u = this.present * this.present * (3 - 2 * this.present);
  return lerp(height * goneDepth, home, u);
};

// the daily migration: a capped pull toward wantDepth. gain above 1 beats the current
Creature.prototype.migrate = function (gain) {
  let pull = (this.wantDepth() - this.position.y) * 0.0004; // *** how firmly depth is held
  let limit = this.maxForce * gain;
  this.ay += constrain(pull, -limit, limit);
};

// turns angle toward a direction by a fraction, the short way round
Creature.prototype.turnToward = function (to, amount) {
  let diff = atan2(sin(to - this.angle), cos(to - this.angle));
  this.angle += diff * amount;
};

///////////////////////////////////////////////////////////////////
// Ways of moving
// One method per body plan. run() picks the right one.
///////////////////////////////////////////////////////////////////

// sparkle: carried by the current, no will of its own
Creature.prototype.drift = function () {
  this.flow(1);
  this.migrate(2);
};

// fish: the week 6 rules, loosened when the music is busy, plus the current and the tide
Creature.prototype.school = function (neighbours) {
  // Feedback loop from our earlier haze project: the busier the music gets, the less
  // the fish care about each other, so the school breaks up and the
  // music thins out. Once it is quiet again, they regroup.
  let calm = constrain(map(sound.energy, 0, scatterEnergy, 1, 0), 0, 1);

  this.separate(neighbours, this.settings.sep);
  this.align(neighbours, this.settings.ali * calm);
  this.cohesion(neighbours, this.settings.coh * calm);
  this.flow(lerp(1.2, 0.4, calm));
  this.migrate(2);
};

// jelly: a thrust on each squeeze of the bell, then it coasts and turns slowly
Creature.prototype.pulse = function (neighbours) {
  // the bell turns slowly on its own noise
  this.angle += (noise(this.seed, frameCount * 0.003) - 0.5) * 0.03; // *** how much a jelly wanders

  // sin() gives the beat; cubing it makes a short squeeze and a long rest
  this.phase += jellyBeat;
  let beat = max(0, sin(this.phase));
  beat = beat * beat * beat;
  this.ax += cos(this.angle) * beat * jellyThrust;
  this.ay += sin(this.angle) * beat * jellyThrust;

  // the water slows it between beats
  this.velocity.mult(0.965); // *** drag

  this.separate(neighbours, this.settings.sep);
  this.migrate(2);
};

// sea pen: anchored, it only rises and sinks with the tide and leans on a spring the line can knock
Creature.prototype.lean = function () {
  this.position.x = this.anchorX;
  this.position.y += (this.wantDepth() - this.position.y) * 0.01;

  let current = sin(frameCount * 0.01 + this.seed) * 0.15; // *** how far the current bends it
  this.swayVel += (current - this.sway) * 0.004; // *** stiffness of the stem
  this.swayVel *= 0.96;
  this.sway += this.swayVel;
};

// dragon: slow wide turns on its own noise, leaning toward any fish or shrimp it can see
Creature.prototype.hunt = function (neighbours) {
  this.angle += (noise(this.seed, frameCount * 0.004) - 0.5) * 0.06; // *** how wide the turns are

  let bestD = neighbourDistSq * 4; // it sees a little past the grid, but only what the grid returns
  let tx = 0;
  let ty = 0;
  for (let i = 0; i < neighbours.length; i++) {
    let other = neighbours[i];
    if (other.plan !== 1 && other.plan !== 9) continue;
    let dx = other.position.x - this.position.x;
    let dy = other.position.y - this.position.y;
    let d2 = dx * dx + dy * dy;
    if (d2 < bestD) {
      bestD = d2;
      tx = dx;
      ty = dy;
    }
  }
  // *** how keenly it turns toward prey
  if (tx !== 0 || ty !== 0) this.turnToward(atan2(ty, tx), 0.03);

  this.steer(cos(this.angle) * this.maxSpeed - this.velocity.x, sin(this.angle) * this.maxSpeed - this.velocity.y, this.maxForce);
  this.migrate(3);
};

// squid: a jet every couple of seconds in the direction it faces, then it drifts and slows
Creature.prototype.jet = function (neighbours) {
  // *** how much it turns between jets
  this.angle += (noise(this.seed, frameCount * 0.005) - 0.5) * 0.05;

  this.jetIn--;
  if (this.jetIn <= 0) {
    this.velocity.x += cos(this.angle) * squidJet;
    this.velocity.y += sin(this.angle) * squidJet;
    this.jetIn = squidJetEvery * random(0.66, 1.33);
  }
  this.velocity.mult(0.975); // *** drag between jets

  this.separate(neighbours, this.settings.sep);
  this.migrate(2);
};

// eel: a heading that turns slowly, swum along in a travelling sine (week 4)
Creature.prototype.undulate = function (neighbours) {
  // *** how slowly it changes course
  this.angle += (noise(this.seed, frameCount * 0.002) - 0.5) * 0.02;
  this.phase += 0.05; // *** how fast it wiggles

  // forward along the heading, plus a sideways sway at right angles to it
  let sway = sin(this.phase) * 0.6; // *** how wide the wiggle is, as a fraction of speed
  let dx = cos(this.angle) - sin(this.angle) * sway;
  let dy = sin(this.angle) + cos(this.angle) * sway;
  // 3 so the sway is not flattened by the cap
  this.steer(dx * this.maxSpeed - this.velocity.x, dy * this.maxSpeed - this.velocity.y, this.maxForce * 3);

  this.separate(neighbours, this.settings.sep);
  this.migrate(2);
};

// a short fast move in one direction: a lunge, a tail flip or an escape jet
Creature.prototype.dart = function (dx, dy, speed) {
  this.velocity.x = dx * speed;
  this.velocity.y = dy * speed;
  this.burst = speed;
  this.panic = 1;
};

// the nearest neighbour of the two given plans within reach, or null
Creature.prototype.nearestOf = function (neighbours, planA, planB, reach) {
  let best = null;
  let bestD = reach * reach;
  for (let i = 0; i < neighbours.length; i++) {
    let other = neighbours[i];
    if (other.plan !== planA && other.plan !== planB) continue;
    let dx = other.position.x - this.position.x;
    let dy = other.position.y - this.position.y;
    let d2 = dx * dx + dy * dy;
    if (d2 < bestD) {
      bestD = d2;
      best = other;
    }
  }
  return best;
};

// angler: hangs almost still with its lure bobbing, lunges at a fish or shrimp in reach, then rests
Creature.prototype.ambush = function (neighbours) {
  this.velocity.mult(0.9); // *** drag: it stops almost at once
  this.angle += (noise(this.seed, frameCount * 0.002) - 0.5) * 0.01; // the slowest of turns
  this.ax += cos(this.angle) * 0.004; // *** the scull, just enough to drift
  this.ay += sin(frameCount * 0.03 + this.seed) * 0.003; // *** the bob of the lure

  if (this.rest > 0) this.rest--;
  else {
    let prey = this.nearestOf(neighbours, 1, 9, anglerReach);
    if (prey !== null) {
      let dx = prey.position.x - this.position.x;
      let dy = prey.position.y - this.position.y;
      let d = max(sqrt(dx * dx + dy * dy), 1);
      this.angle = atan2(dy, dx);
      this.dart(dx / d, dy / d, anglerLunge);
      this.rest = anglerRest;
    }
  }

  this.separate(neighbours, this.settings.sep);
  this.migrate(2);
};

// comb jelly: a smooth steady push from its comb rows, gliding slowly and turning gently on noise
Creature.prototype.glide = function (neighbours) {
  this.angle += (noise(this.seed, frameCount * 0.003) - 0.5) * 0.02; // *** how much it turns
  this.ax += cos(this.angle) * combThrust;
  this.ay += sin(this.angle) * combThrust;
  this.velocity.mult(0.98); // *** drag, so the thrust settles at a slow glide

  this.separate(neighbours, this.settings.sep);
  this.migrate(2);
};

// shrimp: swarms with its own species and swims in short paddling strokes. it flips in sense()
Creature.prototype.paddle = function (neighbours) {
  if (this.rest > 0) this.rest--;
  let calm = constrain(map(sound.energy, 0, scatterEnergy, 1, 0), 0, 1);
  this.separate(neighbours, this.settings.sep);
  this.align(neighbours, this.settings.ali * calm);
  this.cohesion(neighbours, this.settings.coh * calm);

  // it faces the way it swims, except during a flip when it goes tail first
  if (this.burst < 0.5) {
    let v = this.velocity;
    if (v.x * v.x + v.y * v.y > 0.01) this.turnToward(atan2(v.y, v.x), 0.2);
  }

  // strokes: sin squared gives a short push and a glide between
  this.phase += 0.25; // *** stroke rate
  let stroke = max(0, sin(this.phase));
  stroke = stroke * stroke;
  this.ax += cos(this.angle) * stroke * shrimpPaddle;
  this.ay += sin(this.angle) * stroke * shrimpPaddle;
  this.velocity.mult(0.97); // *** drag between strokes

  this.flow(0.5);
  this.migrate(2);
};

// octopus: hovers on slow arm pulses, or crawls along the bottom if it is a deep species
Creature.prototype.hover = function (neighbours) {
  if (this.crawl) {
    // crawling: a slow wander left and right, held firmly at its depth
    this.angle = noise(this.seed, frameCount * 0.002) > 0.5 ? 0 : PI;
    this.ax += cos(this.angle) * 0.01; // *** crawl push
    this.velocity.mult(0.95);
    this.migrate(4);
  } else {
    this.angle += (noise(this.seed, frameCount * 0.003) - 0.5) * 0.02;
    this.phase += octoBeat;
    let beat = max(0, sin(this.phase));
    beat = beat * beat;
    this.ax += cos(this.angle) * beat * octoPulse;
    this.ay += sin(this.angle) * beat * octoPulse - sin(this.phase) * 0.004; // the bob
    this.velocity.mult(0.97); // *** drag between pulses
    this.migrate(2);
  }
  if (this.rest > 0) this.rest--;
  this.separate(neighbours, this.settings.sep);
};

///////////////////////////////////////////////////////////////////
// Rules of Flocking
// Same rules as the Week 6 template, but looping over neighbours
// from the grid and written with plain numbers. Alignment and
// cohesion only count the same species, so each kind of fish keeps
// its own school. Separation counts everyone except plankton, which
// are too small to swim around.
///////////////////////////////////////////////////////////////////

// separation: steers away from anything inside its personal space
Creature.prototype.separate = function (neighbours, w) {
  if (w === 0) return;
  let sx = 0;
  let sy = 0;
  let count = 0;

  for (let i = 0; i < neighbours.length; i++) {
    let other = neighbours[i];
    if (other === this || other.plan === 0) continue;

    // personal space grows with both bodies, but stays inside the grid's reach
    let space = min(this.body.radius + other.body.radius + 10, 58);
    let dx = this.position.x - other.position.x;
    let dy = this.position.y - other.position.y;
    let d2 = dx * dx + dy * dy;

    if (d2 > 0 && d2 < space * space) {
      // away from the neighbour, weighted by distance (unit vector / d)
      sx += dx / d2;
      sy += dy / d2;
      count++;
    }
  }

  if (count > 0) {
    // Reynolds: steering = desired - velocity
    let m = sqrt(sx * sx + sy * sy);
    if (m > 0) {
      let fx = (sx / m) * this.maxSpeed - this.velocity.x;
      let fy = (sy / m) * this.maxSpeed - this.velocity.y;
      this.steer(fx, fy, this.maxForce * w);
    }
  }
};

// alignment: matches the average velocity of nearby creatures of the same species
Creature.prototype.align = function (neighbours, w) {
  if (w === 0) return;
  let sx = 0;
  let sy = 0;
  let count = 0;

  for (let i = 0; i < neighbours.length; i++) {
    let other = neighbours[i];
    if (other === this || other.species !== this.species) continue;
    let dx = other.position.x - this.position.x;
    let dy = other.position.y - this.position.y;
    if (dx * dx + dy * dy < neighbourDistSq) {
      sx += other.velocity.x;
      sy += other.velocity.y;
      count++;
    }
  }

  if (count > 0) {
    let m = sqrt(sx * sx + sy * sy);
    if (m > 0) {
      let fx = (sx / m) * this.maxSpeed - this.velocity.x;
      let fy = (sy / m) * this.maxSpeed - this.velocity.y;
      this.steer(fx, fy, this.maxForce * w);
    }
  }
};

// cohesion: seeks the average position of nearby creatures of the same species
Creature.prototype.cohesion = function (neighbours, w) {
  if (w === 0) return;
  let sx = 0;
  let sy = 0;
  let count = 0;

  for (let i = 0; i < neighbours.length; i++) {
    let other = neighbours[i];
    if (other === this || other.species !== this.species) continue;
    let dx = other.position.x - this.position.x;
    let dy = other.position.y - this.position.y;
    if (dx * dx + dy * dy < neighbourDistSq) {
      sx += other.position.x;
      sy += other.position.y;
      count++;
    }
  }

  if (count > 0) {
    // seek the centre: desired is toward it at full speed
    let dx = sx / count - this.position.x;
    let dy = sy / count - this.position.y;
    let m = sqrt(dx * dx + dy * dy);
    if (m > 0) {
      let fx = (dx / m) * this.maxSpeed - this.velocity.x;
      let fy = (dy / m) * this.maxSpeed - this.velocity.y;
      this.steer(fx, fy, this.maxForce * w);
    }
  }
};

///////////////////////////////////////////////////////////////////
// The line
// A still line is just another thing in the water. A moving one
// pushes water ahead of it, so creatures feel it coming and move
// away: schools and squid bolt, jellies and eels drift aside,
// plankton swirl in the wake. Touching a body while moving is a strike.
///////////////////////////////////////////////////////////////////

// feels the line: a moving line pushes it away, a touch while moving is a strike
Creature.prototype.sense = function () {
  let s = this.settings;
  let hit = fline.nearest(this.position.x, this.position.y, s.sense);
  if (hit.d > s.sense) return; // Infinity when the line is nowhere near

  // 0 for a lure hanging still, 1 for a fast one
  let moving = constrain((fline.speed - 0.4) / 4, 0, 1); // *** how fast counts as a disturbance
  if (moving > 0) {
    let dx = this.position.x - hit.x;
    let dy = this.position.y - hit.y;
    let d = max(hit.d, 1);
    let near = 1 - d / s.sense;

    if (s.flee > 0) {
      let push = moving * near * this.maxForce * s.flee;
      this.ax += (dx / d) * push;
      this.ay += (dy / d) * push;
      // eels drift aside without hurrying, everyone else may bolt
      if (this.plan !== 6) this.panic = max(this.panic, moving * near);
    }
    if (this.plan === 5) {
      // a startled squid lights its whole mantle, no note until it is touched
      this.flash = max(this.flash, moving * near * 0.6); // *** how brightly a squid startles
    }
    if (this.plan === 3) {
      // the wake knocks the frond sideways, away from the line
      // *** how hard the line rocks a sea pen
      this.swayVel += (dx > 0 ? 1 : -1) * moving * near * 0.004;
    }
    if (this.plan === 9 && near > 0.4 && this.rest <= 0) {
      // the tail flip: a real shrimp faces the threat, snaps its tail
      // and shoots backwards, so it turns to the line and darts tail first
      this.angle = atan2(-dy, -dx);
      this.dart(dx / d, dy / d, shrimpFlip * moving);
      this.rest = shrimpFlipRest;
    }
    if (this.plan === 10 && near > 0.5 && this.rest <= 0) {
      // an octopus jets away in one burst, then settles again
      this.dart(dx / d, dy / d, octoJet * moving);
      this.rest = octoJetRest;
    }
  }

  if (hit.d < this.body.radius + 4 && fline.speed > 0.5 && this.cooldown <= 0) {
    this.strike();
    if (this.plan === 7) {
      // the angler only minds the line once it is touched: a short startled dart away
      let ax = this.position.x - hit.x;
      let ay = this.position.y - hit.y;
      let ad = max(sqrt(ax * ax + ay * ay), 1);
      this.dart(ax / ad, ay / ad, anglerDart);
    }
  }
};

// the line struck this creature: the lure flares and the field guide learns the species
Creature.prototype.strike = function () {
  fline.strike();
  this.ignite(1, 0);
  if (typeof ui !== "undefined" && ui.unlock) ui.unlock(this.species);
};

// lights up and plays its note. a struck plankton also asks the shoal to spread the light
Creature.prototype.ignite = function (strength, gen) {
  this.flash = strength;
  this.gen = gen; // set before play() so the sound can climb with it
  this.cooldown = this.settings.cool;
  sound.play(this);
  if (this.plan === 0 && gen < chainFanout.length) shoal.spark(this, gen);
};

///////////////////////////////////////////////////////////////////
// Moving and drawing
///////////////////////////////////////////////////////////////////

// applies the forces, lets a frightened or darting creature outrun its speed, fades the flash
Creature.prototype.update = function () {
  let v = this.velocity;
  v.x += this.ax;
  v.y += this.ay;
  this.ax = 0;
  this.ay = 0;

  // a struck or frightened creature can go faster than it swims, and a
  // dart is allowed its full speed for a moment while burst decays
  // *** panic doubles the speed
  let limit = this.maxSpeed * (1 + this.flash * 0.9 + this.panic) + this.burst;
  this.burst *= 0.9; // *** how quickly a dart dies away
  let m2 = v.x * v.x + v.y * v.y;
  if (m2 > limit * limit) {
    let s = m2 > 0 ? limit / sqrt(m2) : 0;
    v.x *= s;
    v.y *= s;
  }

  this.position.x += v.x;
  this.position.y += v.y;

  // a leaving creature must keep up with its sinking target even if it
  // is slower than the tide, so it also closes the gap directly, the
  // way a sea pen follows its depth
  if (this.leaving) this.position.y += max(0, this.wantDepth() - this.position.y) * 0.01;
  this.flash *= 0.94; // *** how fast the light fades
  this.panic *= 0.96;
  if (this.cooldown > 0) this.cooldown--;
};

// wraps left and right, keeps the whole body under the surface, floors well below the screen
Creature.prototype.borders = function () {
  let r = this.body.radius * 2;
  if (this.position.x < -r) this.position.x = width + r;
  if (this.position.x > width + r) this.position.x = -r;
  // keep the whole body under the surface, not just its centre
  let top = this.reach + 8; // *** gap kept between the longest reach and the surface
  if (this.position.y < top) this.velocity.y += 0.1;
  if (this.position.y < this.reach) this.position.y = this.reach;
  if (this.position.y > height * 1.5) this.position.y = height * 1.5;
};

// asks the body to draw itself, facing the right way, brighter when the lure is close
Creature.prototype.render = function () {
  // a sea pen stands up and leans by its sway. sparkle, fish and squid face the way they
  // travel. everyone else faces their own angle, so an eel's ribbon keeps its course while
  // its path wiggles and a shrimp still faces forward while it flips backwards
  let heading;
  if (this.plan === 3) heading = -HALF_PI + this.sway;
  else if (this.plan === 0 || this.plan === 1 || this.plan === 5) heading = atan2(this.velocity.y, this.velocity.x);
  else heading = this.angle;

  // ambient light from the lure when it is close
  let dx = fline.lx - this.position.x;
  let dy = fline.ly - this.position.y;
  let d2 = dx * dx + dy * dy;
  let lit = d2 < litRange * litRange ? 1 - sqrt(d2) / litRange : 0;

  this.body.render(this.position.x, this.position.y, heading, this.flash, lit);
};

///////////////////////////////////////////////////////////////////
// Shoal Object
// All the creatures. Keeps the species of the current period alive
// (the Species section, periodOf), spawns the right number of each for the
// canvas size, swaps sets slowly when the period changes, runs
// everyone through the grid, and holds the queue of plankton waiting
// to light up in a chain reaction.
//   shoal.period             name of the period whose set is current
//   shoal.nextPeriod         a period waiting its turn, or null
//   shoal.creatures.length   how many are alive (two sets during a swap)
//   shoal.pending            how many of the new set are still to be born
///////////////////////////////////////////////////////////////////

// *** back to front: big slow plans draw behind small quick ones
//     seapen, angler, octopus, jelly, comb, squid, eel, dragon, fish, shrimp, sparkle
let drawOrder = [3, 7, 10, 2, 8, 5, 6, 4, 1, 9, 0];

// the shoal: every creature, the period that is alive, the births waiting and the chain queue
function Shoal() {
  this.creatures = [];
  this.period = null; // set by populate()
  this.nextPeriod = null; // a change waiting until the set now leaving has gone
  // species still to spawn for the current period, one entry per creature, in draw order
  this.births = [];
  this.pending = 0;
  this.queue = []; // plankton about to light: { c, gen, at }
  this.grid = null; // the grid from the last run(), for spark()
}

// how many of a species this canvas should have, fewer for bigger species
Shoal.prototype.targetCount = function (species) {
  let info = speciesList[species];
  let r = rarityCount[info.rarity];
  if (info.plan === 0 && info.rarity === "common") r = planktonCount;
  let n = round(((width * height) / 100000) * r.perArea / info.size);
  return constrain(n, r.min, r.max);
};

// fills the sea at the start with the current period's set, every creature already at its depth
Shoal.prototype.populate = function () {
  this.creatures = [];
  this.queue = [];
  this.births = [];
  this.pending = 0;
  this.period = periodOf(tide.hour);
  this.schedule(this.period);
  while (this.births.length > 0) {
    let c = this.spawn(this.births.pop());
    c.present = 1;
    c.position.y = c.wantDepth() + random(-60, 60);
  }
};

// lists what a period's set is missing, in draw order, one entry per creature to be born
Shoal.prototype.schedule = function (period) {
  this.births = [];
  let list = speciesOfPeriod(period);
  // pop() takes from the end, so push the last plan to draw first
  for (let k = drawOrder.length - 1; k >= 0; k--) {
    for (let j = 0; j < list.length; j++) {
      let s = list[j];
      if (speciesList[s].plan !== drawOrder[k]) continue;
      let missing = this.targetCount(s) - this.count(s);
      for (let i = 0; i < missing; i++) this.births.push(s);
    }
  }
  this.pending = this.births.length;
};

// births one creature below the screen, ready to rise
Shoal.prototype.spawn = function (species) {
  let c = new Creature(random(width), height * random(1.1, 1.45), species);
  this.creatures.push(c);
  return c;
};

// the clock crossed into a new period: the old set sinks away and the new one is queued to rise
Shoal.prototype.changePeriod = function (period) {
  // only two sets may be alive, the one leaving and the one arriving. if the clock crossed
  // two boundaries in under a swap, the third period waits here until the old set has gone
  if (this.periodsAlive(period) > 2) {
    this.nextPeriod = period;
    return;
  }
  this.nextPeriod = null;
  this.period = period;
  // everyone not in the new period starts sinking, anyone of it who was sinking turns back,
  // and whoever is already out of sight is dropped at once
  for (let i = this.creatures.length - 1; i >= 0; i--) {
    let c = this.creatures[i];
    c.leaving = speciesList[c.species].period !== period;
    if (c.leaving && c.position.y > height + 40) this.creatures.splice(i, 1);
  }
  this.schedule(period);
};

// how many different periods would be alive if this one joined
Shoal.prototype.periodsAlive = function (period) {
  let seen = [period];
  for (let i = 0; i < this.creatures.length; i++) {
    let p = speciesList[this.creatures[i].species].period;
    if (seen.indexOf(p) < 0) seen.push(p);
  }
  return seen.length;
};

// how many of a species are alive and staying
Shoal.prototype.count = function (species) {
  let n = 0;
  for (let i = 0; i < this.creatures.length; i++) {
    if (this.creatures[i].species === species && !this.creatures[i].leaving) n++;
  }
  return n;
};

// how many creatures of a body plan there are
Shoal.prototype.countPlan = function (plan) {
  let n = 0;
  for (let i = 0; i < this.creatures.length; i++) {
    if (this.creatures[i].plan === plan) n++;
  }
  return n;
};

// every frame: swap periods if the clock moved, birth a few, rebuild the grid, run everyone
Shoal.prototype.run = function (grid) {
  // the period of the day decides who is alive. A change that had to
  // wait is tried again every frame until the old set has gone
  let period = periodOf(tide.hour);
  if (period !== this.period) this.changePeriod(period);
  else this.nextPeriod = null;

  // a few births a frame, so the swap never costs one long frame
  for (let i = 0; i < spawnPerFrame && this.births.length > 0; i++) {
    this.spawn(this.births.pop());
  }
  this.pending = this.births.length;

  // rebuild the grid first so every creature sees the same snapshot
  this.grid = grid;
  grid.clear();
  for (let i = 0; i < this.creatures.length; i++) {
    grid.insert(this.creatures[i]);
  }

  this.chain();

  // in list order, which is draw order. A creature that has sunk out
  // of sight is removed on the way (and the index stepped back)
  for (let i = 0; i < this.creatures.length; i++) {
    let c = this.creatures[i];
    if (c.leaving && c.present <= 0 && c.position.y > height + 40) {
      this.creatures.splice(i, 1);
      i--;
      continue;
    }
    // plankton and sea pens ignore their neighbours, so skip the lookup for them
    let neighbours = c.plan === 0 || c.plan === 3 ? null : grid.query(c.position);
    c.run(neighbours);
  }
};

///////////////////////////////////////////////////////////////////
// Chain reaction
// Sea sparkle (Noctiluca) glows when disturbed, and one flash can
// set off the next. When one is struck it lights up to 3 unlit
// neighbours after a short delay, each of those lights 2, each of
// those 1, every flash a little weaker. The waiting lights sit in
// a queue stamped with the frame they should go off. Any plankton
// species can pass the light to any other.
///////////////////////////////////////////////////////////////////

// queues the nearest unlit plankton around "from" to light up a few frames later
Shoal.prototype.spark = function (from, gen) {
  if (this.grid === null || this.queue.length >= chainMax) return;
  let near = this.grid.query(from.position);
  let want = chainFanout[gen];

  for (let k = 0; k < want; k++) {
    // take the closest one not yet taken
    let best = null;
    let bestD = chainDistSq;
    for (let i = 0; i < near.length; i++) {
      let other = near[i];
      if (other === from || other.plan !== 0 || other.cooldown > 0) continue;
      let dx = other.position.x - from.position.x;
      let dy = other.position.y - from.position.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < bestD) {
        bestD = d2;
        best = other;
      }
    }
    if (best === null) break;
    best.cooldown = 60; // taken, so nothing else lights it before its turn
    this.queue.push({ c: best, gen: gen + 1, at: frameCount + chainDelay });
  }
};

// lights whatever in the queue is due. walks backwards so splice is safe
Shoal.prototype.chain = function () {
  for (let i = this.queue.length - 1; i >= 0; i--) {
    let q = this.queue[i];
    if (frameCount < q.at) continue;
    this.queue.splice(i, 1);
    q.c.ignite(chainFlash[q.gen], q.gen);
  }
};

///////////////////////////////////////////////////////////////////
// 7. SEA
// The sky, the surface, the dive between them, and the water.
///////////////////////////////////////////////////////////////////

// the sky, the sun or the moon, the line hanging ready. When the user
// begins, the camera sinks through the surface into the dark and
// stays there. The sky follows the real clock (the Tide section) too.
//
// Techniques from class:
//   waves (wk 4)        the surface is a sum of sines
//   noise (wk 5)        marine snow drifts on a noise field
//   living forest (wk 9) one celestial body on a sine arc, sun by day,
//                       moon by night, crescent carved with a sky disc

///////////////////////////////////////////////////////////////////
// Sea Object
// World coordinates: y = 0 is the water surface, the underwater
// scene is 0 to height, the sky is above 0. the Main section draws the
// world inside push() after sea.applyCamera().
//
// The camera is a focus point and a zoom. The focus F is the
// waterline under the boat, (fline.anchorX, 0) in the world. S is
// where F lands on the screen:
//   screen = S + zoom * (world - F)
// At rest above water zoom is 1.6 and S is (width / 2, 0.8 * height),
// so the boat sits centred with the waterline four fifths of the way
// down and the view is pulled in close. Under water zoom is 1 and S
// is (anchorX, 0), which makes the transform the identity. The dive
// eases between the two, so the view widens to the whole sea as the
// camera arrives. cameraY is the world y at the top of the screen
// (-S.y / zoom), kept for the debug readout.
//
// Interface used by the Main section and the Fishing line section:
//   sea.state          "surface", "diving", "under" or "rising"
//   sea.cameraY        world y at the top edge of the screen, 0 when under
//   sea.zoom           1.6 on the surface, 1 under
//   sea.begin()        start the dive (the start button calls this)
//   sea.surface()      come back up to the boat
//   sea.update()       once a frame
//   sea.applyCamera()  the world transform, call inside push()
//   sea.toWorld(sx, sy) screen to world, the inverse of applyCamera
//   sea.renderSky()    sky gradient, stars, sun or moon (world coords, above 0)
//   sea.renderWater()  water gradient, surface, boat, light shafts
//   sea.renderFog()    marine snow, bubbles and depth haze, over the creatures
//   sea.resize()       rebuild the cached gradients
///////////////////////////////////////////////////////////////////

// the sea: the camera, the three cached gradients, the stars, the snow and the bubbles
function Sea() {
  this.state = "surface";
  this.restY = 0.8; // *** where the waterline sits on the start screen, as a fraction of the height
  this.zoomSurface = 1.6; // *** how close the start screen is. 1 = no zoom
  this.diveTime = 3500; // *** ms for the camera to sink through the surface (and to rise)
  this.moveStart = 0; // ms when the current dive or rise began
  this.u = 0; // camera blend, 0 at rest on the surface, 1 settled under water

  // camera state, set by placeCamera() every frame
  this.zoom = this.zoomSurface;
  this.fx = width / 2; // focus in the world: the waterline under the boat
  this.fy = 0;
  this.sx = width / 2; // where the focus lands on the screen
  this.sy = height * this.restY;
  this.cameraY = 0;
  this.view = { x0: 0, y0: 0, x1: width, y1: height }; // the world rectangle on screen
  // world height of sky visible at rest
  this.skyH = max(1, (height * this.restY) / this.zoomSurface);

  this.waveAmp = 8; // *** a little more than the tallest wave, see surfaceY()
  // one cached row per 3 px, the image stretch smooths it. never 0 rows:
  // some embeds give the canvas no size until the first resize, and a
  // 0 px graphics makes image() throw
  this.rows = max(1, ceil(height / 3));
  this.cacheMig = -1; // the migration value the caches were painted with
  this.skyG = null;
  this.waterG = null;
  this.hazeG = null;

  this.stars = [];
  this.snow = [];
  this.bubbles = [];
  this.makeStars();
  this.makeSnow();
  this.paintCaches();
  this.placeCamera();
}

// starts the dive: the camera begins sinking through the surface and bubbles are let go
Sea.prototype.begin = function () {
  if (this.state !== "surface") return;
  this.state = "diving";
  this.moveStart = millis();
  this.makeBubbles();
};

// the dive in reverse: back up to the boat, ready to begin() again
Sea.prototype.surface = function () {
  if (this.state !== "under") return;
  this.state = "rising";
  this.moveStart = millis();
  this.makeBubbles();
};

// eases the dive or rise, places the camera, repaints the gradients now and then, moves the snow
Sea.prototype.update = function () {
  if (this.state === "diving" || this.state === "rising") {
    let raw = constrain((millis() - this.moveStart) / this.diveTime, 0, 1);
    let e = raw * raw * (3 - 2 * raw); // ease in and out
    this.u = this.state === "diving" ? e : 1 - e;
    if (raw >= 1) this.state = this.state === "diving" ? "under" : "surface";
  }
  this.placeCamera();

  // the gradients follow the clock, but slowly, so repaint them rarely.
  // the extra test also catches a sudden change in the migration
  if (frameCount % 20 === 0 || abs(tide.migration - this.cacheMig) > 0.02) {
    this.paintCaches();
  }

  this.moveSnow();
  this.moveBubbles();
};

///////////////////////////////////////////////////////////////////
// Camera
// screen = S + zoom * (world - F). F is the waterline under the boat,
// S slides from the start screen's spot to F itself as u goes 0 to 1,
// and the zoom eases from zoomSurface to 1, so under water the
// transform is the identity and world coordinates are screen ones.
///////////////////////////////////////////////////////////////////

// sets the zoom and focus for this frame and works out the world rectangle on screen
Sea.prototype.placeCamera = function () {
  let u = this.u;
  // the sea is built before the line only if someone reorders setup(), so be safe
  let ax = typeof fline !== "undefined" ? fline.anchorX : width / 2;
  this.zoom = lerp(this.zoomSurface, 1, u);
  this.fx = ax;
  this.fy = 0;
  this.sx = lerp(width / 2, ax, u);
  this.sy = lerp(height * this.restY, 0, u);

  // the world rectangle that fills the screen, for culling and backgrounds
  let v = this.view;
  v.x0 = this.fx - this.sx / this.zoom;
  v.y0 = this.fy - this.sy / this.zoom;
  v.x1 = this.fx + (width - this.sx) / this.zoom;
  v.y1 = this.fy + (height - this.sy) / this.zoom;
  this.cameraY = v.y0;
};

// the world transform. draw() calls this inside push()
Sea.prototype.applyCamera = function () {
  translate(this.sx, this.sy);
  scale(this.zoom);
  translate(-this.fx, -this.fy);
};

// screen to world, the exact reverse of applyCamera, so the lure stays under the pointer
Sea.prototype.toWorld = function (sx, sy) {
  return {
    x: this.fx + (sx - this.sx) / this.zoom,
    y: this.fy + (sy - this.sy) / this.zoom
  };
};

///////////////////////////////////////////////////////////////////
// Clock
// Everything that reads the time of day. night is tide.migration
// (eased, and 1 when night is forced), so colours never jump. The
// sun's height comes straight from tide.hour.
///////////////////////////////////////////////////////////////////

// blends two [r, g, b] arrays, t = 0 is the first. cheaper than p5 colours here
Sea.prototype.mix = function (a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
};

// how near the sun is to the horizon: 1 at sunrise and sunset, 0 at noon and midnight
Sea.prototype.dusk = function () {
  let e = -cos((tide.hour / 24) * TWO_PI); // sun height, 1 noon, -1 midnight
  let d = max(0, 1 - abs(e) / 0.3); // *** 0.3 = how long dusk lasts, as a fraction of the arc
  return d * d * (3 - 2 * d);
};

// sky colour at t, 0 at the top of the visible sky, 1 at the water, with a warm band at dusk
Sea.prototype.skyColor = function (t) {
  let night = tide.migration;
  let top = this.mix([64, 126, 198], [3, 6, 18], night); // *** day and night sky, top
  let low = this.mix([168, 204, 228], [18, 30, 58], night); // *** day and night sky, horizon
  let c = this.mix(top, low, t * t);
  // the warm glow of dusk sits low and only when the sun is near the horizon
  let w = this.dusk() * t * t * 0.85;
  return this.mix(c, [236, 140, 84], w);
};

// water colour at t, 0 at the surface, 1 at the bottom. light falls off exponentially
Sea.prototype.waterColor = function (t) {
  let night = tide.migration;
  let top = this.mix([16, 86, 134], [5, 18, 40], night); // *** day and night water, surface
  let low = this.mix([2, 10, 24], [1, 2, 6], night); // *** day and night water, bottom
  let k = (1 - exp(-2.4 * t)) / (1 - exp(-2.4));
  return this.mix(top, low, k);
};

// a tiny seeded random for the stars, so they never flicker and p5's random() is untouched
Sea.prototype.hash = function (n) {
  // the sin-fract hash from shader folklore (The Book of Shaders, Patricio Gonzalez Vivo)
  let v = sin(n * 12.9898 + 78.233) * 43758.5453;
  return v - floor(v);
};

// phase of the real moon tonight, 0 new, 0.5 full, from the date
Sea.prototype.moonPhase = function () {
  // reference new moon 6 Jan 2000 18:14 UTC, synodic month 29.530588 days
  // (Meeus, Astronomical Algorithms)
  let days = Date.now() / 86400000 - 10962.76;
  let p = (days / 29.530588) % 1;
  return p < 0 ? p + 1 : p;
};

///////////////////////////////////////////////////////////////////
// Sky
// A cached gradient, seeded stars that fade in with the migration,
// and one celestial body: the sun by day that becomes the moon by
// night, arcing on a sine path from the hour.
///////////////////////////////////////////////////////////////////

// scatters the stars over the sky, crowded a little toward the top
Sea.prototype.makeStars = function () {
  this.stars = [];
  let n = 420; // *** how many stars over the whole sky. about a third are on screen at a time
  for (let i = 0; i < n; i++) {
    this.stars.push({
      fx: this.hash(i * 3 + 1),
      fy: pow(this.hash(i * 3 + 2), 0.7), // crowd the top of the sky a little
      size: 0.8 + this.hash(i * 3 + 3) * 1.4,
      ph: this.hash(i * 7 + 5) * TWO_PI
    });
  }
};

// the sky gradient, the stars and the sun or moon, only while any sky is on screen
Sea.prototype.renderSky = function () {
  let v = this.view;
  if (v.y0 >= 0) return; // no sky on screen once we are under

  push();
  noStroke();
  // the gradient covers the sky visible at rest, and the top colour
  // fills anything above it (only seen if the zoom is tweaked down)
  let top = this.skyColor(0);
  fill(top[0], top[1], top[2]);
  rect(v.x0, v.y0 - 10, v.x1 - v.x0, -this.skyH - v.y0 + 10);
  image(this.skyG, v.x0, -this.skyH, v.x1 - v.x0, this.skyH);
  this.renderStars();
  this.renderBody();
  pop();
};

// the stars fade in with the night and breathe very slowly, dimmer near the horizon
Sea.prototype.renderStars = function () {
  let night = tide.migration;
  if (night < 0.04) return;
  let a = 230 * night * night; // stars arrive late in the dusk
  let t = frameCount * 0.02;
  let v = this.view;
  // the sky is wide enough for the boat to drift to either edge
  let span = 1 + 1 / this.zoomSurface;
  strokeCap(ROUND);
  for (let i = 0; i < this.stars.length; i++) {
    let s = this.stars[i];
    let x = (s.fx * span - (span - 1) / 2) * width;
    let y = -this.skyH * s.fy;
    if (x < v.x0 || x > v.x1 || y < v.y0) continue; // off screen
    let tw = 0.8 + 0.2 * sin(t + s.ph); // very slow breathing, not a flicker
    stroke(220, 228, 255, a * tw * pow(s.fy, 0.5)); // dimmer near the horizon
    strokeWeight(s.size);
    point(x, y);
  }
};

// where the sun or moon is now: a sine arc across the view, set by the hour
Sea.prototype.bodyPos = function () {
  // p is 0 as it rises and 1 as it sets. the day arc runs 6 to 18, the night arc 18 to 6,
  // and the jump between them happens below the horizon. the arc spans the current view,
  // because something that far away does not shift when the boat drifts
  let p = (((tide.hour - 6) % 12) + 12) % 12 / 12;
  let v = this.view;
  let x = lerp(v.x0 + (v.x1 - v.x0) * 0.1, v.x1 - (v.x1 - v.x0) * 0.1, p);
  let y = 14 - this.skyH * 0.8 * sin(p * PI); // *** 0.8 = how high the arc climbs
  return { x: x, y: y, p: p };
};

// the sun by day, the moon by night with its real crescent, and a soft halo round either
Sea.prototype.renderBody = function () {
  let night = tide.migration;
  let b = this.bodyPos();
  let r = lerp(26, 17, night); // *** sun and moon radius
  let col = this.mix([255, 236, 186], [226, 232, 246], night);
  // how much of the moon is lit, 0 new to 1 full. kept a little rounder
  // than the real moon so there is always a crescent to see
  let lit = max(0.3, 0.5 - 0.5 * cos(this.moonPhase() * TWO_PI));
  let glow = lerp(1, 0.5 * lit, night); // a thin moon barely glows

  noStroke();
  fill(col[0], col[1], col[2]);
  circle(b.x, b.y, r * 2);

  // the crescent: overdraw a sky-coloured disc, offset by the phase.
  // only the moon has one, so it fades in with the night
  if (night > 0.02) {
    let d = 2 * r * lit; // thickness of the lit part
    let side = this.moonPhase() < 0.5 ? -1 : 1; // waxing moons are lit on the right
    let sky = this.skyColor(constrain(1 + b.y / this.skyH, 0, 1)); // the sky behind the moon
    // squared, so the dawn sun loses its bite early
    fill(sky[0], sky[1], sky[2], 255 * night * night);
    circle(b.x + side * d, b.y, r * 2 + 0.5);
  }

  // halo: a stack of faint additive discs, biggest first, so the
  // light piles up toward the body without hard rings. Drawn last so
  // the carved part of the moon glows like the sky around it
  blendMode(ADD);
  let steps = 12; // *** more steps, smoother halo
  for (let k = 0; k < steps; k++) {
    let f = 1 - k / steps;
    fill(col[0], col[1], col[2], (5 + 7 * (k / steps) * (k / steps)) * glow);
    circle(b.x, b.y, r * 2 * (1 + 2.6 * f * f));
  }
  blendMode(BLEND);
};

///////////////////////////////////////////////////////////////////
// Surface
// The waterline is a sum of sines. It is drawn in renderWater so
// the boat can sit in it and the water gradient can fill below it.
///////////////////////////////////////////////////////////////////

// height of the surface at x: three sines of different lengths and speeds added together
Sea.prototype.surfaceY = function (x) {
  let t = millis() * 0.001;
  // *** wave sizes
  return sin(x * 0.012 + t * 0.9) * 3.2 + sin(x * 0.031 - t * 1.4) * 1.6 + sin(x * 0.0051 + t * 0.5) * 2.4;
};

// the waterline: sky in the troughs, water in the crests, a bright line, then the reflection
Sea.prototype.renderSurface = function () {
  let amp = this.waveAmp;
  let step = 6; // *** px between wave points
  let v = this.view;
  let x0 = v.x0 - step;
  let x1 = v.x1 + step;
  let pts = [];
  for (let x = x0; x <= x1; x += step) {
    pts.push({ x: x, y: this.surfaceY(x) });
  }

  noStroke();
  // sky in the troughs, water in the crests. both polygons share the wave
  let sky = this.skyColor(1);
  fill(sky[0], sky[1], sky[2]);
  beginShape();
  vertex(x0, -amp - 2);
  for (let i = 0; i < pts.length; i++) vertex(pts[i].x, pts[i].y);
  vertex(x1, -amp - 2);
  endShape(CLOSE);

  let wat = this.waterColor(0);
  fill(wat[0], wat[1], wat[2]);
  beginShape();
  for (let i = 0; i < pts.length; i++) vertex(pts[i].x, pts[i].y);
  vertex(x1, amp + 2);
  vertex(x0, amp + 2);
  endShape(CLOSE);

  // the waterline itself, brighter while the camera passes through it
  noFill();
  stroke(170, 210, 235, 70 + 120 * sin(this.u * PI));
  strokeWeight(1.2);
  beginShape();
  for (let i = 0; i < pts.length; i++) vertex(pts[i].x, pts[i].y);
  endShape();

  this.renderReflection();
};

// a trail of light under the sun or moon: a bright stretch of waterline and fading dashes
Sea.prototype.renderReflection = function () {
  let b = this.bodyPos();
  if (b.y > -10) return; // body below the horizon
  let night = tide.migration;
  let col = this.mix([255, 236, 186], [226, 232, 246], night);
  let bright = lerp(0.6, 1, night) * constrain(-b.y / 80, 0, 1); // dim when it sits on the horizon
  let t = millis() * 0.001;

  blendMode(ADD);
  noStroke();
  for (let k = 0; k < 8; k++) {
    let y = this.surfaceY(b.x) + 5 + k * 6;
    let w = 18 + k * 7 + sin(t * 1.7 + k * 1.3) * 9;
    let x = b.x + sin(t * 1.1 + k * 2.1) * (3 + k);
    fill(col[0], col[1], col[2], 50 * bright * (1 - k / 8));
    rect(x - w / 2, y, w, 1.5);
  }
  // the crest glint
  stroke(col[0], col[1], col[2], 120 * bright);
  strokeWeight(1.5);
  noFill();
  beginShape();
  for (let x = b.x - 40; x <= b.x + 40; x += 5) {
    vertex(x, this.surfaceY(x));
  }
  endShape();
  blendMode(BLEND);
};

// a small dark boat bobbing at the top of the line, with a rod and a lantern on the mast
Sea.prototype.renderBoat = function () {
  let ax = fline.anchorX;
  let bx = ax - 24;
  let sy = this.surfaceY(bx);
  let night = tide.migration;

  push();
  translate(bx, sy);
  noStroke();
  fill(5, 7, 13);
  // hull with a raked bow and stern
  beginShape();
  vertex(-36, -6);
  vertex(36, -6);
  vertex(27, 5);
  vertex(-27, 5);
  endShape(CLOSE);
  // a low cabin and a short mast
  rect(-16, -17, 20, 11, 2);
  rect(-2, -30, 1.5, 13);
  pop();

  // the rod, from the cabin to where the line leaves the boat
  stroke(5, 7, 13);
  strokeWeight(1.5);
  line(bx + 8, sy - 12, ax, fline.anchorY);

  // a lantern on the mast, warmer and brighter the darker it gets
  let l = 0.25 + 0.75 * night;
  blendMode(ADD);
  noStroke();
  fill(255, 190, 110, 40 * l);
  circle(bx - 1, sy - 30, 22);
  fill(255, 210, 150, 220 * l);
  circle(bx - 1, sy - 30, 3);
  blendMode(BLEND);
};

///////////////////////////////////////////////////////////////////
// Water
// A cached depth gradient that follows the clock, the surface and
// boat, sunlight shafts by day, and the bright band of the dive.
///////////////////////////////////////////////////////////////////

// the water gradient, the surface, the light shafts, the dive band and the boat
Sea.prototype.renderWater = function () {
  let v = this.view;
  push();
  noStroke();
  image(this.waterG, v.x0, 0, v.x1 - v.x0, height);
  this.renderSurface();
  this.renderShafts();
  if (this.state === "diving" || this.state === "rising") this.renderDiveBand();
  this.renderBoat();
  pop();
};

// slanted columns of sunlight that sway slowly and fade with depth. gone at night
Sea.prototype.renderShafts = function () {
  let day = 1 - tide.migration;
  if (day < 0.03) return;
  let t = millis() * 0.0002;
  let n = 10; // *** how many shafts, spread a little past both edges
  let depth = height * 0.8; // *** how deep the light reaches
  let segs = 4;

  blendMode(ADD);
  noStroke();
  for (let i = 0; i < n; i++) {
    let x0 = width * (-0.25 + (1.5 * (i + 0.5)) / n) + sin(t * 1.3 + i * 1.7) * width * 0.03;
    let lean = 90 + sin(t + i) * 50; // px the shaft drifts sideways over its depth
    let w0 = 22 + this.hash(i + 3) * 30;
    let flicker = 0.75 + 0.25 * sin(t * 6 + i * 2.3);
    for (let k = 0; k < segs; k++) {
      let a0 = k / segs;
      let a1 = (k + 1) / segs;
      let hw0 = (w0 * (1 + a0 * 1.6)) / 2;
      let hw1 = (w0 * (1 + a1 * 1.6)) / 2;
      fill(90, 150, 190, 20 * day * flicker * (1 - a0)); // *** 20 = shaft brightness
      quad(x0 + lean * a0 - hw0, depth * a0, x0 + lean * a0 + hw0, depth * a0, x0 + lean * a1 + hw1, depth * a1, x0 + lean * a1 - hw1, depth * a1);
    }
  }
  blendMode(BLEND);
};

// the bright underside of the surface as the camera passes through it, both ways
Sea.prototype.renderDiveBand = function () {
  let a = 70 * sin(this.u * PI);
  let bands = 10;
  let v = this.view;
  blendMode(ADD);
  noStroke();
  for (let k = 0; k < bands; k++) {
    fill(120, 190, 230, a * (1 - k / bands));
    rect(v.x0, k * 8, v.x1 - v.x0, 8);
  }
  blendMode(BLEND);
};

///////////////////////////////////////////////////////////////////
// Fog
// Drawn over the creatures: marine snow drifting on noise, the
// bubbles of the dive, and a haze that thickens toward the bottom
// so deep things look far away.
///////////////////////////////////////////////////////////////////

// scatters the flakes of marine snow over the water
Sea.prototype.makeSnow = function () {
  this.snow = [];
  let n = 90; // *** flakes of marine snow
  for (let i = 0; i < n; i++) {
    this.snow.push({
      x: random(width),
      y: random(height),
      size: random(0.8, 2.3),
      fall: random(0.12, 0.45), // *** how fast the snow sinks
      seed: random(1000)
    });
  }
};

// the snow sinks slowly and drifts sideways on noise, wrapping round the edges
Sea.prototype.moveSnow = function () {
  let t = frameCount * 0.004;
  for (let i = 0; i < this.snow.length; i++) {
    let s = this.snow[i];
    s.x += (noise(s.seed, t) - 0.5) * 0.8; // sideways drift on a noise field
    s.y += s.fall * (0.6 + 0.8 * noise(s.seed + 50, t));
    if (s.y > height + 4) s.y = -4;
    if (s.x < -4) s.x = width + 4;
    if (s.x > width + 4) s.x = -4;
  }
};

// draws the snow as soft points, a little dimmer at night
Sea.prototype.renderSnow = function () {
  let dim = 0.7 + 0.3 * (1 - tide.migration); // a little dimmer at night
  strokeCap(ROUND);
  for (let i = 0; i < this.snow.length; i++) {
    let s = this.snow[i];
    stroke(196, 214, 232, (40 + s.size * 40) * dim);
    strokeWeight(s.size);
    point(s.x, s.y);
  }
};

// lets a cloud of bubbles go around the boat when the dive begins
Sea.prototype.makeBubbles = function () {
  this.bubbles = [];
  let n = 36; // *** bubbles in the dive
  for (let i = 0; i < n; i++) {
    this.bubbles.push({
      x: fline.anchorX + random(-width * 0.3, width * 0.3),
      y: random(20, height * 0.7),
      r: random(1.5, 4.5),
      rise: random(0.5, 1.4),
      ph: random(TWO_PI)
    });
  }
};

// the bubbles rise and wobble, and pop when they reach the waterline
Sea.prototype.moveBubbles = function () {
  for (let i = this.bubbles.length - 1; i >= 0; i--) {
    let b = this.bubbles[i];
    b.y -= b.rise;
    b.x += sin(frameCount * 0.05 + b.ph) * 0.3;
    if (b.y < this.surfaceY(b.x) + b.r) this.bubbles.splice(i, 1);
  }
};

// draws each bubble as a ring with a highlight
Sea.prototype.renderBubbles = function () {
  noFill();
  strokeWeight(1);
  for (let i = 0; i < this.bubbles.length; i++) {
    let b = this.bubbles[i];
    stroke(200, 230, 255, 130);
    circle(b.x, b.y, b.r * 2);
    stroke(255, 255, 255, 180);
    point(b.x - b.r * 0.4, b.y - b.r * 0.4);
  }
};

// the snow, the bubbles and the depth haze, drawn over the creatures
Sea.prototype.renderFog = function () {
  push();
  this.renderSnow();
  if (this.bubbles.length > 0) this.renderBubbles();
  noStroke();
  image(this.hazeG, this.view.x0, 0, this.view.x1 - this.view.x0, height);
  pop();
};

///////////////////////////////////////////////////////////////////
// Caches and resize
// The three gradients (sky, water, haze) are painted into narrow
// createGraphics() strips, one row per 3 px, and stretched over the
// canvas with image(). Repainted every 20 frames and on resize.
///////////////////////////////////////////////////////////////////

// paints the sky, water and haze gradients into narrow strips, one row per 3 pixels
Sea.prototype.paintCaches = function () {
  if (this.skyG === null) {
    this.skyG = createGraphics(2, this.rows);
    this.waterG = createGraphics(2, this.rows);
    this.hazeG = createGraphics(2, this.rows);
  }
  this.cacheMig = tide.migration;
  let night = tide.migration;
  let hazeCol = this.mix([4, 16, 34], [1, 3, 9], night);

  this.skyG.noStroke();
  this.waterG.noStroke();
  this.hazeG.noStroke();
  this.hazeG.clear();
  for (let r = 0; r < this.rows; r++) {
    // one row only when the canvas has no height yet
    let t = this.rows > 1 ? r / (this.rows - 1) : 0;
    let s = this.skyColor(t);
    this.skyG.fill(s[0], s[1], s[2]);
    this.skyG.rect(0, r, 2, 1);

    let w = this.waterColor(t);
    this.waterG.fill(w[0], w[1], w[2]);
    this.waterG.rect(0, r, 2, 1);

    // haze: nothing in the top third, then thickening to the bottom
    let h = constrain((t - 0.35) / 0.65, 0, 1);
    // *** 200 = how thick the deep haze gets
    this.hazeG.fill(hazeCol[0], hazeCol[1], hazeCol[2], 200 * pow(h, 1.6));
    this.hazeG.rect(0, r, 2, 1);
  }
};

// after a window resize: a new camera, new gradient strips and new snow
Sea.prototype.resize = function () {
  this.skyH = max(1, (height * this.restY) / this.zoomSurface);
  this.placeCamera();
  this.rows = max(1, ceil(height / 3));
  // throw the old strips away so paintCaches makes new ones at the new height
  this.skyG.remove();
  this.waterG.remove();
  this.hazeG.remove();
  this.skyG = null;
  this.paintCaches();
  this.makeSnow();
};

///////////////////////////////////////////////////////////////////
// 8. SOUND
// One voice per body plan, a note per species, the sound of the hour.
///////////////////////////////////////////////////////////////////

// Uses Tone.js (https://tonejs.github.io, MIT licence) for the synths
// and effects. p5.sound is not loaded so the two don't share one
// audio context. The engine is adapted from the the Sound section of our
// earlier haze project (same group, DM3008 2026): the same
// filter -> delay -> reverb -> limiter chain, scale helpers and the
// energy feedback value, with new voices for the eleven body plans.

///////////////////////////////////////////////////////////////////
// Scale
// A minor pentatonic. Five notes with no semitone clashes, so a
// crowd of creatures striking at once still sounds like one chord.
// A step index counts up the scale: 0 is the root, 5 is the root an
// octave up, negative steps go down.
///////////////////////////////////////////////////////////////////

let scaleSteps = [0, 3, 5, 7, 10]; // *** A minor pentatonic in semitones
let rootNote = 45; // *** scale step 0 as a midi number (45 = A2)

// scale step to midi note. floor() keeps negative steps right
function stepToMidi(step) {
  let n = scaleSteps.length;
  let octave = floor(step / n);
  let within = step - octave * n;
  return rootNote + octave * 12 + scaleSteps[within];
}

// midi note to hertz, the same formula p5.sound uses
function midiToFreq(midi) {
  return 440 * pow(2, (midi - 69) / 12);
}

// the scale step a third above "step", for the jelly's two-note chord
function thirdAbove(step) {
  let root = stepToMidi(step);
  for (let k = 1; k <= 2; k++) {
    let gap = stepToMidi(step + k) - root;
    if (gap === 3 || gap === 4) return step + k;
  }
  return step + 1;
}

///////////////////////////////////////////////////////////////////
// Species pitch
// Every species gets its own note colour without a table, because
// there are a hundred of them: bigger species sit lower (about two
// scale steps down per 0.5 of size above 1, and up below it), then a
// hash of the species index nudges it a step either way so siblings
// of the same size still differ. The hash is seeded, so a species
// always lands on the same note. The giants of a plan (size 1.5 and
// up) always take the low nudge, so "the lowest note of all" in the
// field guide stays true against the dragon's A1.
///////////////////////////////////////////////////////////////////

let stepsPerSize = -4; // *** scale steps per 1.0 of size (negative: bigger is lower)
let pitchSeed = 311.7; // *** change to reshuffle which species sit high or low
// how far above or below its home note a plan is still comfortable, in steps
// (same order as bodyPlans: sparkle, fish, jelly, seapen, dragon, squid, eel,
// angler, comb, shrimp, octopus)
let planRange = [
  [-3, 3], [-3, 3], [-3, 3], [-3, 3], [-2, 3], [-3, 3], [-3, 2],
  [-2, 3], [-3, 3], [-3, 2], [-3, 3]
];

// a number in 0..1 that is always the same for the same species index
function speciesHash(i) {
  // the usual sin-and-fract one-liner from GLSL shaders (origin unknown, widely used).
  // fine here because we only need it stable, not random
  let h = sin(i * 127.1 + pitchSeed) * 43758.5453;
  return h - floor(h);
}

// -1, 0 or 1 from the hash, so the nudge is always a whole scale step
function speciesNudge(i) {
  return floor(speciesHash(i) * 3) - 1;
}

///////////////////////////////////////////////////////////////////
// VoicePool Object
// A fixed set of mono synths played in turn. Tone's PolySynth builds
// voices on demand and throws idle ones away again, so a sweep
// through a fresh shoal pays a few milliseconds per voice right
// when the frame is busiest. Building the voices once, during the
// dive, keeps play() cheap and makes a dropped-note warning
// impossible: a pool that is full simply retriggers its oldest voice.
//   make(i)   returns a new Tone synth (Synth, FMSynth, AMSynth, MonoSynth)
///////////////////////////////////////////////////////////////////

// a fixed set of single-note synths, all built now and played in turn
function VoicePool(count, make, volume, output) {
  this.voices = [];
  this.started = []; // when each voice last started, Tone insists the next start is later
  this.next = 0;
  for (let i = 0; i < count; i++) {
    let v = make(i);
    v.volume.value = volume;
    v.connect(output);
    this.voices.push(v);
    this.started.push(-1);
  }
}

// plays one note on the next voice and returns it, so the eel can bend its pitch after
VoicePool.prototype.trigger = function (freq, duration, time, velocity) {
  let i = this.next;
  this.next = (this.next + 1) % this.voices.length;
  if (time <= this.started[i]) time = this.started[i] + 0.001;
  this.started[i] = time;
  this.voices[i].triggerAttackRelease(freq, duration, time, velocity);
  return this.voices[i];
};

///////////////////////////////////////////////////////////////////
// SoundEngine Object
// Interface used by the rest of the sketch:
//   sound.init()            after the first click (browsers block audio before)
//   sound.ready             true once init() has run
//   sound.update()          once a frame, cools the energy down
//   sound.play(creature)    the line struck this creature, true if a note sounded
//   sound.setDepth(m)       m = tide.migration, deeper water is more muffled
//   sound.toggleMute()      mute / unmute once started (the Main section toggleSound)
//   sound.muted
//   sound.energy            how busy the music has been lately. the Creatures section
//                           can read it for a feedback loop (busy = scatter)
//
// play() reads creature.plan (or .family), .species, .position, .body.radius and .gen.
// All of them may be missing: it falls back and never throws.
//
// Signal path: one VoicePool per body plan (two for the squid and
// the shrimp), each through its own Panner so notes sit where the
// creature is (the comb's through a tremolo first) -> lowpass filter ->
// feedback delay -> reverb -> limiter -> master volume. A brown-noise
// rumble joins at the limiter so the sea is never silent.
///////////////////////////////////////////////////////////////////

// the sound engine: the voice pools, the note gaps per plan, and the energy value the fish read
function SoundEngine() {
  this.ready = false;
  this.muted = false;
  this.energy = 0;
  this.notesThisFrame = 0;

  this.maxNotesPerFrame = 4; // *** hard cap when the lure sweeps through a crowd
  // same order as bodyPlans: sparkle, fish, jelly, seapen, dragon, squid, eel,
  // angler, comb, shrimp, octopus
  // *** ms between notes of one plan
  this.gap = [45, 30, 150, 300, 500, 60, 250, 400, 120, 40, 300];
  // a normal body per plan, for creatures with no species
  this.defaultRadius = [3, 7, 30, 40, 20, 16, 14, 22, 18, 6, 24];
  this.lastNoteAt = [];
  this.pools = []; // one VoicePool per plan, built one a frame after init()
  this.second = []; // a second pool for the plans that play two sounds a hit (squid, shrimp)
  for (let i = 0; i < this.gap.length; i++) {
    this.lastNoteAt.push(-1e9);
    this.pools.push(null);
    this.second.push(null);
  }
  this.building = []; // pools still to build, see update()
}

// builds the effects chain and queues the voices. runs after Tone.start(), on the first click
SoundEngine.prototype.init = function () {
  if (this.ready) return;

  // the shared chain, built from the output back
  this.master = new Tone.Volume(-4).toDestination(); // *** overall level
  this.limiter = new Tone.Limiter(-6).connect(this.master);
  // *** the size of the water
  this.reverb = new Tone.Reverb({ decay: 7.5, wet: 0.5 }).connect(this.limiter);
  // *** echo off the deep
  this.delay = new Tone.FeedbackDelay({ delayTime: 0.38, feedback: 0.32, wet: 0.22 }).connect(this.reverb);
  this.filter = new Tone.Filter(2400, "lowpass").connect(this.delay); // setDepth moves this

  // a quiet brown-noise bed, filtered very low, wandering with an LFO
  this.rumbleGain = new Tone.Volume(-34).connect(this.limiter); // *** how loud the sea itself is
  this.rumbleFilter = new Tone.Filter(110, "lowpass").connect(this.rumbleGain);
  this.rumble = new Tone.Noise("brown").connect(this.rumbleFilter);
  this.rumbleLfo = new Tone.LFO(0.05, 60, 180); // *** rate in Hz, then the cutoff range
  this.rumbleLfo.connect(this.rumbleFilter.frequency);
  this.rumble.start();
  this.rumbleLfo.start();

  // one panner per plan, the pools plug into these as they are built
  this.panners = [];
  for (let i = 0; i < this.pools.length; i++) {
    this.panners.push(new Tone.Panner(0).connect(this.filter));
  }
  // the comb's slow tremolo sits between its pool and its panner
  this.combTremolo = new Tone.Tremolo({ frequency: 4.5, depth: 0.45, spread: 60 }).connect(this.panners[8]); // *** the comb's shimmer rate and depth
  this.combTremolo.start();

  // *** change the sound of each body plan here (same order as bodyPlans).
  // Each entry is built on its own frame by update(), so the click that
  // starts the dive never stalls. count = voices, then the volume in dB.
  // second: true makes it the plan's second pool, via: a node to pass through.
  let self = this;
  this.building = [
    // 0 - sparkle: a short sine chime
    { plan: 0, count: 12, volume: -18, make: function () {
      return new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.004, decay: 0.22, sustain: 0, release: 0.35 }
      });
    } },
    // 1 - fish: an FM pluck, glassy at the start then plain
    { plan: 1, count: 16, volume: -15, make: function () {
      return new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 6,
        oscillator: { type: "sine" },
        modulation: { type: "sine" },
        envelope: { attack: 0.003, decay: 0.3, sustain: 0, release: 0.3 },
        modulationEnvelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.2 }
      });
    } },
    // 2 - jelly: a slow AM swell that keeps ringing after the bell pulses (two voices a hit)
    { plan: 2, count: 8, volume: -12, make: function () {
      return new Tone.AMSynth({
        harmonicity: 2,
        oscillator: { type: "sine" },
        modulation: { type: "sine" },
        envelope: { attack: 0.5, decay: 0.6, sustain: 0.5, release: 1.8 },
        modulationEnvelope: { attack: 1.0, decay: 0.5, sustain: 0.3, release: 1.4 }
      });
    } },
    // 3 - sea pen: a bowed pad. the filter envelope opens as the light runs up the stem
    // (two voices a hit)
    { plan: 3, count: 6, volume: -11, make: function () {
      return new Tone.MonoSynth({
        oscillator: { type: "sawtooth" },
        filter: { type: "lowpass", Q: 1, rolloff: -24 },
        filterEnvelope: { attack: 0.9, decay: 0.6, sustain: 0.4, release: 1.4, baseFrequency: 140, octaves: 2.6 },
        envelope: { attack: 0.8, decay: 0.4, sustain: 0.6, release: 1.6 }
      });
    } },
    // 4 - dragon: a fat detuned triangle, five voices blooming into a chord
    { plan: 4, count: 10, volume: -9, make: function () {
      return new Tone.Synth({
        oscillator: { type: "fattriangle", count: 3, spread: 30 },
        envelope: { attack: 0.6, decay: 1.0, sustain: 0.7, release: 2.0 }
      });
    } },
    // 5 - squid: the jet. an inharmonic FM burst, over in a blink (the chime is below)
    { plan: 5, count: 6, volume: -14, make: function () {
      return new Tone.FMSynth({
        harmonicity: 2.37,
        modulationIndex: 14,
        oscillator: { type: "sine" },
        modulation: { type: "square" },
        envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.15 },
        modulationEnvelope: { attack: 0.002, decay: 0.08, sustain: 0, release: 0.1 }
      });
    } },
    // 5 again - the squid's chime, a sine on top of the jet, through the squid's panner
    { plan: 5, second: true, count: 6, volume: -20, make: function () {
      return new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.004, decay: 0.3, sustain: 0, release: 0.5 }
      });
    } },
    // 6 - eel: a smooth voice that bends into its note, see play()
    { plan: 6, count: 3, volume: -12, make: function () {
      return new Tone.Synth({
        oscillator: { type: "fatsine", count: 2, spread: 12 },
        envelope: { attack: 0.08, decay: 0.3, sustain: 0.5, release: 0.8 }
      });
    } },
    // 7 - angler: one low lure tone, swelling in softly like a light coming on
    { plan: 7, count: 4, volume: -11, make: function () {
      return new Tone.Synth({
        oscillator: { type: "fatsine", count: 2, spread: 7 },
        envelope: { attack: 0.45, decay: 0.7, sustain: 0.45, release: 1.8 }
      });
    } },
    // 8 - comb: three detuned sines beating against each other, through the tremolo
    // (two voices a hit)
    { plan: 8, count: 8, volume: -16, via: this.combTremolo, make: function () {
      return new Tone.Synth({
        oscillator: { type: "fatsine", count: 3, spread: 22 },
        envelope: { attack: 0.03, decay: 0.5, sustain: 0.25, release: 1.3 }
      });
    } },
    // 9 - shrimp: the snap. a dense FM burst gone in twenty milliseconds (the blip is below)
    { plan: 9, count: 8, volume: -13, make: function () {
      return new Tone.FMSynth({
        harmonicity: 5.1,
        modulationIndex: 30,
        oscillator: { type: "triangle" },
        modulation: { type: "square" },
        envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.02 },
        modulationEnvelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 }
      });
    } },
    // 9 again - the shrimp's blip, a short high sine just after the snap
    { plan: 9, second: true, count: 8, volume: -20, make: function () {
      return new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.003, decay: 0.07, sustain: 0, release: 0.08 }
      });
    } },
    // 10 - octopus: a round, filtered triangle that swells slower than the jelly and
    // glides up, see play()
    { plan: 10, count: 4, volume: -10, make: function () {
      return new Tone.MonoSynth({
        oscillator: { type: "triangle" },
        filter: { type: "lowpass", Q: 0.6, rolloff: -12 },
        filterEnvelope: { attack: 0.7, decay: 0.8, sustain: 0.5, release: 2.0, baseFrequency: 180, octaves: 1.8 },
        envelope: { attack: 0.7, decay: 0.8, sustain: 0.55, release: 2.2 }
      });
    } }
  ];

  this.ready = true;
};

// The feel of each period of the day, all subtle. Same order as
// dayPeriods in the Species section: morning, afternoon, evening, night.
// *** change how the hour colours the sound here
let periodFeel = [
  { bright: 1.0, delay: 0.38, reverb: 0.6 }, // morning: wettest, like a wide calm sea at dawn
  { bright: 1.15, delay: 0.34, reverb: 0.45 }, // afternoon: a touch brighter and drier
  // evening: a little darker, the echo starts to stretch
  { bright: 0.95, delay: 0.42, reverb: 0.5 },
  { bright: 1.0, delay: 0.5, reverb: 0.55 } // night: the longest echo off the deep
];

// muffles the sound by day and opens it at night, then tints it with the period's echo and reverb
SoundEngine.prototype.setDepth = function (migration) {
  if (!this.ready) return;
  if (frameCount % 30 !== 0) return; // twice a second is plenty for a ramp

  let m = constrain(migration, 0, 1);
  if (m !== m) m = 1; // NaN guard
  let feel = this.feelNow(m);

  // exponential, because we hear pitch on a log scale
  let cutoff = 1400 * pow(3200 / 1400, m) * feel.bright; // *** muffle range, day to night
  this.filter.frequency.rampTo(cutoff, 1);
  this.rumbleGain.volume.rampTo(lerp(-30, -36, m), 1); // *** rumble by day, then by night
  this.delay.delayTime.rampTo(feel.delay, 1);
  this.reverb.wet.rampTo(feel.reverb, 1);
};

// the feel of the current period of the day
SoundEngine.prototype.feelNow = function (migration) {
  let index = 3;
  if (typeof periodOf === "function" && typeof dayPeriods !== "undefined" && typeof tide !== "undefined" && tide && tide.hour >= 0) {
    index = dayPeriods.indexOf(periodOf(tide.hour));
  } else {
    index = migration > 0.5 ? 3 : 1; // deep water means night, shallow means afternoon
  }
  if (index < 0 || index >= periodFeel.length) index = 3;
  return periodFeel[index];
};

// once a frame: lets the energy calm down and builds one voice pool until all are there
SoundEngine.prototype.update = function () {
  this.notesThisFrame = 0;
  this.energy *= 0.97; // *** how fast the music calms down

  if (this.building.length > 0) {
    let b = this.building.shift();
    let output = b.via ? b.via : this.panners[b.plan];
    let pool = new VoicePool(b.count, b.make, b.volume, output);
    if (b.second) this.second[b.plan] = pool;
    else this.pools[b.plan] = pool;
  }
};

// which body plan a creature is, from .plan, else .family, else sparkle
SoundEngine.prototype.planOf = function (creature) {
  let n = this.gap.length;
  if (creature && creature.plan >= 0 && creature.plan < n) return floor(creature.plan);
  if (creature && creature.family >= 0 && creature.family < n) return floor(creature.family);
  return 0;
};

// how many scale steps above or below the plan's home note this species sits
SoundEngine.prototype.speciesSteps = function (creature, plan, radius) {
  let hasTable = typeof speciesList !== "undefined";
  let size = 1;
  let nudge = 0;
  if (hasTable && creature && creature.species >= 0 && creature.species < speciesList.length) {
    let i = floor(creature.species);
    let sp = speciesList[i];
    if (sp && sp.size > 0) size = sp.size;
    nudge = speciesNudge(i);
    if (size >= 1.5) nudge = -1; // the giants keep the lowest note of their plan
  } else if (creature && creature.size > 0) {
    size = creature.size;
  } else {
    size = radius / this.defaultRadius[plan];
  }
  let steps = round(stepsPerSize * (size - 1) + nudge);
  return constrain(steps, planRange[plan][0], planRange[plan][1]);
};

// plays the struck creature's voice, or skips the note when it is too soon or too busy
SoundEngine.prototype.play = function (creature) {
  if (!this.ready || this.muted) return false;
  if (this.notesThisFrame >= this.maxNotesPerFrame) return false;

  // read the creature carefully, every field may be missing
  let plan = this.planOf(creature);
  let x = width / 2;
  let y = height / 2;
  if (creature && creature.position) {
    // a number that equals itself is a real number, not NaN or undefined
    let px = creature.position.x;
    let py = creature.position.y;
    if (typeof px === "number" && px === px) x = px;
    if (typeof py === "number" && py === py) y = py;
  }
  let radius = this.defaultRadius[plan];
  if (creature && creature.body && creature.body.radius > 0) radius = creature.body.radius;
  let gen = 0;
  if (creature && creature.gen > 0) gen = floor(creature.gen);

  let now = millis();
  if (now - this.lastNoteAt[plan] < this.gap[plan]) return false;
  let pool = this.pools[plan];
  let second = this.second[plan];
  if (pool === null) return false; // still being built, a few frames after init()
  if ((plan === 5 || plan === 9) && second === null) return false;
  this.lastNoteAt[plan] = now;
  this.notesThisFrame++;
  this.energy += 1;

  // the busier the music, the softer each new note, so a swarm stays comfortable
  let duck = 1 / (1 + this.energy * 0.05); // *** how hard a crowd gets turned down
  let pan = constrain(map(x, 0, width, -0.85, 0.85), -0.85, 0.85);
  if (pan !== pan) pan = 0; // width is 0 before the canvas exists
  this.panners[plan].pan.rampTo(pan, 0.02);

  let sp = this.speciesSteps(creature, plan, radius);
  let t = Tone.now();

  if (plan === 0) {
    // sparkle: the species sets the note, each chain generation climbs and fades
    let step = 12 + sp + gen * 2;
    let vel = 0.6 * pow(0.65, gen) * duck;
    pool.trigger(midiToFreq(stepToMidi(step)), 0.12, t, vel);
  } else if (plan === 1) {
    // fish: higher in the water, higher the note, then the species colour
    let step = round(map(constrain(y / height, 0, 1), 0, 1, 12, 5)) + sp;
    pool.trigger(midiToFreq(stepToMidi(step)), 0.15, t, 0.7 * duck);
  } else if (plan === 2) {
    // jelly: root and a third above, together. bigger bells are lower
    let step = 1 + sp;
    pool.trigger(midiToFreq(stepToMidi(step)), 0.8, t, 0.6 * duck);
    pool.trigger(midiToFreq(stepToMidi(thirdAbove(step))), 0.8, t, 0.6 * duck);
  } else if (plan === 3) {
    // sea pen: a low root, then its fifth as the light reaches the top of the stem
    let root = stepToMidi(-1 + sp);
    pool.trigger(midiToFreq(root), 1.4, t, 0.55 * duck);
    pool.trigger(midiToFreq(root + 7), 1.1, t + 0.3, 0.45 * duck);
  } else if (plan === 4) {
    // dragon: A1 E2 C3 G3 D4 for the stoplight, shifted for its cousins, held, blooming.
    // a note that would fall under A1 moves up an octave instead, so the
    // gulper eel keeps the lowest note in the piece
    let chord = [-5, -2, 1, 4, 7]; // *** the dragon's chord as scale steps
    let shift = sp;
    for (let i = 0; i < chord.length; i++) {
      let step = chord[i] + shift;
      if (step < -5) step += 5;
      pool.trigger(midiToFreq(stepToMidi(step)), 3.0 - i * 0.08, t + i * 0.08, 0.5 * duck);
    }
  } else if (plan === 5) {
    // squid: a jet of water (the inharmonic burst) with a chime an octave up
    let step = 7 + sp;
    pool.trigger(midiToFreq(stepToMidi(step)), 0.08, t, 0.8 * duck);
    second.trigger(midiToFreq(stepToMidi(step + 5)), 0.1, t + 0.02, 0.6 * duck);
  } else if (plan === 6) {
    // eel: bends up three semitones into its note as the body passes the line.
    // home is E2, low enough that the giants land under the dragon's A1
    let target = midiToFreq(stepToMidi(-3 + sp));
    let from = midiToFreq(stepToMidi(-3 + sp) - 3); // *** how far below the bend starts
    let voice = pool.trigger(from, 0.7, t, 0.6 * duck);
    voice.frequency.exponentialRampToValueAtTime(target, t + 0.4); // *** how long the bend takes
  } else if (plan === 7) {
    // angler: one long low note, home G2, the swell is all in the envelope
    pool.trigger(midiToFreq(stepToMidi(-1 + sp)), 1.6, t, 0.65 * duck);
  } else if (plan === 8) {
    // comb: a high note with a quieter twelfth on top, so the beating partials spread
    let step = 9 + sp;
    pool.trigger(midiToFreq(stepToMidi(step)), 0.6, t, 0.55 * duck);
    pool.trigger(midiToFreq(stepToMidi(step + 7)), 0.5, t + 0.01, 0.3 * duck);
  } else if (plan === 9) {
    // shrimp: the snap has no real pitch, the blip right after it does, very high
    let step = 14 + sp;
    pool.trigger(midiToFreq(stepToMidi(step) - 12), 0.03, t, 0.9 * duck);
    second.trigger(midiToFreq(stepToMidi(step)), 0.06, t + 0.03, 0.55 * duck);
  } else {
    // octopus: home A2, starts two semitones under and glides up as it swells
    let target = midiToFreq(stepToMidi(sp));
    let from = midiToFreq(stepToMidi(sp) - 2); // *** how far below the glide starts
    let voice = pool.trigger(from, 1.8, t, 0.6 * duck);
    voice.frequency.exponentialRampToValueAtTime(target, t + 0.9); // *** how long the glide takes
  }

  return true;
};

// mutes at the very end of the chain, so the rumble goes quiet too
SoundEngine.prototype.toggleMute = function () {
  this.muted = !this.muted;
  if (typeof Tone !== "undefined") Tone.Destination.mute = this.muted;
};

///////////////////////////////////////////////////////////////////
// 9. INTERFACE
// Everything written or clickable on top of the sea.
///////////////////////////////////////////////////////////////////

// All of it is drawn with p5 (text, rect, circle), there is no HTML.
// Buttons are hit-tested by rectangle in mousePressed(). The small
// title and the clock are flat text; the field guide and the help are
// panels that collapse to their heading with the round button at the
// end of the heading, a click anywhere on the heading, or the key
// shown in the tag beside the button. Keys are shown as capitals and
// matched in lowercase, since the Main section lowercases them first.
//
// Look: a serif display face for titles (Georgia), a clean sans for
// body text, pale text and one glowing green for anything you can
// press. Panels are translucent dark rounded boxes with a pale border.

///////////////////////////////////////////////////////////////////
// Panels Object
// Interface used by the Main section (screen coordinates, drawn last):
//   ui.render()            title, clock, field guide, help, and on the
//                          surface the start button, the new-log link
//                          and the hold ring
//   ui.mousePressed()      returns true if the click landed on a panel
//                          or a control, so the sketch leaves the lure alone
//   ui.keyPressed(key)     returns true if the key toggled something
//   ui.toggle(name)        "guide", "clock", "help"
//   ui.shown[name]         true = open, false = collapsed (clock: hidden)
//   ui.frame(name)         the rectangle a block takes up right now
//   ui.panelAlpha(name)    0 to 1, how visible a block is
//   ui.hovering            true while the pointer is over a panel or a
//                          control, so the Main section skips the dive hold
//   ui.unlock(species)     the Creatures section calls this on every strike. The
//                          species index goes into the field guide
//   ui.resetUnlocks()      a new player: clear the guide
//
// Reads: tide.clockText(), tide.phaseText(), tide.hour, speciesList[]
// (name, latin, blurb, col, and url + source for the read-about link),
// dayPeriods, periodStarts, periodOf(), speciesOfPeriod(), sea.state,
// diveHold, soundOn(). Calls: beginDive() and toggleSound() in the Main section,
// and window.open(url, "_blank", "noopener") for the read-about link.
// Portraits come from Body(species, 1).renderIcon(x, y, size) and
// Body.renderSilhouette(x, y, size) in the Anatomy section. Bodies are grown
// one per frame, only for the guide page that is showing, and kept.
///////////////////////////////////////////////////////////////////

// the interface: which panels are open, the palette, the fonts and the field guide's log
function Panels() {
  // *** the guide starts closed, press G or its heading to open it
  this.shown = { clock: true, guide: false, help: true };
  this.keys = { clock: "t", guide: "g", help: "i" }; // *** the panel keys, shown as capitals

  // *** the palette, shared with the rest of the piece
  this.pale = [212, 230, 234];
  this.glow = [95, 243, 216];
  this.ink = [6, 14, 26]; // panel background

  // *** faces. one family name each: p5 1.11 quotes the whole string as
  // a single family, so a comma list would silently fall back to Times
  this.serif = "Georgia";
  this.sans = "Arial";
  this.mono = "Courier"; // for the key tags

  this.pad = 16; // *** inner margin of every panel
  this.radius = 14; // *** corner radius of panels
  this.fadeMs = 1000; // *** how long the surface text takes to fade

  // *** the title size, the same on the surface and under water
  this.titleSmall = 22;

  // the field guide log. Found flags live for the page's lifetime only,
  // so a shared laptop starts clean on reload (no localStorage on purpose)
  this.found = [];
  this.flashAt = []; // ms when each species was found, for the cell flash
  for (let i = 0; i < speciesList.length; i++) {
    this.found.push(false);
    this.flashAt.push(-1e9);
  }
  this.foundCount = 0;
  this.recent = -1; // the species found last
  this.selected = -1; // the cell the player clicked, shown in the detail strip
  this.hoverCell = -1; // the species under the pointer this frame
  // the read-about link in the detail strip, { x, y, w, h, species }, refreshed each frame
  this.readBox = null;
  this.bodies = {}; // species index -> Body, grown on first use
  this.grewThisFrame = false; // at most one body is grown per frame
  this.toast = null; // { text, at } for about two seconds after a find
  this.toastMs = 2000; // *** how long the "New: ..." toast stays
  this.flashMs = 2000; // *** how long a new cell glows

  // the guide pages, one per period of the day
  this.pages = [];
  for (let p = 0; p < dayPeriods.length; p++) {
    this.pages.push(speciesOfPeriod(dayPeriods[p]));
  }
  this.tab = 0; // which page is showing
  this.tabPinned = false; // true once the player picked a page, else it follows the clock

  // the surface text fade. alpha 1 on the surface, 0 under water
  this.lastState = "";
  this.startAlpha = 1;
  this.fadeFrom = 1;
  this.fadeTo = 1;
  this.fadeAt = -1e9;

  this.hovering = false; // pointer is over a panel or a control this frame
  this.hot = false; // pointer is over something pressable this frame

  this.lastW = 0;
  this.lastH = 0;
  this.boxes = {};
  this.layout();
}

///////////////////////////////////////////////////////////////////
// Layout
// One table of boxes that drawing and hit-testing both read, so a
// button is always clickable exactly where it is drawn. Each panel
// has h (open) and hh (collapsed, just the heading). Bottom panels
// hang from the bottom edge, so collapsing them keeps them there.
// The flat text blocks (title, clock) refresh their boxes while they
// draw, since their size depends on the text.
///////////////////////////////////////////////////////////////////

// works out where every panel and button sits for this window size
Panels.prototype.layout = function () {
  this.lastW = width;
  this.lastH = height;
  let m = 20; // *** margin from the canvas edge
  let p = this.pad;
  let b = {};

  // title, top left. refreshed by renderTitle
  b.title = { x: m, y: m, w: min(500, width - 2 * m), h: 80, hh: 80, anchor: "top" };
  b.resetLink = { x: m, y: m + 90, w: 90, h: 16 };

  // the start screen group, centred: the big title, the start button
  // under it, and the new-log link under that
  // *** 0.42 = how far down the screen the button sits
  b.start = { x: width / 2 - 90, y: height * 0.42, w: 180, h: 48 };

  // clock, top right, flat text. the sound toggle's box is refreshed
  // by renderClock, since it is as wide as its word
  b.clock = { x: width - m - 290, y: m, w: 290, h: 128, hh: 128, anchor: "top" };
  b.soundLink = { x: b.clock.x, y: b.clock.y + 108, w: 0, h: 16 };

  // field guide, bottom left: four tabs (one per period of the day),
  // each a grid of 25 portrait cells, and a detail strip for one
  // species at a time. The strip shrinks to one line on short screens.
  let cell = 48; // *** size of one portrait cell
  let gap = 4;
  let gw = min(400, width - 2 * m);
  let cols = max(4, floor((gw - 2 * p + gap) / (cell + gap)));
  let per = this.pages[0].length;
  let rows = ceil(per / cols);
  let gridH = rows * (cell + gap) - gap;
  let tabsH = 36; // *** height of the tab row
  let noteH = 14; // *** the one-line note under the tabs
  let detailH = height < 720 ? 36 : 88; // *** the detail strip, one line when space is short
  let gh = 44 + tabsH + noteH + 6 + gridH + 10 + detailH + 8;
  b.guide = { x: m, y: height - m - gh, w: gw, h: gh, hh: 44, anchor: "bottom", cell: cell, gap: gap, cols: cols, gridH: gridH, tabsH: tabsH, noteH: noteH, detailH: detailH };

  // help, bottom right. short, the keys sit on the panels now
  b.help = { x: width - m - 300, y: height - m - 96, w: 300, h: 96, hh: 44, anchor: "bottom" };

  this.boxes = b;
};

// the rectangle a panel takes up right now, open or collapsed
Panels.prototype.frame = function (name) {
  let b = this.boxes[name];
  let h = this.shown[name] ? b.h : b.hh;
  let y = b.anchor === "bottom" ? b.y + b.h - h : b.y;
  return { x: b.x, y: y, w: b.w, h: h };
};

// the heading strip of a panel, which is what you click to toggle it
Panels.prototype.heading = function (name) {
  let f = this.frame(name);
  return { x: f.x, y: f.y, w: f.w, h: this.boxes[name].hh };
};

// the round collapse button at the right end of a heading
Panels.prototype.buttonBox = function (f) {
  return { x: f.x + f.w - this.pad - 20, y: f.y + 12, w: 20, h: 20 };
};

// one tab of the guide
Panels.prototype.tabBox = function (p) {
  let f = this.frame("guide");
  let b = this.boxes.guide;
  let w = (f.w - 2 * this.pad) / this.pages.length;
  return { x: f.x + this.pad + p * w, y: f.y + 44, w: w, h: b.tabsH };
};

// one portrait cell of the showing page, k is the cell number
Panels.prototype.cellBox = function (k) {
  let f = this.frame("guide");
  let b = this.boxes.guide;
  let col = k % b.cols;
  let row = floor(k / b.cols);
  let top = f.y + 44 + b.tabsH + b.noteH + 6;
  return { x: f.x + this.pad + col * (b.cell + b.gap), y: top + row * (b.cell + b.gap), w: b.cell, h: b.cell };
};

// true when the mouse is inside the box
Panels.prototype.inBox = function (b) {
  return mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h;
};

// opens or collapses a panel
Panels.prototype.toggle = function (name) {
  if (this.shown[name] === undefined) return;
  this.shown[name] = !this.shown[name];
};

// the guide and help only appear once the dive begins. the title and clock always show
Panels.prototype.panelAlpha = function (name) {
  if (name === "clock" || name === "title") return 1;
  return 1 - this.startAlpha;
};

// how far the camera is into the dive, 0 on the surface and 1 under water
Panels.prototype.diveU = function () {
  if (typeof sea.u === "number") return constrain(sea.u, 0, 1);
  return 1 - this.startAlpha;
};

// which period of the day the clock is in, as an index into dayPeriods
Panels.prototype.periodNow = function () {
  return dayPeriods.indexOf(periodOf(tide.hour));
};

// "Night . 22:00 to 05:00", with an escaped middle dot since index.html sets no charset
Panels.prototype.periodLabel = function (p) {
  let name = dayPeriods[p];
  let from = periodStarts[p];
  let to = periodStarts[(p + 1) % periodStarts.length];
  return name.charAt(0).toUpperCase() + name.slice(1) + " \u00b7 " + nf(from, 2) + ":00 to " + nf(to, 2) + ":00";
};

///////////////////////////////////////////////////////////////////
// The log
// the Creatures section calls unlock() on every strike. Only the first strike
// of a species does anything.
///////////////////////////////////////////////////////////////////

// the first strike of a species adds it to the log, flashes its cell and shows a toast
Panels.prototype.unlock = function (species) {
  if (species < 0 || species >= speciesList.length) return;
  if (this.found[species]) return;
  this.found[species] = true;
  this.foundCount++;
  this.recent = species;
  this.selected = species;
  this.flashAt[species] = millis();
  this.toast = { text: "New: " + speciesList[species].name, at: millis() };
};

// clears the log for a new player
Panels.prototype.resetUnlocks = function () {
  for (let i = 0; i < this.found.length; i++) {
    this.found[i] = false;
    this.flashAt[i] = -1e9;
  }
  this.foundCount = 0;
  this.recent = -1;
  this.selected = -1;
  this.toast = null;
};

// how many of one page's species have been found
Panels.prototype.pageCount = function (p) {
  let list = this.pages[p];
  let n = 0;
  for (let i = 0; i < list.length; i++) {
    if (this.found[list[i]]) n++;
  }
  return n;
};

// the body that draws a species' portrait, grown on first use, at most one a frame
Panels.prototype.bodyFor = function (i) {
  if (this.bodies[i] !== undefined) return this.bodies[i];
  if (this.grewThisFrame) return null;
  let can = typeof Body === "function" && typeof Body.prototype.renderIcon === "function";
  if (!can) return null;
  this.grewThisFrame = true;
  this.bodies[i] = new Body(i, 1);
  return this.bodies[i];
};

///////////////////////////////////////////////////////////////////
// Render
// Called last by the Main section, in screen coordinates.
///////////////////////////////////////////////////////////////////

// draws the whole interface on top of the sea: title, start screen, clock, panels, toast
Panels.prototype.render = function () {
  if (width !== this.lastW || height !== this.lastH) this.layout();
  this.updateFade();
  if (!this.tabPinned) this.tab = this.periodNow();
  this.grewThisFrame = false;

  push();
  textFont(this.sans);
  textStyle(NORMAL);

  this.hovering = false;
  this.hot = false;
  this.hoverCell = -1;
  this.readBox = null;

  this.renderTitle();
  if (this.startAlpha > 0) this.renderSurface(this.startAlpha);
  this.renderClock(1);

  let names = ["guide", "help"];
  for (let i = 0; i < names.length; i++) {
    let a = this.panelAlpha(names[i]);
    if (a <= 0.01) continue;
    if (a > 0.5 && this.inBox(this.frame(names[i]))) this.hovering = true;
    if (names[i] === "guide") this.renderGuide(a);
    if (names[i] === "help") this.renderHelp(a);
    this.controls(this.frame(names[i]), this.keys[names[i]], this.shown[names[i]], a);
  }
  this.renderToast();
  pop();

  this.updateCursor();
};

// fades the surface text out over the first second of the dive and back in on the rise
Panels.prototype.updateFade = function () {
  let s = sea.state;
  if (s !== this.lastState) {
    this.fadeFrom = this.startAlpha;
    this.fadeTo = s === "surface" || s === "rising" ? 1 : 0;
    this.fadeAt = millis();
    if (this.lastState === "") this.fadeAt = -1e9; // first frame, no fade
    this.lastState = s;
  }
  let u = constrain((millis() - this.fadeAt) / this.fadeMs, 0, 1);
  this.startAlpha = lerp(this.fadeFrom, this.fadeTo, u);
};

// a hand over anything pressable, an arrow on the surface and panels, no pointer under water
Panels.prototype.updateCursor = function () {
  if (this.hot) cursor(HAND);
  else if (this.startAlpha > 0 || this.hovering) cursor(ARROW);
  else noCursor();
};

///////////////////////////////////////////////////////////////////
// Drawing helpers
// Shared bits so every panel and button looks the same.
///////////////////////////////////////////////////////////////////

// a see-through dark rounded panel with a thin pale border
Panels.prototype.panel = function (f, a) {
  stroke(this.pale[0], this.pale[1], this.pale[2], 55 * a);
  strokeWeight(1);
  fill(this.ink[0], this.ink[1], this.ink[2], 170 * a);
  rect(f.x, f.y, f.w, f.h, this.radius);
  noStroke();
};

// the key tag and the round plus or minus button at the right end of a heading
Panels.prototype.controls = function (f, key, open, a) {
  let b = this.buttonBox(f);
  let hover = a > 0.5 && this.inBox(b);
  if (hover) this.hot = true;

  // the key, as a capital in a small monospace tag
  let tag = { x: b.x - 8 - 22, y: b.y + 1, w: 22, h: 18 };
  stroke(this.pale[0], this.pale[1], this.pale[2], 50 * a);
  strokeWeight(1);
  fill(this.pale[0], this.pale[1], this.pale[2], 10 * a);
  rect(tag.x, tag.y, tag.w, tag.h, 4);
  noStroke();
  textFont(this.mono);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(11);
  fill(this.pale[0], this.pale[1], this.pale[2], 140 * a);
  text(key.toUpperCase(), tag.x + tag.w / 2, tag.y + tag.h / 2);
  textStyle(NORMAL);

  // the button
  stroke(this.pale[0], this.pale[1], this.pale[2], (hover ? 170 : 90) * a);
  fill(this.pale[0], this.pale[1], this.pale[2], (hover ? 40 : 14) * a);
  circle(b.x + b.w / 2, b.y + b.h / 2, b.w);
  let cx = b.x + b.w / 2;
  let cy = b.y + b.h / 2;
  stroke(this.pale[0], this.pale[1], this.pale[2], (hover ? 240 : 180) * a);
  strokeWeight(1.5);
  line(cx - 4, cy, cx + 4, cy);
  if (!open) line(cx, cy - 4, cx, cy + 4);
  noStroke();
};

// an italic serif heading. returns its width so something can sit after it
Panels.prototype.title = function (str, x, y, size, a) {
  textFont(this.serif);
  textStyle(ITALIC);
  textAlign(LEFT, TOP);
  textSize(size);
  fill(this.pale[0], this.pale[1], this.pale[2], 235 * a);
  text(str, x, y);
  let w = textWidth(str);
  textStyle(NORMAL);
  textFont(this.sans);
  return w;
};

// body text, pale or muted
Panels.prototype.body = function (str, x, y, w, size, muted, a) {
  textFont(this.sans);
  textAlign(LEFT, TOP);
  textSize(size);
  fill(this.pale[0], this.pale[1], this.pale[2], (muted ? 150 : 225) * a);
  text(str, x, y, w, 200);
};

// a small underlined link that brightens on hover. returns its width
Panels.prototype.link = function (b, label, a) {
  textFont(this.sans);
  textAlign(LEFT, TOP);
  textSize(11);
  let w = textWidth(label);
  b.w = w;
  let hover = a > 0.5 && this.inBox(b);
  if (hover) {
    this.hot = true;
    this.hovering = true;
  }
  fill(this.pale[0], this.pale[1], this.pale[2], (hover ? 230 : 120) * a);
  text(label, b.x, b.y + 2);
  stroke(this.pale[0], this.pale[1], this.pale[2], (hover ? 160 : 70) * a);
  strokeWeight(1);
  line(b.x, b.y + 14, b.x + w, b.y + 14);
  noStroke();
  return w;
};

// the start button: a filled glowing pill
Panels.prototype.startButton = function (b, label, a) {
  let hover = this.inBox(b);
  if (hover) {
    this.hot = true;
    this.hovering = true; // so the dive hold never starts under it
  }
  let r = b.h / 2;
  noStroke();
  fill(this.glow[0], this.glow[1], this.glow[2], (hover ? 255 : 215) * a);
  rect(b.x, b.y, b.w, b.h, r);
  fill(this.ink[0], this.ink[1], this.ink[2], 255 * a);
  textFont(this.sans);
  textStyle(NORMAL);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(label, b.x + b.w / 2, b.y + b.h / 2);
};

// a species portrait: the grown body when there is one, a dot until then
Panels.prototype.portrait = function (i, x, y, size, a) {
  let c = speciesList[i].col;
  let body = this.bodyFor(i);
  if (body !== null) {
    body.renderIcon(x, y, size);
    return;
  }
  noStroke();
  fill(c[0], c[1], c[2], 50 * a);
  circle(x, y, size * 0.8);
  fill(c[0], c[1], c[2], 230 * a);
  circle(x, y, size * 0.28);
};

// a species not found yet: its dark shape, so you can tell something is there
Panels.prototype.silhouette = function (i, x, y, size, a) {
  let body = this.bodyFor(i);
  if (body !== null && typeof body.renderSilhouette === "function") {
    body.renderSilhouette(x, y, size);
    return;
  }
  noStroke();
  fill(this.pale[0], this.pale[1], this.pale[2], 22 * a);
  circle(x, y, size * 0.36);
};

///////////////////////////////////////////////////////////////////
// Title
// Under water: flat text at the top left, small so it never competes
// with the scene. On the surface the start screen draws its own big
// centred title instead, and the two cross-fade during the dive.
///////////////////////////////////////////////////////////////////

// the small title at the top left, shown once the start screen has faded
Panels.prototype.renderTitle = function () {
  let m = 20;
  let a = 1 - this.startAlpha; // the start screen has its own big title
  let size = this.titleSmall;
  let x = m;
  let y = m;

  textFont(this.serif);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  textSize(size);
  // a dark shadow underneath, so it reads on a bright daytime sky
  fill(this.ink[0], this.ink[1], this.ink[2], 120 * a);
  text("The Abyss Listens", x + 1, y + 2);
  fill(this.pale[0], this.pale[1], this.pale[2], 245 * a);
  text("The Abyss Listens", x, y);
  let w = textWidth("The Abyss Listens");

  // keep the box table honest, for anything that reads ui.frame("title")
  let b = this.boxes.title;
  b.x = x;
  b.y = y;
  b.w = w;
  b.h = size * 1.15;
  b.hh = b.h;
};

///////////////////////////////////////////////////////////////////
// Surface
// Shown above the water, fading out over the first second of the
// dive and back in while rising: the big title, the start button,
// the new-log link and the count under it, and the ring that fills
// while the pointer is held at the bottom.
///////////////////////////////////////////////////////////////////

// the start screen: the big title, the start button, the new-log link and the hold ring
Panels.prototype.renderSurface = function (a) {
  let sb = this.boxes.start;

  // the big title, centred just above the button
  let size = min(64, width * 0.09); // *** start screen title size
  textFont(this.serif);
  textStyle(NORMAL);
  textAlign(CENTER, BOTTOM);
  textSize(size);
  fill(this.ink[0], this.ink[1], this.ink[2], 120 * a);
  text("The Abyss Listens", width / 2 + 1, sb.y - 26 + 2);
  fill(this.pale[0], this.pale[1], this.pale[2], 245 * a);
  text("The Abyss Listens", width / 2, sb.y - 26);

  // the start button: turns the sound on and lowers the line
  if (sea.state === "surface") {
    this.startButton(sb, "Start", a);
  }

  // a new log, and the count so far, centred under the button
  let r = this.boxes.resetLink;
  textFont(this.sans);
  textSize(11);
  r.w = textWidth("Start a new log");
  r.x = width / 2 - r.w / 2;
  r.y = sb.y + sb.h + 16;
  this.link(r, "Start a new log", a);
  if (this.foundCount > 0) {
    textAlign(CENTER, TOP);
    textSize(11);
    fill(this.glow[0], this.glow[1], this.glow[2], 190 * a);
    text(this.foundCount + " of " + speciesList.length + " found", width / 2, r.y + 22);
  }

  // the hold ring around the pointer, filling clockwise from the top
  let hold = typeof diveHold === "number" ? diveHold : 0;
  if (hold > 0) {
    let rad = 22; // *** ring radius
    noFill();
    strokeWeight(1);
    stroke(this.glow[0], this.glow[1], this.glow[2], 60 * a);
    circle(mouseX, mouseY, rad * 2);
    strokeWeight(2);
    stroke(this.glow[0], this.glow[1], this.glow[2], 230 * a);
    arc(mouseX, mouseY, rad * 2, rad * 2, -HALF_PI, -HALF_PI + TWO_PI * hold);
    noStroke();
  }
};

///////////////////////////////////////////////////////////////////
// Clock
// Flat text at the top right: the time, the phase, the period, and
// the sound toggle. T hides the whole block.
///////////////////////////////////////////////////////////////////

// the real time, big, with the migration line, the period and the sound toggle under it
Panels.prototype.renderClock = function (a) {
  let b = this.boxes.clock;
  let right = b.x + b.w;
  if (this.inBox(b)) this.hovering = true;
  if (!this.shown.clock) return;

  // the real time, big
  textFont(this.serif);
  textStyle(NORMAL);
  textAlign(RIGHT, TOP);
  textSize(40);
  fill(this.ink[0], this.ink[1], this.ink[2], 120 * a);
  text(tide.clockText(), right + 1, b.y + 2);
  fill(this.pale[0], this.pale[1], this.pale[2], 240 * a);
  text(tide.clockText(), right, b.y);

  // the two lines under it
  textFont(this.sans);
  textSize(12);
  fill(this.pale[0], this.pale[1], this.pale[2], 150 * a);
  text(tide.phaseText(), right, b.y + 54);
  fill(this.pale[0], this.pale[1], this.pale[2], 225 * a);
  text(this.periodLabel(this.periodNow()), right, b.y + 72);

  // the sound toggle, under the lines
  textSize(11);
  let on = typeof soundOn === "function" ? soundOn() : false;
  let sl = this.boxes.soundLink;
  let label = on ? "sound on" : "sound off";
  let sw = textWidth(label);
  sl.x = right - sw;
  sl.y = b.y + 100;
  this.link(sl, label, a);
  if (on) {
    // a glowing dot before it, so the state reads at a glance
    noStroke();
    fill(this.glow[0], this.glow[1], this.glow[2], 220 * a);
    circle(sl.x - 9, sl.y + 9, 5);
  }
};

///////////////////////////////////////////////////////////////////
// The panels
///////////////////////////////////////////////////////////////////

// the field guide: its heading, the tabs, the grid of portraits and the detail strip
Panels.prototype.renderGuide = function (a) {
  let f = this.frame("guide");
  let b = this.boxes.guide;
  let p = this.pad;
  this.panel(f, a);
  let tw = this.title("Field guide", f.x + p, f.y + 11, 20, a);
  this.body(this.foundCount + " of " + speciesList.length, f.x + p + tw + 12, f.y + 17, 120, 12, true, a);
  if (!this.shown.guide) return;

  this.renderTabs(a);

  // the note under the tabs. The periods are ours, the real migration
  // is a slow rise at dusk and a sink at dawn
  textFont(this.sans);
  textAlign(LEFT, TOP);
  textSize(9);
  fill(this.pale[0], this.pale[1], this.pale[2], 110 * a);
  text("Periods are a game rule, loosely following when real animals rise and sink.", f.x + p + 6, f.y + 44 + b.tabsH + 1);

  // the grid: one cell per species of the showing page
  let list = this.pages[this.tab];
  let now = millis();
  for (let k = 0; k < list.length; k++) {
    let i = list[k];
    let cb = this.cellBox(k);
    let hover = a > 0.5 && this.inBox(cb);
    if (hover) {
      this.hoverCell = i;
      this.hot = true;
    }
    let c = speciesList[i].col;
    let flash = 1 - constrain((now - this.flashAt[i]) / this.flashMs, 0, 1);

    // the cell: a faint tile, brighter when hovered or selected, glowing when new
    noStroke();
    fill(this.pale[0], this.pale[1], this.pale[2], (hover ? 30 : 10) * a);
    rect(cb.x, cb.y, cb.w, cb.h, 8);
    if (i === this.selected || flash > 0) {
      let pulse = 0.5 + 0.5 * sin(now * 0.012);
      stroke(this.glow[0], this.glow[1], this.glow[2], (i === this.selected ? 110 : 0) * a + 150 * flash * pulse * a);
      strokeWeight(1);
      noFill();
      rect(cb.x + 0.5, cb.y + 0.5, cb.w - 1, cb.h - 1, 8);
      noStroke();
    }
    if (this.found[i]) {
      if (flash > 0) {
        fill(c[0], c[1], c[2], 70 * flash * a);
        circle(cb.x + cb.w / 2, cb.y + cb.h / 2, cb.w * (0.6 + 0.6 * flash));
      }
      this.portrait(i, cb.x + cb.w / 2, cb.y + cb.h / 2, cb.w * 0.7, a);
    } else {
      this.silhouette(i, cb.x + cb.w / 2, cb.y + cb.h / 2, cb.w * 0.7, a);
    }
  }

  // the detail strip: whatever the pointer is over, else the selection
  let dy = f.y + 44 + b.tabsH + b.noteH + 6 + b.gridH + 10;
  let show = this.hoverCell >= 0 ? this.hoverCell : this.selected;
  stroke(this.pale[0], this.pale[1], this.pale[2], 30 * a);
  strokeWeight(1);
  line(f.x + p, dy - 5, f.x + f.w - p, dy - 5);
  noStroke();
  if (b.detailH < 60) this.renderDetailLine(show, f.x + p, dy, f.w - 2 * p, a);
  else this.renderDetail(show, f.x + p, dy, f.w - 2 * p, a);
};

// the four pages. the one for the hour on the clock says "now"
Panels.prototype.renderTabs = function (a) {
  let now = this.periodNow();
  for (let p = 0; p < this.pages.length; p++) {
    let t = this.tabBox(p);
    let hover = a > 0.5 && this.inBox(t);
    if (hover) this.hot = true;
    let on = p === this.tab;
    let name = dayPeriods[p];
    name = name.charAt(0).toUpperCase() + name.slice(1);

    noStroke();
    if (on) {
      fill(this.glow[0], this.glow[1], this.glow[2], 160 * a);
      rect(t.x + 4, t.y + t.h - 2, t.w - 8, 2, 1);
    } else if (hover) {
      fill(this.pale[0], this.pale[1], this.pale[2], 14 * a);
      rect(t.x, t.y, t.w, t.h, 6);
    }
    textFont(this.sans);
    textAlign(LEFT, TOP);
    textSize(12);
    fill(this.pale[0], this.pale[1], this.pale[2], (on ? 235 : 140) * a);
    text(name, t.x + 6, t.y + 4);
    textSize(9);
    fill(this.pale[0], this.pale[1], this.pale[2], (on ? 170 : 110) * a);
    let count = this.pageCount(p) + "/" + this.pages[p].length;
    text(count, t.x + 6, t.y + 20);
    if (p === now) {
      // a glowing dot and the word, so the current period reads at a glance
      let cw = textWidth(count);
      fill(this.glow[0], this.glow[1], this.glow[2], 220 * a);
      circle(t.x + 6 + cw + 9, t.y + 24, 4);
      text("now", t.x + 6 + cw + 15, t.y + 20);
    }
  }
};

// one species written out: portrait, names, blurb and the read link. a locked one shows "?"
Panels.prototype.renderDetail = function (i, x, y, w, a) {
  if (i < 0) {
    this.body("Brush a creature with the line to add it to the log.", x, y + 8, w, 12, true, a);
    return;
  }
  let s = speciesList[i];
  let px = x + 30;
  let py = y + 40;
  let tx = x + 64;
  let tw = w - 64;
  if (!this.found[i]) {
    this.silhouette(i, px, py, 48, a);
    textFont(this.serif);
    textStyle(ITALIC);
    textAlign(LEFT, TOP);
    textSize(22);
    fill(this.pale[0], this.pale[1], this.pale[2], 200 * a);
    text("?", tx, y + 6);
    textStyle(NORMAL);
    this.body("Not found yet.", tx, y + 40, tw, 11, true, a);
    return;
  }
  this.portrait(i, px, py, 52, a);

  // latin name in italic serif, the common name after it in the species
  // colour, or on its own line when the two will not share one
  let lw = this.latin(s.latin, tx, y + 4, 15, a);
  let by = y + 26;
  if (this.commonName(s)) {
    textFont(this.sans);
    textSize(11);
    let cw = textWidth(this.commonName(s));
    fill(s.col[0], s.col[1], s.col[2], 220 * a);
    if (lw + 10 + cw <= tw) {
      text(this.commonName(s), tx + lw + 10, y + 8);
    } else {
      text(this.commonName(s), tx, y + 23);
      by = y + 38;
    }
  }

  // the blurb, clipped to the lines that fit above the link
  textFont(this.sans);
  textAlign(LEFT, TOP);
  textSize(11);
  fill(this.pale[0], this.pale[1], this.pale[2], 150 * a);
  text(s.blurb, tx, by, tw, y + 68 - by);

  this.readLink(i, tx, y + 70, false, a);
};

// the same on one line, for short screens: no blurb
Panels.prototype.renderDetailLine = function (i, x, y, w, a) {
  if (i < 0) {
    this.body("Brush a creature with the line to add it to the log.", x, y + 6, w, 11, true, a);
    return;
  }
  let s = speciesList[i];
  let tx = x + 34;
  if (!this.found[i]) {
    this.silhouette(i, x + 12, y + 14, 24, a);
    textFont(this.serif);
    textStyle(ITALIC);
    textAlign(LEFT, TOP);
    textSize(16);
    fill(this.pale[0], this.pale[1], this.pale[2], 200 * a);
    text("?", tx, y + 4);
    textStyle(NORMAL);
    this.body("Not found yet.", tx + 20, y + 8, w - 60, 11, true, a);
    return;
  }
  this.portrait(i, x + 12, y + 14, 24, a);
  let lw = this.latin(s.latin, tx, y + 5, 14, a);
  let linkW = this.readLink(i, x + w, y + 7, true, a);
  let room = x + w - (linkW > 0 ? linkW + 14 : 0) - (tx + lw + 10);
  if (this.commonName(s)) {
    textFont(this.sans);
    textAlign(LEFT, TOP);
    textSize(10);
    if (textWidth(this.commonName(s)) <= room) {
      fill(s.col[0], s.col[1], s.col[2], 220 * a);
      text(this.commonName(s), tx + lw + 10, y + 9);
    }
  }
};

// the latin name in italic serif. returns its width
Panels.prototype.latin = function (str, x, y, size, a) {
  textFont(this.serif);
  textStyle(ITALIC);
  textAlign(LEFT, TOP);
  textSize(size);
  fill(this.pale[0], this.pale[1], this.pale[2], 235 * a);
  text(str, x, y);
  let w = textWidth(str);
  textStyle(NORMAL);
  textFont(this.sans);
  return w;
};

// the common name in capitals, or "" when it only repeats the latin name
Panels.prototype.commonName = function (s) {
  if (!s.name) return "";
  if (s.name.toLowerCase() === s.latin.toLowerCase()) return "";
  return s.name.toUpperCase();
};

// the "Read about it on Wikipedia" link with an arrow. keeps its box for clicks, returns its width
Panels.prototype.readLink = function (i, x, y, rightAligned, a) {
  let s = speciesList[i];
  if (!s.url) return 0;
  let label = s.source ? "Read about it on " + s.source : "Read about it";
  textFont(this.sans);
  textAlign(LEFT, TOP);
  textSize(11);
  let tw = textWidth(label);
  let w = tw + 16; // text, a gap, the arrow
  let b = { x: rightAligned ? x - w : x, y: y - 2, w: w, h: 18, species: i };
  this.readBox = b;
  let hover = a > 0.5 && this.inBox(b);
  if (hover) {
    this.hot = true;
    this.hovering = true;
  }
  fill(this.glow[0], this.glow[1], this.glow[2], (hover ? 255 : 190) * a);
  text(label, b.x, y);
  stroke(this.glow[0], this.glow[1], this.glow[2], (hover ? 255 : 190) * a);
  strokeWeight(1.2);
  // the arrow: a diagonal up and to the right, with its head
  let ax = b.x + tw + 7;
  let ay = y + 3;
  line(ax, ay + 7, ax + 7, ay);
  line(ax + 2, ay, ax + 7, ay);
  line(ax + 7, ay, ax + 7, ay + 5);
  noStroke();
  return w;
};

// the help panel: how to steer and the keys
Panels.prototype.renderHelp = function (a) {
  let f = this.frame("help");
  let p = this.pad;
  this.panel(f, a);
  this.title("How to play", f.x + p, f.y + 11, 20, a);
  if (!this.shown.help) return;
  this.body("move the mouse to steer the lure", f.x + p, f.y + 50, f.w - 2 * p, 12, false, a);
  this.body("M sound   B back up   G guide   T clock", f.x + p, f.y + 70, f.w - 2 * p, 12, true, a);
};

// "New: Firefly squid" floats above the guide for a moment
Panels.prototype.renderToast = function () {
  if (this.toast === null) return;
  let age = millis() - this.toast.at;
  if (age > this.toastMs) {
    this.toast = null;
    return;
  }
  let a = min(1, (this.toastMs - age) / 500) * min(1, age / 200); // in fast, out gently
  a *= this.panelAlpha("guide"); // goes with the guide, so not over the surface
  if (a <= 0.01) return;
  let f = this.frame("guide");
  textFont(this.sans);
  textSize(13);
  let w = textWidth(this.toast.text) + 32;
  let x = f.x;
  let y = f.y - 44 - 6 * (1 - a);
  stroke(this.glow[0], this.glow[1], this.glow[2], 170 * a);
  strokeWeight(1);
  fill(this.ink[0], this.ink[1], this.ink[2], 210 * a);
  rect(x, y, w, 32, 16);
  noStroke();
  fill(this.glow[0], this.glow[1], this.glow[2], 240 * a);
  textAlign(LEFT, CENTER);
  text(this.toast.text, x + 16, y + 16);
};

///////////////////////////////////////////////////////////////////
// Input
// the Main section asks here first, and leaves the lure alone when we
// answer true.
///////////////////////////////////////////////////////////////////

// clicks on the start button, links, tabs, cells and headings. true when the click was used
Panels.prototype.mousePressed = function () {
  // the start button: one click turns the sound on and dives.
  // the click is what lets the browser start the audio
  if (sea.state === "surface" && this.startAlpha > 0.5 && this.inBox(this.boxes.start)) {
    if (!soundOn()) toggleSound();
    beginDive();
    return true;
  }

  // the new-log link, only while the surface text shows
  if (this.startAlpha > 0.5 && this.inBox(this.boxes.resetLink)) {
    this.resetUnlocks();
    return true;
  }

  // the clock's sound toggle
  if (this.shown.clock) {
    if (this.inBox(this.boxes.soundLink)) {
      if (typeof toggleSound === "function") toggleSound();
      return true;
    }
  }

  let names = ["guide", "help"];
  for (let i = 0; i < names.length; i++) {
    let n = names[i];
    if (this.panelAlpha(n) <= 0.5) continue; // not visible yet, so not clickable
    if (n === "guide" && this.shown.guide) {
      // the read-about link opens the page in a new tab, never here
      if (this.readBox !== null && this.inBox(this.readBox)) {
        let s = speciesList[this.readBox.species];
        if (s.url) window.open(s.url, "_blank", "noopener");
        return true;
      }
      for (let p = 0; p < this.pages.length; p++) {
        if (this.inBox(this.tabBox(p))) {
          // picking the page for the hour on the clock lets it follow the clock again
          this.tab = p;
          this.tabPinned = p !== this.periodNow();
          return true;
        }
      }
      let list = this.pages[this.tab];
      for (let k = 0; k < list.length; k++) {
        if (this.inBox(this.cellBox(k))) {
          this.selected = list[k];
          return true;
        }
      }
    }
    // the heading, including its round button, toggles the panel
    if (this.inBox(this.heading(n))) {
      this.toggle(n);
      return true;
    }
    if (this.inBox(this.frame(n))) return true; // on the panel body, swallow it
  }
  return false;
};

// G, T and I toggle the panels. unused keys return false so keyPressed() can use them
Panels.prototype.keyPressed = function (k) {
  if (k === "g") this.toggle("guide");
  else if (k === "t") this.toggle("clock");
  else if (k === "i") this.toggle("help");
  else return false;
  return true;
};

///////////////////////////////////////////////////////////////////
// Demo scrubber, only when demoTools is on
// A strip under the clock with the hour on a slider, for recording
// the demo video: drag it to see the sea at any time of day, then
// "follow the real time" lets it go. Opened by the "set the hour"
// link under the clock or the K key. While the hour is set by hand
// the clock says "(demo)".
//
// Everything about it lives in this section, which wraps the methods
// above so nothing up there has to know about it. The final build
// deletes this whole section (and sets demoTools false in the Main section);
// the sketch works without it. Reads demoTools from the Main section and calls
// tide.setHour(h), tide.setHour(null) and tide.isLive().
///////////////////////////////////////////////////////////////////

// defaults on the prototype, so the constructor above stays untouched.
// the first assignment gives each Panels its own copy
Panels.prototype.scrubOpen = false;
Panels.prototype.dragging = false;

// true when the demo tools are switched on in the Main section
Panels.prototype.demoOn = function () {
  return typeof demoTools !== "undefined" && demoTools === true;
};

// where the demo strip, its slider track and its follow button sit, under the clock
Panels.prototype.scrubBoxes = function () {
  let f = this.frame("clock");
  let strip = { x: f.x, y: f.y + f.h + 8, w: f.w, h: 112 };
  let track = { x: strip.x + this.pad + 8, y: strip.y + 40, w: strip.w - 2 * this.pad - 16, h: 24 };
  let follow = { x: strip.x + this.pad, y: strip.y + 76, w: 150, h: 26 };
  return { strip: strip, track: track, follow: follow };
};

// the "set the hour" link, to the left of the sound toggle
Panels.prototype.hourLinkBox = function () {
  let sl = this.boxes.soundLink;
  let on = typeof soundOn === "function" ? soundOn() : false;
  textFont(this.sans);
  textSize(11);
  let w = textWidth("set the hour");
  return { x: sl.x - (on ? 22 : 16) - w, y: sl.y, w: w, h: 16 };
};

// an outlined pill button, used for "follow the real time"
Panels.prototype.pill = function (b, label, a) {
  let hover = this.inBox(b);
  if (hover) this.hot = true;
  let r = b.h / 2;
  stroke(this.pale[0], this.pale[1], this.pale[2], (hover ? 160 : 90) * a);
  strokeWeight(1);
  fill(this.pale[0], this.pale[1], this.pale[2], (hover ? 36 : 12) * a);
  rect(b.x, b.y, b.w, b.h, r);
  noStroke();
  fill(this.pale[0], this.pale[1], this.pale[2], 225 * a);
  textFont(this.sans);
  textAlign(CENTER, CENTER);
  textSize(12);
  text(label, b.x + b.w / 2, b.y + b.h / 2);
};

// the slider follows the mouse while the button is held
Panels.prototype.updateDrag = function () {
  if (!this.dragging) return;
  if (!mouseIsPressed || !this.scrubOpen) {
    this.dragging = false;
    return;
  }
  let t = this.scrubBoxes().track;
  tide.setHour(constrain(map(mouseX, t.x, t.x + t.w, 0, 24), 0, 23.999));
};

// the demo strip: the hour, a slider with ticks every six hours, and the follow button
Panels.prototype.renderScrub = function () {
  let s = this.scrubBoxes();
  let p = this.pad;
  if (this.inBox(s.strip)) this.hovering = true;
  this.panel(s.strip, 1);
  this.controls(s.strip, "k", true, 1);

  // the hour being shown
  textFont(this.sans);
  textAlign(LEFT, TOP);
  textSize(11);
  fill(this.pale[0], this.pale[1], this.pale[2], 150);
  text("set the hour", s.strip.x + p, s.strip.y + 8);
  textFont(this.serif);
  textSize(18);
  fill(this.pale[0], this.pale[1], this.pale[2], 235);
  text(tide.clockText(), s.strip.x + p + 78, s.strip.y + 4);

  // the slider: a track with ticks every six hours and a glowing knob
  let t = s.track;
  let ty = t.y + t.h / 2;
  if (this.inBox(t)) this.hot = true;
  stroke(this.pale[0], this.pale[1], this.pale[2], 70);
  strokeWeight(2);
  line(t.x, ty, t.x + t.w, ty);
  strokeWeight(1);
  textFont(this.sans);
  textAlign(CENTER, TOP);
  textSize(9);
  for (let h = 0; h <= 24; h += 6) {
    let x = map(h, 0, 24, t.x, t.x + t.w);
    stroke(this.pale[0], this.pale[1], this.pale[2], 90);
    line(x, ty - 4, x, ty + 4);
    noStroke();
    fill(this.pale[0], this.pale[1], this.pale[2], 110);
    text(h, x, ty + 8);
  }
  let kx = map(tide.hour, 0, 24, t.x, t.x + t.w);
  noStroke();
  fill(this.glow[0], this.glow[1], this.glow[2], 60);
  circle(kx, ty, 22);
  fill(this.glow[0], this.glow[1], this.glow[2], this.dragging ? 255 : 220);
  circle(kx, ty, 11);

  // the way back to the clock
  this.pill(s.follow, "follow the real time", 1);
};

// "(demo)" beside the time while the hour is set by hand, and the "set the hour" link
Panels.prototype.renderDemoClock = function (a) {
  let b = this.boxes.clock;
  let right = b.x + b.w;
  if (!tide.isLive()) {
    textFont(this.serif);
    textStyle(NORMAL);
    textSize(40);
    let w = textWidth(tide.clockText());
    textFont(this.sans);
    textAlign(RIGHT, TOP);
    textSize(12);
    fill(this.glow[0], this.glow[1], this.glow[2], 200 * a);
    text("(demo)", right - w - 10, b.y + 12);
  }
  this.link(this.hourLinkBox(), "set the hour", a);
};

// the demo wrap: makes room in the help panel for the "K set the hour" line
let baseLayout = Panels.prototype.layout;
Panels.prototype.layout = function () {
  baseLayout.call(this);
  if (!this.demoOn()) return;
  this.boxes.help.h += 18; // room for the "K set the hour" line
  this.boxes.help.y -= 18;
};

// the demo wrap: draws the demo clock and the strip on top of the normal interface
let baseRender = Panels.prototype.render;
Panels.prototype.render = function () {
  if (this.demoOn()) this.updateDrag();
  baseRender.call(this);
  if (!this.demoOn()) return;
  push();
  textFont(this.sans);
  textStyle(NORMAL);
  if (this.shown.clock) this.renderDemoClock(1);
  if (this.scrubOpen) this.renderScrub();
  pop();
  this.updateCursor();
  if (this.scrubOpen && !this.hot) cursor(ARROW); // the strip is a thing to point at
};

// the demo wrap: adds the "K set the hour" line to the help
let baseRenderHelp = Panels.prototype.renderHelp;
Panels.prototype.renderHelp = function (a) {
  baseRenderHelp.call(this, a);
  if (!this.demoOn() || !this.shown.help) return;
  let f = this.frame("help");
  this.body("K set the hour", f.x + this.pad, f.y + 88, f.w - 2 * this.pad, 12, true, a);
};

// the demo wrap: clicks on the strip and the hour link, before the normal panels
let baseMousePressed = Panels.prototype.mousePressed;
Panels.prototype.mousePressed = function () {
  if (this.demoOn()) {
    // the strip, when it is open
    if (this.scrubOpen) {
      let s = this.scrubBoxes();
      if (this.inBox(this.buttonBox(s.strip))) {
        this.scrubOpen = false;
        return true;
      }
      if (this.inBox(s.follow)) {
        tide.setHour(null);
        this.scrubOpen = false;
        return true;
      }
      if (this.inBox(s.track)) {
        this.dragging = true;
        this.updateDrag();
        return true;
      }
      if (this.inBox(s.strip)) return true;
    }
    // the link under the clock
    if (this.shown.clock && this.inBox(this.hourLinkBox())) {
      this.scrubOpen = !this.scrubOpen;
      return true;
    }
  }
  return baseMousePressed.call(this);
};

// the demo wrap: K opens and closes the strip
let baseKeyPressed = Panels.prototype.keyPressed;
Panels.prototype.keyPressed = function (k) {
  if (this.demoOn() && k === "k") {
    this.scrubOpen = !this.scrubOpen;
    return true;
  }
  return baseKeyPressed.call(this, k);
};

///////////////////////////////////////////////////////////////////
// 10. MAIN
// The global state, setup(), the draw order, diving and the sound.
///////////////////////////////////////////////////////////////////

let tide;
let fline; // the fishing line (not "line", that is a p5 function)
let shoal;
let grid;
let sea;
let sound;
let ui;

let lastSeaState = ""; // sea.state last frame, to catch the moment we arrive under water
let lastMove = -1e9; // ms when the pointer last moved, for autopilot

// *** demo tools: the hour scrubber ("set the hour", K) we used to record
// the demo video. off in the submitted build
let demoTools = false;

let diveZone = 0.85; // *** the bottom of the screen below this fraction is the dive zone
let diveHoldMs = 1500; // *** how long to hold the lure there before diving
let diveSince = -1; // ms when the pointer entered the dive zone
let diveHold = 0; // 0 to 1, how far through the hold. the Interface section draws it as a ring

// makes the canvas, reads the clock, builds the grid and the sound, then the world
function setup() {
  createCanvas(windowWidth, windowHeight);

  tide = new Tide();
  tide.update();
  tide.migration = tide.target(); // start where the clock says, no fade in

  grid = new Grid(60); // *** keep >= the biggest neighbour distance in the Creatures section
  sound = new SoundEngine();
  buildWorld();
}

// builds everything that depends on the canvas size: the line, the sea, the panels, the shoal
function buildWorld() {
  // windowResized() calls this again if the canvas had no size when setup() ran (some
  // pages embed it that way), since everything would have been built in one corner
  fline = new FishingLine(width / 2, height * 0.42);
  sea = new Sea();
  ui = new Panels();
  shoal = new Shoal();
  shoal.populate();
}

// one frame: update the clock, sound and line, draw the world through the camera, then the panels
function draw() {
  background(3, 8, 18);

  tide.update();
  sea.update();
  sound.update();
  sound.setDepth(tide.migration);

  // who is steering the lure: the mouse, or the line drifting on its own.
  // on the surface the mouse lowers the lure into the water below the
  // boat; under water it steers it, and the autopilot takes over when
  // idle. while the camera is moving (diving or rising) the lure holds
  // still, otherwise the changing zoom would drag it through the water
  // and strike everything on the way
  if (sea.state === "surface") {
    fline.setTarget(mouseX, mouseY);
    if (lastSeaState !== "surface") fline.settle();
  } else if (sea.state === "under") {
    if (millis() - lastMove < 7000) fline.setTarget(mouseX, mouseY);
    else autopilot();
    // the first frame under water: put the lure where the pointer is
    // without a jump, or the jump itself would strike creatures
    if (lastSeaState !== "under") fline.settle();
  }
  lastSeaState = sea.state;
  fline.update();
  checkGestures();

  // the world, seen through the sea's camera: zoomed in above the water,
  // or settled under it. the else branch is a fallback for a sea with no camera
  push();
  if (sea.applyCamera) sea.applyCamera();
  else translate(0, -sea.cameraY);
  sea.renderSky();
  sea.renderWater();
  shoal.run(grid);
  sea.renderFog();
  fline.render();
  pop();

  ui.render();
}

let topEdgeSince = -1; // ms when the lure target first touched the top edge

// holding the pointer in the bottom band of the surface screen dives without turning the
// sound on. under water, holding the lure at the top edge for a second brings it back up
function checkGestures() {
  let inCanvas = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;

  if (sea.state === "surface" && inCanvas && mouseY > height * diveZone && !ui.hovering) {
    if (diveSince < 0) diveSince = millis();
    diveHold = constrain((millis() - diveSince) / diveHoldMs, 0, 1);
    if (diveHold >= 1) beginDive();
  } else {
    diveSince = -1;
    diveHold = 0;
  }

  if (sea.state === "under" && inCanvas && mouseY < height * 0.06 && millis() - lastMove < 7000) {
    if (topEdgeSince < 0) topEdgeSince = millis();
    // *** 1000 = ms to hold at the top edge
    else if (millis() - topEdgeSince > 1000) surfaceAgain();
  } else {
    topEdgeSince = -1;
  }
}

let autoX = -1; // the autopilot's own target, in screen coordinates
let autoY = -1;

// when nobody has moved the mouse for a while the line wanders on slow noise (week 5),
// so the piece keeps playing as an installation
function autopilot() {
  let t = millis() * 0.001;
  let tx = width * (0.5 + 0.8 * (noise(t * 0.07, 11) - 0.5));
  let ty = height * (0.2 + 0.65 * noise(t * 0.07 + 40, 22));
  if (autoX < 0) {
    autoX = mouseX;
    autoY = mouseY;
  }
  autoX = lerp(autoX, tx, 0.03);
  autoY = lerp(autoY, ty, 0.03);
  fline.setTarget(autoX, autoY);
}

// lowers the line. the start button and the hold at the bottom both call this
function beginDive() {
  if (sea.state !== "surface") return;
  sea.begin();
  diveSince = -1;
  diveHold = 0;
  lastMove = millis();
}

// the first press starts Tone.js and builds the synths, after that it mutes and unmutes
function toggleSound() {
  // browsers only let audio start from a click or a key press, so Tone.start() runs here
  if (!sound.ready) {
    Tone.start();
    sound.init();
    if (sound.muted) sound.toggleMute();
    return;
  }
  sound.toggleMute();
}

// true when sound is actually playing, for the toggle's label
function soundOn() {
  return sound.ready && !sound.muted;
}

// back up to the boat. the guide keeps what you have found
function surfaceAgain() {
  if (sea.state !== "under" || !sea.surface) return;
  sea.surface();
  topEdgeSince = -1;
}

///////////////////////////////////////////////////////////////////
// Input
///////////////////////////////////////////////////////////////////

// any mouse movement counts as someone playing, so the autopilot waits
function mouseMoved() {
  lastMove = millis();
  autoX = -1; // next autopilot starts from wherever the mouse left the lure
}

// a drag counts as playing too
function mouseDragged() {
  lastMove = millis();
}

// the panels get the click first, otherwise it just counts as playing
function mousePressed() {
  if (ui.mousePressed()) return; // the click was on a panel
  lastMove = millis();
}

// G, I and T go to the panels first, M toggles sound and B goes back up
function keyPressed() {
  // the keys are shown as capitals, so accept them with or without Shift
  let k = key.toLowerCase();
  if (ui.keyPressed(k)) return;
  if (k === "m") toggleSound();
  if (k === "b") surfaceAgain();
}

// keeps the canvas filling the window, rebuilding the world if it started with no size
function windowResized() {
  let wasEmpty = width < 2 || height < 2;
  resizeCanvas(windowWidth, windowHeight);
  if (wasEmpty && width > 1 && height > 1) buildWorld();
  else sea.resize();
}
