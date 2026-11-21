/* The Abyss Listens
 * Yandong, Leah, Sidney
 * DM3008 Generative Art 2026, Final Project
 *
 * WHAT IT IS
 *   Most animals in the open ocean make their own light. This is called
 *   bioluminescence, and they usually flash when something disturbs the
 *   water around them. In this piece you lower a fishing line into the
 *   dark sea. Whatever the lure brushes against lights up, plays a note
 *   and is added to a field guide.
 *
 *   The computer's real clock decides who is there. Every night, deep
 *   sea animals swim up toward the surface to feed and sink back down
 *   before dawn. This is the diel vertical migration. So by day the
 *   water is mostly empty and the sound is muffled, and at night it is
 *   full and bright. The day has four periods (morning, afternoon,
 *   evening, night), and each has its own 25 species, 100 in all.
 *
 * HOW TO INTERACT
 *   Start         click "Start" on the title screen. This turns the sound
 *                 on and sinks the camera through the surface
 *   mouse         under water, move the mouse to steer the lure. A slow
 *                 lure drifts past things. A fast one disturbs them:
 *                 schools scatter, plankton flare in a chain, jellies pulse
 *   field guide   every creature you strike is added to the guide.
 *                 Press G to open or close it
 *   help          press I to show or hide the help panel
 *   clock         press T to show or hide the clock
 *   sound         press M, or click the sound toggle under the clock
 *   back up       press B, or hold the lure at the top edge for a second,
 *                 to go back to the boat. The guide keeps what you found
 *   new log       "Start a new log" on the title screen clears the guide
 *                 for a new player
 *   Keys work with or without Shift. Left alone under water for 7
 *   seconds, the line drifts on its own, so the piece keeps playing as
 *   an installation.
 *
 *   An earlier version also let you steer with your hand, using the
 *   webcam and ml5.js handPose. We took it out because the camera added
 *   a visible lag to the lure and lowered the frame rate.
 *
 * CONTENTS
 *   1.  Species          the 100 species, 7 body plans and 4 periods
 *   2.  Grid             a spatial grid for finding neighbours quickly
 *   3.  Tide             the real clock turned into the daily migration
 *   4.  Fishing line     the line and its lure, a Verlet rope
 *   5.  Anatomy          how each creature is grown from a seed and drawn
 *   6.  Creatures        how creatures move, school, migrate and react
 *   7.  Sea              sky, sun and moon, surface, camera, water, fog
 *   8.  Sound            one Tone.js voice per body plan
 *   9.  Interface        title, clock, field guide, help, start screen
 *   10. Main             global state, setup(), draw(), diving and sound
 *   11. Input            mouse, keys and window size
 *
 *   Values worth changing are marked with three stars, like this: // ***
 */


///////////////////////////////////////////////////////////////////
// 1. SPECIES
// The full list of creatures. Every other part reads this table.
///////////////////////////////////////////////////////////////////

// A body plan is a template for how a creature is built, moves and
// sounds. A species is one named variety of a plan, with its own
// colour, size, depth, period of the day and description.
//
// Each period of the day has its own 25 species, so a player at any
// hour can find 25, and a player who comes back later finds others.
//   morning    05:00 to 11:00   pinks, golds, pale greens
//   afternoon  11:00 to 17:00   bright blues, greens, white
//   evening    17:00 to 22:00   amber, violet, copper
//   night      22:00 to 05:00   deep blues, reds, star white
//
// The rest of the sketch finds a species by its position in the list,
// so new species go at the end of a period's block, and the list is
// never reordered. Each entry has:
//   period   which part of the day it is alive
//   plan     which body plan, a position in bodyPlans
//   col      its glow colour as [red, green, blue]
//   size     1 is the plan's normal size. Bigger is slower, fewer and lower pitched
//   band     "shallow", "mid" or "deep": which third of the plan's depth range it uses
//   rarity   "common" (schools, or hundreds of plankton), "uncommon" (a few), "rare" (one or two)

// *** add a body plan here only together with a grow function in Anatomy
let bodyPlans = ["sparkle", "fish", "jelly", "seapen", "dragon", "squid", "eel"];

// *** the periods of the day and when each starts, in hours
let dayPeriods = ["morning", "afternoon", "evening", "night"];
let periodStarts = [5, 11, 17, 22];

// *** change a creature's colour, size, depth or story here
let speciesList = [
  // ---------- morning ----------
  { period: "morning", plan: 0, name: "Dawn sparkle", latin: "Lucerna aurorae", col: [255, 210, 225], size: 1, band: "shallow", rarity: "common", blurb: "Pale pink dust that wakes with the light." },
  { period: "morning", plan: 0, name: "Rose dust", latin: "Pulvis roseus", col: [255, 170, 190], size: 1.2, band: "mid", rarity: "common", blurb: "Slow and warm. Burns a moment longer than most." },
  { period: "morning", plan: 0, name: "Gold motes", latin: "Aurum minutum", col: [255, 225, 150], size: 0.8, band: "deep", rarity: "common", blurb: "Faint on its own, bright in a chain." },
  { period: "morning", plan: 1, name: "Dawn glassfish", latin: "Vitrea aurorae", col: [255, 190, 210], size: 0.85, band: "shallow", rarity: "common", blurb: "You can see straight through it, except for its lights." },
  { period: "morning", plan: 1, name: "Blue hatchet", latin: "Securis caerulea", col: [150, 200, 255], size: 0.8, band: "shallow", rarity: "common", blurb: "Flat silver bodies that glow the colour of the sky above." },
  { period: "morning", plan: 1, name: "Morning herring", latin: "Clupea matutina", col: [200, 230, 230], size: 0.9, band: "mid", rarity: "common", blurb: "Tight schools that turn as one." },
  { period: "morning", plan: 1, name: "Pink lantern", latin: "Diaphus roseus", col: [255, 160, 200], size: 1, band: "mid", rarity: "common", blurb: "A lanternfish in dawn colours. Pitched by depth." },
  { period: "morning", plan: 1, name: "Sunrise needle", latin: "Acus orta", col: [255, 210, 120], size: 1.3, band: "mid", rarity: "uncommon", blurb: "Long and gold. Hunts the first hour of light." },
  { period: "morning", plan: 1, name: "Pearl anchovy", latin: "Engraulis margarita", col: [235, 235, 245], size: 0.7, band: "shallow", rarity: "uncommon", blurb: "Tiny and quick. Flashes white when startled." },
  { period: "morning", plan: 2, name: "Moon jelly", latin: "Luna pellucida", col: [210, 225, 255], size: 1.3, band: "shallow", rarity: "uncommon", blurb: "Big, pale and patient. Barely minds the line." },
  { period: "morning", plan: 2, name: "Blush bell", latin: "Campana rubens", col: [255, 170, 200], size: 1, band: "mid", rarity: "uncommon", blurb: "A soft pink bell with a slow pulse." },
  { period: "morning", plan: 2, name: "Mist comb", latin: "Pecten nebulae", col: [220, 235, 240], size: 0.8, band: "deep", rarity: "uncommon", blurb: "Rows of tiny lights ripple down its sides." },
  { period: "morning", plan: 2, name: "Lace medusa", latin: "Medusa textilis", col: [255, 220, 235], size: 0.7, band: "mid", rarity: "rare", blurb: "Fine as lace. Easy to tear, so it stays away." },
  { period: "morning", plan: 3, name: "Frost fan", latin: "Flabellum gelidum", col: [170, 230, 255], size: 1.3, band: "deep", rarity: "uncommon", blurb: "Wide, cold and slow. Its light takes a long time to climb." },
  { period: "morning", plan: 3, name: "Coral quill", latin: "Penna corallina", col: [255, 150, 140], size: 1, band: "deep", rarity: "uncommon", blurb: "A red feather that blushes brighter when brushed." },
  { period: "morning", plan: 3, name: "Pale reed", latin: "Arundo pallida", col: [230, 240, 220], size: 0.7, band: "mid", rarity: "rare", blurb: "A thin pale stem that flares all at once." },
  { period: "morning", plan: 4, name: "Pale angler", latin: "Lampas pallida", col: [255, 240, 180], size: 1.2, band: "deep", rarity: "rare", blurb: "Fishes with a lamp of its own, and goes dark when you arrive." },
  { period: "morning", plan: 4, name: "Dawn viper", latin: "Vipera aurorae", col: [255, 180, 160], size: 0.9, band: "deep", rarity: "rare", blurb: "Fanged and patient, with a lure on a long spine." },
  { period: "morning", plan: 4, name: "Rosy lantern-eye", latin: "Oculus roseus", col: [255, 140, 170], size: 1, band: "mid", rarity: "rare", blurb: "A pink light under each eye that it can switch off." },
  { period: "morning", plan: 5, name: "Glass squid", latin: "Vitrum lolligo", col: [160, 240, 230], size: 1, band: "mid", rarity: "uncommon", blurb: "Nearly invisible until it panics, then the whole mantle lights." },
  { period: "morning", plan: 5, name: "Pink reef squid", latin: "Lolligo rosea", col: [255, 170, 210], size: 0.9, band: "shallow", rarity: "uncommon", blurb: "Ripples colour down its fins as it turns." },
  { period: "morning", plan: 5, name: "Morning dart", latin: "Sagitta matutina", col: [255, 220, 180], size: 0.7, band: "mid", rarity: "rare", blurb: "Small and fast. Jets away before you reach it." },
  { period: "morning", plan: 6, name: "Silver thread", latin: "Filum argenteum", col: [220, 230, 240], size: 0.7, band: "shallow", rarity: "uncommon", blurb: "Thin as a line itself. Easy to miss, quick to flash." },
  { period: "morning", plan: 6, name: "Dawn ribbon", latin: "Taenia aurorae", col: [255, 190, 180], size: 1, band: "mid", rarity: "uncommon", blurb: "A pink ribbon that swims in waves. The note bends as it passes." },
  { period: "morning", plan: 6, name: "Pearl eel", latin: "Anguilla margarita", col: [240, 240, 255], size: 1.3, band: "deep", rarity: "rare", blurb: "A long pale eel with the lowest note of the morning." },
  // ---------- afternoon ----------
  { period: "afternoon", plan: 0, name: "Sea sparkle", latin: "Lucerna minuta", col: [143, 220, 255], size: 1, band: "shallow", rarity: "common", blurb: "Tiny drifting lights. Touch one and the glow spreads." },
  { period: "afternoon", plan: 0, name: "Sun motes", latin: "Pulvis solis", col: [255, 240, 170], size: 1.1, band: "mid", rarity: "common", blurb: "Specks of daylight caught in the water." },
  { period: "afternoon", plan: 0, name: "Green fleck", latin: "Macula viridis", col: [170, 255, 190], size: 0.8, band: "deep", rarity: "common", blurb: "Green dust that drifts just out of the light." },
  { period: "afternoon", plan: 1, name: "Lanternfish", latin: "Diaphus errans", col: [95, 243, 216], size: 1, band: "mid", rarity: "common", blurb: "Schools that scatter from the line. Higher up, higher the note." },
  { period: "afternoon", plan: 1, name: "Noon needle", latin: "Acus meridiana", col: [255, 220, 120], size: 1.3, band: "mid", rarity: "uncommon", blurb: "Long and gold. Only hunts while the sun is high." },
  { period: "afternoon", plan: 1, name: "Daylight bristlemouth", latin: "Cyclothone diei", col: [170, 150, 230], size: 0.7, band: "deep", rarity: "common", blurb: "The most numerous fish on Earth, and almost nobody has seen one." },
  { period: "afternoon", plan: 1, name: "Azure sardine", latin: "Sardina azurea", col: [120, 200, 255], size: 0.9, band: "shallow", rarity: "common", blurb: "Quick and nervous. The first to flee and the first back." },
  { period: "afternoon", plan: 1, name: "Mirror scad", latin: "Speculum natans", col: [230, 240, 250], size: 1, band: "shallow", rarity: "common", blurb: "Flashes the sky back at you." },
  { period: "afternoon", plan: 1, name: "Jade minnow", latin: "Jaspis parva", col: [140, 255, 200], size: 0.7, band: "mid", rarity: "uncommon", blurb: "Tiny green schools that hide in the shafts of light." },
  { period: "afternoon", plan: 2, name: "Sun bell", latin: "Campana solis", col: [255, 200, 90], size: 1.1, band: "shallow", rarity: "uncommon", blurb: "Follows the daylight down and up again." },
  { period: "afternoon", plan: 2, name: "Sky medusa", latin: "Medusa caeli", col: [150, 210, 255], size: 1, band: "mid", rarity: "uncommon", blurb: "Blue bell, blue lights. Hard to see against the day." },
  { period: "afternoon", plan: 2, name: "Crystal comb", latin: "Pecten crystallinus", col: [220, 250, 255], size: 0.8, band: "mid", rarity: "uncommon", blurb: "Clear as glass, with rainbow rows of beating hairs." },
  { period: "afternoon", plan: 2, name: "White drifter", latin: "Vagans alba", col: [245, 245, 245], size: 1.4, band: "deep", rarity: "rare", blurb: "Huge and slow. One pulse a minute." },
  { period: "afternoon", plan: 3, name: "Sea pen", latin: "Penna abyssi", col: [255, 200, 120], size: 1, band: "deep", rarity: "uncommon", blurb: "A colony that grows like a feather. Brush it and the light runs up the stem." },
  { period: "afternoon", plan: 3, name: "Kelp quill", latin: "Penna algae", col: [150, 230, 150], size: 1.2, band: "mid", rarity: "uncommon", blurb: "Green fronds that sway with the schools." },
  { period: "afternoon", plan: 3, name: "Emerald fan", latin: "Flabellum smaragdinum", col: [90, 230, 170], size: 0.8, band: "deep", rarity: "rare", blurb: "A small bright fan that holds its light a long time." },
  { period: "afternoon", plan: 4, name: "Viperfish", latin: "Vipera lucis", col: [120, 255, 200], size: 0.9, band: "deep", rarity: "rare", blurb: "A fanged hunter with a lure on a long spine. Patient." },
  { period: "afternoon", plan: 4, name: "Noon angler", latin: "Lampas meridiana", col: [255, 235, 150], size: 1.2, band: "deep", rarity: "rare", blurb: "Keeps its lamp on even in daylight, just in case." },
  { period: "afternoon", plan: 4, name: "Glass dragon", latin: "Draco vitreus", col: [200, 240, 255], size: 1, band: "mid", rarity: "rare", blurb: "Almost clear. Only the beam gives it away." },
  { period: "afternoon", plan: 5, name: "Reef squid", latin: "Lolligo scopuli", col: [180, 255, 220], size: 1, band: "shallow", rarity: "uncommon", blurb: "Hangs in a row with its friends, then scatters." },
  { period: "afternoon", plan: 5, name: "Sky squid", latin: "Lolligo caeli", col: [140, 200, 255], size: 0.9, band: "mid", rarity: "uncommon", blurb: "Blue on blue. Flashes white when the line comes near." },
  { period: "afternoon", plan: 5, name: "Day dart", latin: "Sagitta diei", col: [255, 250, 200], size: 0.7, band: "mid", rarity: "rare", blurb: "Small and fast. Jets away before you reach it." },
  { period: "afternoon", plan: 6, name: "Ribbon eel", latin: "Taenia marina", col: [120, 255, 160], size: 1, band: "mid", rarity: "uncommon", blurb: "A green ribbon that swims in waves. The note bends as it passes." },
  { period: "afternoon", plan: 6, name: "Jade eel", latin: "Anguilla jaspis", col: [100, 220, 180], size: 1.2, band: "deep", rarity: "uncommon", blurb: "Darker and slower than the ribbon. A longer bend." },
  { period: "afternoon", plan: 6, name: "Gulper", latin: "Faux inflata", col: [90, 110, 200], size: 1.5, band: "deep", rarity: "rare", blurb: "Mostly mouth. Slow, deep and heavy, with the lowest note of all." },
  // ---------- evening ----------
  { period: "evening", plan: 0, name: "Ember dust", latin: "Cinis rubra", col: [255, 170, 110], size: 1.2, band: "mid", rarity: "common", blurb: "Warm and slow. Burns a moment longer." },
  { period: "evening", plan: 0, name: "Dusk motes", latin: "Pulvis vesperis", col: [255, 200, 160], size: 1, band: "shallow", rarity: "common", blurb: "Orange specks that catch the last light." },
  { period: "evening", plan: 0, name: "Copper glint", latin: "Cuprum micans", col: [230, 150, 90], size: 0.8, band: "deep", rarity: "common", blurb: "Deep copper dust. Faint until a chain reaches it." },
  { period: "evening", plan: 1, name: "Dusk sardine", latin: "Sardina vesperis", col: [180, 230, 200], size: 0.9, band: "shallow", rarity: "common", blurb: "Quick and nervous. The first to flee and the first back." },
  { period: "evening", plan: 1, name: "Amber lantern", latin: "Diaphus ambra", col: [255, 190, 100], size: 1, band: "mid", rarity: "common", blurb: "A lanternfish in sunset colours. Pitched by depth." },
  { period: "evening", plan: 1, name: "Violet hatchet", latin: "Securis violacea", col: [200, 160, 255], size: 0.8, band: "shallow", rarity: "common", blurb: "Flat bodies that glow violet as the sky does." },
  { period: "evening", plan: 1, name: "Sunset scad", latin: "Occasus natans", col: [255, 150, 110], size: 1, band: "mid", rarity: "common", blurb: "Schools that turn orange, then grey, as the light goes." },
  { period: "evening", plan: 1, name: "Twilight needle", latin: "Acus crepusculi", col: [255, 160, 140], size: 1.3, band: "mid", rarity: "uncommon", blurb: "Long and rust red. Hunts the hour after sunset." },
  { period: "evening", plan: 1, name: "Rust anchovy", latin: "Engraulis ferrugo", col: [230, 130, 90], size: 0.7, band: "shallow", rarity: "uncommon", blurb: "Tiny and quick. Flashes copper when startled." },
  { period: "evening", plan: 2, name: "Alarm jelly", latin: "Campana tremula", col: [160, 150, 255], size: 1, band: "mid", rarity: "uncommon", blurb: "Slow pulsing bells with a ring of lights. Deep, slow tones." },
  { period: "evening", plan: 2, name: "Amber bell", latin: "Campana ambra", col: [255, 200, 110], size: 1.1, band: "shallow", rarity: "uncommon", blurb: "Glows like a lamp in a window." },
  { period: "evening", plan: 2, name: "Violet comb", latin: "Pecten violaceus", col: [190, 140, 255], size: 0.8, band: "deep", rarity: "uncommon", blurb: "Rows of violet lights ripple down its sides." },
  { period: "evening", plan: 2, name: "Dusk medusa", latin: "Medusa vesperis", col: [255, 140, 120], size: 0.7, band: "mid", rarity: "rare", blurb: "A small red bell that only climbs as the light goes." },
  { period: "evening", plan: 3, name: "Ember whip", latin: "Flagellum igneum", col: [255, 130, 80], size: 0.7, band: "mid", rarity: "rare", blurb: "A thin hot thread that flares all at once." },
  { period: "evening", plan: 3, name: "Copper quill", latin: "Penna cuprea", col: [230, 160, 100], size: 1, band: "deep", rarity: "uncommon", blurb: "A copper feather. The light climbs it slowly." },
  { period: "evening", plan: 3, name: "Dusk fan", latin: "Flabellum vesperis", col: [200, 140, 200], size: 1.3, band: "deep", rarity: "uncommon", blurb: "Wide and violet. Holds its light a long time." },
  { period: "evening", plan: 4, name: "Twilight dragon", latin: "Draco crepusculi", col: [255, 120, 100], size: 1, band: "deep", rarity: "rare", blurb: "Rises with the dusk, red beam first." },
  { period: "evening", plan: 4, name: "Amber angler", latin: "Lampas ambra", col: [255, 200, 120], size: 1.2, band: "deep", rarity: "rare", blurb: "An orange lamp on a spine, swinging slowly." },
  { period: "evening", plan: 4, name: "Copper viper", latin: "Vipera cuprea", col: [230, 150, 110], size: 0.9, band: "deep", rarity: "rare", blurb: "Fanged and patient, in sunset colours." },
  { period: "evening", plan: 5, name: "Sunset squid", latin: "Lolligo occasus", col: [255, 170, 130], size: 1, band: "mid", rarity: "uncommon", blurb: "Ripples orange down its fins as it turns." },
  { period: "evening", plan: 5, name: "Violet dart", latin: "Sagitta violacea", col: [200, 150, 255], size: 0.7, band: "mid", rarity: "rare", blurb: "Small and fast. Jets away before you reach it." },
  { period: "evening", plan: 5, name: "Ember squid", latin: "Lolligo ignea", col: [255, 140, 90], size: 0.9, band: "shallow", rarity: "uncommon", blurb: "Flashes the whole mantle red when startled." },
  { period: "evening", plan: 6, name: "Dusk ribbon", latin: "Taenia vesperis", col: [255, 180, 150], size: 1, band: "mid", rarity: "uncommon", blurb: "An orange ribbon that swims in waves. The note bends as it passes." },
  { period: "evening", plan: 6, name: "Amber eel", latin: "Anguilla ambra", col: [240, 190, 120], size: 1.2, band: "deep", rarity: "uncommon", blurb: "Darker and slower. A longer bend." },
  { period: "evening", plan: 6, name: "Violet thread", latin: "Filum violaceum", col: [210, 170, 255], size: 0.7, band: "shallow", rarity: "rare", blurb: "Thin as a line itself. Easy to miss, quick to flash." },
  // ---------- night ----------
  { period: "night", plan: 0, name: "Rainbow drift", latin: "Pulvis iridis", col: [200, 160, 255], size: 0.8, band: "deep", rarity: "common", blurb: "The deepest dust. Faint on its own, bright in a chain." },
  { period: "night", plan: 0, name: "Midnight sparkle", latin: "Lucerna noctis", col: [120, 200, 255], size: 1, band: "shallow", rarity: "common", blurb: "Blue dust that fills the dark water." },
  { period: "night", plan: 0, name: "Blue ash", latin: "Cinis caerulea", col: [150, 170, 255], size: 1.2, band: "mid", rarity: "common", blurb: "Slow blue flakes. Burn a moment longer." },
  { period: "night", plan: 1, name: "Midnight bristlemouth", latin: "Cyclothone noctis", col: [170, 150, 230], size: 0.7, band: "deep", rarity: "common", blurb: "The most numerous fish on Earth, up for the night." },
  { period: "night", plan: 1, name: "Night lantern", latin: "Diaphus noctis", col: [95, 243, 216], size: 1, band: "mid", rarity: "common", blurb: "Schools that scatter from the line. Higher up, higher the note." },
  { period: "night", plan: 1, name: "Star hatchet", latin: "Securis stellata", col: [220, 230, 255], size: 0.8, band: "shallow", rarity: "common", blurb: "Flat bodies that glow like the stars above." },
  { period: "night", plan: 1, name: "Deep sardine", latin: "Sardina profunda", col: [120, 180, 230], size: 0.9, band: "mid", rarity: "common", blurb: "Quick and nervous. The first to flee and the first back." },
  { period: "night", plan: 1, name: "Ghost needle", latin: "Acus larva", col: [230, 240, 255], size: 1.3, band: "mid", rarity: "uncommon", blurb: "Long and pale. Hunts in the dark hours." },
  { period: "night", plan: 1, name: "Ink minnow", latin: "Atramentum parvum", col: [90, 110, 200], size: 0.7, band: "deep", rarity: "uncommon", blurb: "So dark it is only its lights." },
  { period: "night", plan: 2, name: "Crimson comb", latin: "Pecten ruber", col: [255, 90, 130], size: 0.7, band: "deep", rarity: "rare", blurb: "A small red bell that only climbs in the dark." },
  { period: "night", plan: 2, name: "Night bell", latin: "Campana noctis", col: [130, 150, 255], size: 1, band: "mid", rarity: "uncommon", blurb: "Blue bell, blue ring of lights. Deep, slow tones." },
  { period: "night", plan: 2, name: "Star medusa", latin: "Medusa stellata", col: [230, 235, 255], size: 1.1, band: "shallow", rarity: "uncommon", blurb: "Pale and patient, with lights like a constellation." },
  { period: "night", plan: 2, name: "Black drifter", latin: "Vagans atra", col: [120, 100, 180], size: 1.4, band: "deep", rarity: "uncommon", blurb: "Huge and slow. One pulse a minute." },
  { period: "night", plan: 3, name: "Night quill", latin: "Penna noctis", col: [150, 170, 255], size: 1, band: "deep", rarity: "uncommon", blurb: "A blue feather. Brush it and the light runs up the stem." },
  { period: "night", plan: 3, name: "Blue fan", latin: "Flabellum caeruleum", col: [110, 200, 255], size: 1.3, band: "deep", rarity: "uncommon", blurb: "Wide, cold and slow. Its light takes a long time to climb." },
  { period: "night", plan: 3, name: "Shadow reed", latin: "Arundo umbrae", col: [170, 140, 220], size: 0.7, band: "mid", rarity: "rare", blurb: "A thin violet stem that flares all at once." },
  { period: "night", plan: 4, name: "Stoplight dragon", latin: "Draco signalis", col: [255, 77, 94], size: 1, band: "deep", rarity: "rare", blurb: "Rare red light that almost nothing else can see." },
  { period: "night", plan: 4, name: "Black angler", latin: "Lampas atra", col: [200, 210, 255], size: 1.2, band: "deep", rarity: "rare", blurb: "A white lamp on a spine, and nothing else to see." },
  { period: "night", plan: 4, name: "Midnight viper", latin: "Vipera noctis", col: [120, 255, 200], size: 0.9, band: "deep", rarity: "rare", blurb: "Fanged and patient, with a lure on a long spine." },
  { period: "night", plan: 5, name: "Firefly squid", latin: "Ignis lolligo", col: [80, 180, 255], size: 0.8, band: "mid", rarity: "uncommon", blurb: "Hundreds of blue lights down its arms." },
  { period: "night", plan: 5, name: "Vampire squid", latin: "Umbra lolligo", col: [200, 60, 80], size: 1.3, band: "deep", rarity: "rare", blurb: "Dark red and unhurried. Turns itself inside out when startled." },
  { period: "night", plan: 5, name: "Night dart", latin: "Sagitta noctis", col: [180, 220, 255], size: 0.7, band: "mid", rarity: "uncommon", blurb: "Small and fast. Jets away before you reach it." },
  { period: "night", plan: 6, name: "Night ribbon", latin: "Taenia noctis", col: [190, 120, 255], size: 1.2, band: "deep", rarity: "uncommon", blurb: "A long violet ribbon that rises after dark." },
  { period: "night", plan: 6, name: "Abyss eel", latin: "Anguilla abyssi", col: [90, 110, 200], size: 1.5, band: "deep", rarity: "rare", blurb: "Mostly mouth. Slow, deep and heavy, with the lowest note of all." },
  { period: "night", plan: 6, name: "Shadow thread", latin: "Filum umbrae", col: [160, 170, 230], size: 0.7, band: "shallow", rarity: "uncommon", blurb: "Thin as a line itself. Easy to miss, quick to flash." }
];

// Which period an hour (0 to 24) falls in.
function periodOf(hour) {
  let p = dayPeriods[dayPeriods.length - 1]; // before the first start it is still night
  for (let i = 0; i < periodStarts.length; i++) {
    if (hour >= periodStarts[i]) p = dayPeriods[i];
  }
  return p;
}

// The species of one period, in table order. The field guide uses
// this for its four pages.
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

// A boid is one creature in a flock (autonomous agents, week 6).
// The grid splits the canvas into square cells so each boid only checks the
// boids in its own cell and the 8 cells around it, instead of every
// boid on the canvas (n x n checks gets slow past ~200 boids).
//
// Based on "bin-lattice spatial subdivision" from The Nature of Code
// ch.5 (Daniel Shiffman) and Craig Reynolds' "Interaction with
// Groups of Autonomous Characters" (2000). Our own implementation,
// first written for our earlier haze project.

function Grid(cellSize) {
  // cell size should be the same as the biggest neighbour distance,
  // otherwise boids can miss neighbours that are two cells away
  this.cellSize = cellSize;
  this.cells = {};
}

// Empties the grid. Called every frame since the boids keep moving.
Grid.prototype.clear = function () {
  this.cells = {};
};

// Turns a column and row into a key like "4,7".
Grid.prototype.key = function (col, row) {
  return col + "," + row;
};

// Drops a boid into the cell it is currently in.
Grid.prototype.insert = function (boid) {
  let col = floor(boid.position.x / this.cellSize);
  let row = floor(boid.position.y / this.cellSize);
  let k = this.key(col, row);

  if (this.cells[k] === undefined) {
    this.cells[k] = [];
  }
  this.cells[k].push(boid);
};

// Returns all boids in the 3 x 3 block of cells around a position.
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
// back down before dawn. Here the computer's clock drives it.
//
// The Tide reads the real time and turns it into one number,
// migration, which everything else reads: 1 at midnight (creatures
// risen), 0 at noon (creatures deep). It changes slowly, so it never
// jumps.

function Tide() {
  this.hour = 0; // 0 to 24, with minutes as a fraction
  this.migration = 1; // eased, 0 (noon) to 1 (midnight)
}

// Called once a frame. Reads the clock, then moves the migration 1%
// of the way toward where it should be.
Tide.prototype.update = function () {
  let d = new Date();
  this.hour = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;

  let target = this.target();
  this.migration = lerp(this.migration, target, 0.01); // *** how slowly the water changes
};

// Where the migration should be at this hour. A cosine wave (waves,
// week 4) gives 1 at midnight and 0 at noon. A smoothstep curve then
// flattens both ends, so day and night stay steady and dusk and dawn
// are short, gentle changes.
Tide.prototype.target = function () {
  let m = 0.5 + 0.5 * cos((this.hour / 24) * TWO_PI); // 1 at midnight, 0 at noon
  return m * m * (3 - 2 * m); // smoothstep, so dusk and dawn are gentle
};

// The time as text, like "23:41".
Tide.prototype.clockText = function () {
  let h = floor(this.hour) % 24;
  let m = floor((this.hour % 1) * 60);
  return nf(h, 2) + ":" + nf(m, 2);
};

// One line about what the creatures are doing at this hour.
Tide.prototype.phaseText = function () {
  let m = this.target();
  if (m > 0.7) return "Night. The creatures have risen to feed.";
  if (m < 0.3) return "Day. Most creatures are sheltering in the deep.";
  if (this.hour >= 12) return "Dusk. The migration is rising toward you.";
  return "Dawn. The migration is sinking back down.";
};

// Where a creature wants to be in the water right now. It has a
// preferred band (0 shallow to 1 deep) and two depth ranges, one for
// day and one for night, as fractions of the canvas height. The
// migration blends between them. Depths past 1 are below the screen.
Tide.prototype.depthFor = function (pref, dayRange, nightRange) {
  let day = height * lerp(dayRange[0], dayRange[1], pref);
  let night = height * lerp(nightRange[0], nightRange[1], pref);
  return lerp(day, night, this.migration);
};


///////////////////////////////////////////////////////////////////
// 4. FISHING LINE
// The line hanging from the boat, and the lure at its end.
///////////////////////////////////////////////////////////////////

// The line hangs from the surface and the lure follows the mouse.
// Whatever the lure brushes against lights up and makes a sound.
//
// The line is a rope made of 26 points held together by distance
// constraints. Each frame the points move on their own momentum,
// then are pulled back to a fixed gap from their neighbours. This
// method is called Verlet integration. It is cheap and very stable,
// and it makes the line bend and trail like real line in water.
//
// Call setTarget() with where the lure should go, update() once a
// frame, and render() after the creatures. Creatures use nearest()
// to find how close the line is, and speed to know if it is moving.

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

// Where the lure should go, in screen pixels. The mouse and the
// autopilot both call this. The sea's camera may be zoomed or above
// the water, so the point is turned into world coordinates first.
FishingLine.prototype.setTarget = function (x, y) {
  let w = sea.toWorld(x, y);
  this.tx = w.x;
  this.ty = w.y;
};

// Jump the lure straight to its target with no speed, so nothing
// counts the jump as a strike. Used each time the camera comes to rest.
FishingLine.prototype.settle = function () {
  this.lx = this.tx;
  this.ly = constrain(this.ty, 24, height - 8);
  this.speed = 0;
};

// Moves the line one step. The lure eases toward its target; the
// top of the line follows much more slowly, like a drifting boat.
// "speed" is how far the lure moved, which decides if it disturbs
// the creatures. Then comes the Verlet step and the distance
// constraints that hold the rope together.
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

// The closest point on the line to (x, y). Returns { d, x, y }, where
// d is the distance. A quick box test first: if the point is far
// from the whole line, it returns Infinity at once, so most creatures
// skip the slower check of all 25 segments.
FishingLine.prototype.nearest = function (x, y, pad) {
  if (pad === undefined) pad = 90;
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

// Called by a creature when the line strikes it, so the lure flares.
FishingLine.prototype.strike = function () {
  this.lit = 1;
};

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

// Smooth curve through the rope points.
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

// Nothing in this section moves. The Creatures section decides where
// a creature is and how it behaves, then asks its Body to draw itself.
//
// A creature is a species on a body plan. The plan says how it is
// built, the species gives its colour and size. Its kind comes from
// its name: a word in the name (hatchet, needle, comb, fan, angler,
// dart, thread...) picks a look from planKinds, a hash of the name
// gives the species its own narrow slice of every gene range, and a
// few named species get a hand-tuned override in speciesLook. So the
// 100 species need no 100 rows of tuning.
//
// Every body is then grown from one seed with techniques from class,
// so no two look the same, but they all cost about the same to draw:
//   noise (week 5)       the body outline, an ellipse wobbled by noise
//   L-systems (week 10)  jelly tentacles and sea pen fronds
//   recursion (week 9)   branching fin rays, lure antlers and squid arms
//   waves (week 4)       fins, bells and the eel's body move with sin()
//   modulo (week 3)      which segments carry a light, stripe patterns
// The parts that never change are drawn once into a small off-screen
// image (a sprite) when the creature is born. After that, each frame
// is one image() plus the parts that move or glow.
//
// References
//   Reading noise around a circle so an outline joins up without a
//   seam: Daniel Shiffman, The Coding Train, "Polar Perlin Noise Loops".
//   The plant rule F -> F[+F]F[-F]F and the bracket turtle:
//   Prusinkiewicz and Lindenmayer, The Algorithmic Beauty of Plants (1990).

///////////////////////////////////////////////////////////////////
// Plans and genes
// The range each measurement can take, for each body plan.
///////////////////////////////////////////////////////////////////

// A gene here is one measurement, like a fish's length or a jelly's
// number of tentacles, given as a [lowest, highest] range. Each
// creature picks one value inside each range. Angles are in degrees,
// lengths in pixels at size 1. The plans that grow an L-system also
// keep their rule set here.

let planRadius = [3, 7, 30, 40, 20, 16, 14]; // *** collision radius of each plan at size 1

// *** the seed picks one value inside each range, widen a range for more variety
let planGenes = [
  // 0 - sparkle: only a size and a twinkle speed, hundreds share one halo sprite per species
  { size: [2, 3.6], twinkle: [0.04, 0.12] },
  // 1 - fish: streamlined, a light on every 1st or 2nd belly segment
  { length: [22, 30], height: [0.3, 0.42], wobble: [0.08, 0.2], segments: 8, lightEvery: [1, 2], stripeEvery: [2, 3], eye: [2.2, 3.2], tail: [5, 8], flick: [0.25, 0.4] },
  // 2 - jelly: a dome with tentacles grown from the plant rule
  { bell: [44, 62], dome: [0.55, 0.8], wobble: [0.05, 0.14], scallops: [6, 10], tentacles: [4, 8], rimLights: [8, 14], length: [60, 115], angle: [6, 22], gens: [2, 3], breathe: [0.03, 0.06],
    lsystem: { axiom: "F", rules: { F: "F[+F]F[-F]F" } } },
  // 3 - sea pen: each generation adds two stem steps (G) and a pair of pinnae,
  //     and every pinna already there grows one step before its polyp light (L)
  { stem: [58, 78], stalk: [16, 26], gens: [3, 4], angle: [35, 65], step: [5, 8], weight: [2, 3.2], sway: [0.02, 0.04],
    lsystem: { axiom: "A", rules: { A: "G[+FL][-FL]G[+FL][-FL]A", L: "FL" } } },
  // 4 - dragon: long and dark, an antler lure and a beam
  { length: [100, 130], height: [0.13, 0.18], wobble: [0.06, 0.14], segments: 14, lightEvery: [2, 3], antlerDepth: [3, 4], antlerAngle: [20, 40], antlerLen: [9, 13], rayDepth: [2, 3], beam: [70, 100], flick: [0.12, 0.2], fangs: 4 },
  // 5 - squid: a soft mantle, a skirt of short arms, two long ones that trail
  { mantle: [28, 38], height: [0.36, 0.46], wobble: [0.06, 0.14], segments: 10, lightEvery: [2, 3], arms: [6, 8], armLen: [9, 13], armDepth: [1, 2], longArm: [1, 1.4], fin: [0.3, 0.42], ripple: [0.08, 0.14] },
  // 6 - eel: a ribbon of segments that rides a travelling sine wave
  { length: [60, 90], thick: [5, 8], segments: 16, lightEvery: [2, 3], amp: [6, 10], freq: [0.08, 0.13], waves: [1.1, 1.5], head: [9, 13], wobble: [0.08, 0.16] }
];

///////////////////////////////////////////////////////////////////
// Kinds and overrides
// Words in a species' name that change its look.
///////////////////////////////////////////////////////////////////

// planKinds lists, for each plan, words and the changes they bring.
// Every word found in a species' name adds its changes, in list
// order. A range here replaces the plan's range of the same name; a
// true/false flag turns on a detail in the grow function.
// speciesLook holds the few species that need a specific look, by
// name, and wins over the kinds. A species that matches no word keeps
// the plan as it is, varied only by its own slice of each range.

// *** give a word in a name a look here
let planKinds = [
  // plan 0 - sparkle
  [
    { word: "dust", tweak: { halo: 1.5, size: [2.4, 4] } }, // a bigger, warmer glow
    { word: "ash", tweak: { halo: 1.5, size: [2.4, 4] } },
    { word: "rainbow", tweak: { shimmer: true, halo: 0.8 } }, // each one a slightly different tint
    { word: "mote", tweak: { size: [1.6, 2.6], twinkle: [0.1, 0.18] } }, // small and quick
    { word: "fleck", tweak: { size: [1.6, 2.6], twinkle: [0.1, 0.18] } },
    { word: "glint", tweak: { size: [1.4, 2.4], twinkle: [0.16, 0.26] } }
  ],
  // plan 1 - fish
  [
    { word: "hatchet", tweak: { length: [16, 22], height: [0.6, 0.75], lightEvery: [1, 1], eye: [3, 3.8] } }, // tall and flat, lights all along
    { word: "needle", tweak: { length: [34, 44], height: [0.15, 0.2], lightEvery: [3, 3], snout: true, stripeEvery: [3, 3] } }, // long, a beak
    { word: "bristlemouth", tweak: { height: [0.22, 0.28], lightEvery: [1, 1], rows: 2, bigMouth: true } }, // two rows of lights, a wide jaw
    { word: "sardine", tweak: { height: [0.24, 0.3], lightEvery: [2, 3], silver: true } }, // plain silver, few lights
    { word: "anchovy", tweak: { length: [14, 20], height: [0.26, 0.32], lightEvery: [3, 3], silver: true } }, // tiny
    { word: "minnow", tweak: { length: [14, 20], height: [0.3, 0.38], eye: [3, 3.6], stripeEvery: [2, 2] } }, // tiny, big-eyed
    { word: "scad", tweak: { height: [0.34, 0.4], silver: true, tail: [7, 9] } }, // deep silver flank, forked tail
    { word: "herring", tweak: { height: [0.28, 0.34], lightEvery: [2, 2], silver: true, tail: [7, 9] } },
    { word: "glass", tweak: { glass: true, lightEvery: [2, 2] } }, // see-through
    { word: "ink", tweak: { ink: true, lightEvery: [1, 1] } } // only its lights
  ],
  // plan 2 - jelly
  [
    { word: "moon", tweak: { dome: [0.42, 0.55], tentacles: [14, 20], length: [18, 34], gens: [1, 1], rimLights: [16, 22], rings: true } }, // flat, a short fringe, four rings
    { word: "comb", tweak: { dome: [0.95, 1.2], bell: [36, 48], scallops: [4, 6], tentacles: [2, 2], gens: [2, 2], combs: true } }, // tall, rows of lights down the bell
    { word: "bell", tweak: { rays: true, rimLights: [12, 18], tentacles: [6, 10], gens: [2, 2], length: [50, 80] } }, // a canal to every scallop
    { word: "medusa", tweak: { tentacles: [3, 5], gens: [3, 3], length: [90, 130], angle: [14, 24], dome: [0.7, 0.9] } }, // few long frilly tentacles
    { word: "drifter", tweak: { bell: [56, 64], dome: [0.5, 0.65], tentacles: [10, 14], gens: [1, 1], length: [30, 50], breathe: [0.012, 0.018], rimLights: [6, 8] } }, // huge and slow
    { word: "lace", tweak: { tentacles: [10, 16], gens: [2, 2], angle: [20, 30], length: [40, 60], bell: [40, 50] } }, // a fine fringe
    { word: "star", tweak: { stars: true, rimLights: [14, 20] } } // lights scattered over the bell like a constellation
  ],
  // plan 3 - sea pen
  [
    { word: "fan", tweak: { angle: [70, 88], gens: [4, 4], step: [6, 9], weight: [2.5, 3.5] } }, // a wide fan
    { word: "whip", tweak: { angle: [12, 24], gens: [2, 3], step: [4, 6], stem: [70, 90], weight: [1.2, 1.8], flare: true } }, // thin, lights all at once
    { word: "reed", tweak: { angle: [12, 24], gens: [2, 3], step: [4, 6], stem: [70, 90], weight: [1.2, 1.8], flare: true } },
    { word: "kelp", tweak: { angle: [40, 55], gens: [4, 4], step: [7, 10], weight: [1.6, 2.2] } } // long loose fronds
  ],
  // plan 4 - dragon
  [
    { word: "angler", tweak: { lamp: true, length: [60, 80], height: [0.3, 0.36], beamStrength: 0, antlerDepth: [1, 1] } }, // a lamp on a rod, no beam, round body
    { word: "viper", tweak: { spine: true, fangs: 8, height: [0.12, 0.15], beamStrength: 0.5 } }, // lure on a long dorsal spine, more fangs
    { word: "lantern-eye", tweak: { eyeLights: true, length: [70, 90], height: [0.2, 0.26], beamStrength: 0.3, antlerDepth: [2, 2] } }, // a big light under each eye
    { word: "glass", tweak: { glass: true } } // almost clear
  ],
  // plan 5 - squid
  [
    { word: "dart", tweak: { mantle: [20, 26], height: [0.3, 0.38], arms: [5, 6], armLen: [6, 9], longArm: [1.2, 1.6], fin: [0.25, 0.3] } }, // small and quick
    { word: "glass", tweak: { glass: true, lightEvery: [2, 2] } }, // see-through, lights only when it panics
    { word: "vampire", tweak: { web: true, arms: [8, 8], lightEvery: [3, 3], armLen: [12, 16] } }, // a cloak between the arms
    { word: "firefly", tweak: { armLights: true, lightEvery: [1, 1] } }, // lights down the arms too
    { word: "reef", tweak: { fin: [0.4, 0.48], ripple: [0.12, 0.18] } } // big rippling fins
  ],
  // plan 6 - eel
  [
    { word: "thread", tweak: { thick: [2.5, 4], lightEvery: [3, 4], amp: [4, 7] } }, // thin
    { word: "ribbon", tweak: { fin: true } }, // a fin along the back
    { word: "eel", tweak: { thick: [6, 9], length: [80, 110], lightEvery: [3, 3] } }, // the plain long eel
    { word: "gulper", tweak: { mouth: true, head: [22, 28], thick: [7, 10], lightEvery: [4, 4], amp: [4, 7], freq: [0.05, 0.08] } }, // mostly mouth, slow
    { word: "abyss", tweak: { mouth: true, head: [22, 28], thick: [7, 10], lightEvery: [4, 4], amp: [4, 7], freq: [0.05, 0.08] } }
  ]
];

// *** the few species that need a specific look, by name. Wins over the kinds.
let speciesLook = {
  "Black angler": { lampOnly: true }, // nothing but its lamp
  "Glass dragon": { glass: true, beamStrength: 0.8, height: [0.16, 0.2] }, // only the beam gives it away
  "Noon angler": { lampSteady: true }, // keeps its lamp on when you come close
  "Mist comb": { dome: [0.8, 1], bell: [40, 52] }, // a softer comb than the crimson one
  "Pearl anchovy": { lightEvery: [2, 2] },
  "Ink minnow": { ink: true, eye: [2, 2.4] }
};

let shadowCol = [58, 68, 88]; // *** the unlit grey of a locked guide row

///////////////////////////////////////////////////////////////////
// Shared sprites
// One soft glow image per species, shared by every creature of it.
///////////////////////////////////////////////////////////////////

// The halo is made the first time a species is born. It is drawn
// with blendMode(ADD), so its size alone sets how bright it looks and
// no tint() is needed (tint() repaints every pixel and is slow).

let haloSprites = [];
let bodiesBorn = 0;
let worldNoiseSeed = 2026; // *** the noise seed the rest of the sketch gets back after a birth

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

// Growing a body reseeds p5's random() and noise(). This hands them
// back afterwards: noise to one shared seed so the water's drift
// field is the same for everyone, random to the clock so the next
// birth is not a copy of this one.
function releaseSeeds() {
  bodiesBorn++;
  noiseSeed(worldNoiseSeed);
  randomSeed(floor(millis() * 1000) + bodiesBorn);
}

///////////////////////////////////////////////////////////////////
// Body
// One per creature: sets the seed, grows the genes, caches the sprite.
///////////////////////////////////////////////////////////////////

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
  this.box = { x0: -4, y0: -4, x1: 4, y1: 4 }; // how much room the whole drawing takes, for the portraits
  this.haloY = 0; // where the flash halo is centred
  this.sk = max(1, this.size); // sprites of big species are drawn larger so scaling them up stays sharp

  // from here on every random() and noise() comes from the seed, so
  // the same seed always grows the same body. The species goes into
  // the mix so two species on one plan differ even with equal seeds.
  this.mix = seed + species * 1000003;
  randomSeed(this.mix); // after speciesWindows() above, which borrowed random() for a moment
  noiseSeed(this.mix);
  ensureHalo(species);
  this.phase = random(TWO_PI); // so a school's fins are not all in step
  this.bodyCol = mixColour(this.look.col, [10, 16, 32], 0.7); // dull flesh, the glow is the pure colour

  if (this.plan === 0) this.growSparkle();
  else if (this.plan === 1) this.growFish();
  else if (this.plan === 2) this.growJelly();
  else if (this.plan === 3) this.growSeaPen();
  else if (this.plan === 4) this.growDragon();
  else if (this.plan === 5) this.growSquid();
  else this.growEel();

  releaseSeeds();
}

// A gene range: the species' override if it has one, else the
// window its name cut from the plan's range.
Body.prototype.gene = function (name) {
  if (this.tweak[name] !== undefined) return this.tweak[name];
  if (this.windows[name] !== undefined) return this.windows[name];
  return this.genes[name];
};

///////////////////////////////////////////////////////////////////
// Species variation
// What makes two species on the same body plan look different.
///////////////////////////////////////////////////////////////////

// Worked out once per species and remembered, so the 600th plankton
// costs nothing extra. It all comes from the species' name, so a
// species keeps its build even if the table changes order.

let tweakCache = [];
let windowCache = [];

// modulo (week 3): a small hash of the name, the species' own seed.
function nameHash(str) {
  let h = 7;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % 2147483647;
  }
  return h;
}

// Merges the tweaks of every kind word found in the name, then the
// named override on top.
function speciesTweak(species) {
  if (tweakCache[species] !== undefined) return tweakCache[species];
  let info = speciesList[species];
  let name = info.name.toLowerCase();
  let kinds = planKinds[info.plan];
  let t = {};
  for (let k = 0; k < kinds.length; k++) {
    if (name.indexOf(kinds[k].word) < 0) continue;
    for (let key in kinds[k].tweak) t[key] = kinds[k].tweak[key];
  }
  let over = speciesLook[info.name];
  if (over !== undefined) {
    for (let key in over) t[key] = over[key];
  }
  tweakCache[species] = t;
  return t;
}

// Cuts a window out of every numeric plan range for this species:
// a third of the range wide, centred where the name's seed says.
// Individuals then vary inside the window, so two species on one
// plan differ in build (stripe count, light spacing, fin size,
// tentacle count, antler depth) even before their kind and colour.
// Uses p5's random() under the name's seed, then hands it back to
// the caller's seed.
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
    w[key] = [max(r[0], centre - span * 0.17), min(r[1], centre + span * 0.17)]; // *** 0.17 = half the window width
  }
  windowCache[species] = w;
  return w;
}

///////////////////////////////////////////////////////////////////
// Growing
// One grow function per body plan.
///////////////////////////////////////////////////////////////////

// Each grow function reads its ranges with gene(), draws the still
// parts into this.sprite, and records where the lights are in
// this.lights. Everything is drawn at size 1; render() then scales
// the whole body by this.size.

// 0 - sparkle. Hundreds on screen, so no sprite of its own: a dot
// drawn live, and the shared halo only while it flashes.
Body.prototype.growSparkle = function () {
  this.dot = pickGene(this.gene("size")) * this.size;
  this.twinkle = pickGene(this.gene("twinkle"));
  this.halo = this.tweak.halo !== undefined ? this.tweak.halo : 1;
  this.dotCol = this.look.col;
  if (this.tweak.shimmer) {
    // modulo (week 3): the seed picks one of three tints to lean toward
    let tints = [[255, 170, 200], [170, 255, 220], [255, 240, 170]];
    this.dotCol = mixColour(this.look.col, tints[floor(this.mix) % 3], 0.45);
  }
};

// 1 - fish. A small countershaded body, a big eye and a row of
// lights along the belly. The sprite is about 32 px wide.
Body.prototype.growFish = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let len = pickGene(this.gene("length"));
  let h = len * pickGene(this.gene("height"));
  let n = this.genes.segments;
  let lightEvery = pickGeneInt(this.gene("lightEvery"));
  let stripeEvery = pickGeneInt(this.gene("stripeEvery"));
  this.len = len;
  this.tail = pickGene(this.gene("tail"));
  this.flick = pickGene(this.gene("flick"));

  // noise (week 5): the silhouette
  let pts = this.outline(len / 2, h / 2, pickGene(this.gene("wobble")), 36);

  let snout = tw.snout ? len * 0.3 : 0;
  this.ox = len / 2 + 2;
  this.oy = h / 2 + 2;
  this.sprite = this.makeSprite(len + 4 + snout, h + 4);
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  if (tw.ink) this.bodyCol = mixColour(c, [4, 6, 12], 0.93); // an ink minnow is nearly black
  if (tw.glass) {
    // a glassfish is mostly water: a faint fill and an edge
    s.fill(c[0], c[1], c[2], 28);
    s.stroke(c[0], c[1], c[2], 110);
    s.strokeWeight(0.8);
  } else {
    s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2]);
  }
  fillPolygon(s, pts);
  s.noStroke();

  // modulo (week 3): every stripeEvery-th segment is a shade paler
  let pale = mixColour(c, [220, 235, 240], 0.5);
  let segW = len / n;
  if (!tw.glass && !tw.ink) {
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
  // a bristlemouth a jaw that runs most of the way back.
  let eye = pickGene(this.gene("eye"));
  s.fill(225, 238, 242);
  s.circle(len * 0.3, -h * 0.08, eye);
  s.fill(4, 8, 16);
  s.circle(len * 0.31, -h * 0.08, eye * 0.55);
  if (tw.snout) {
    s.stroke(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2]);
    s.strokeWeight(1.4);
    s.line(len / 2 - 2, 0, len / 2 + snout, -1);
    s.noStroke();
  }
  if (tw.bigMouth) {
    s.stroke(c[0], c[1], c[2], 120);
    s.strokeWeight(0.7);
    s.line(len / 2 - 1, h * 0.05, len * 0.05, h * 0.3);
    s.noStroke();
  }

  // modulo (week 3) again: a photophore on every lightEvery-th belly
  // segment, and a second row up the flank for species with rows: 2
  for (let i = 1; i < n - 1; i++) {
    if (i % lightEvery !== 0) continue;
    let x = -len / 2 + (i + 0.5) * segW;
    let sl = sliceOutline(pts, x);
    this.lights.push({ x: x, y: sl.bottom - 1.2, r: tw.glass || tw.ink ? 1.6 : 1.3, k: i / n });
    if (tw.rows === 2) this.lights.push({ x: x, y: (sl.top + sl.bottom) * 0.5 + h * 0.08, r: 1, k: i / n });
  }
  this.bakeLights(s, tw.glass || tw.ink ? 140 : 90);
  this.box = { x0: -this.ox - this.tail, y0: -this.oy, x1: len + 4 + snout - this.ox, y1: h + 4 - this.oy };
};

// 2 - jelly. A translucent dome with a scalloped rim, a ring of
// lights round the edge and L-system tentacles hanging below.
// Two sprites: the bell (breathes) and the tentacles (sway).
Body.prototype.growJelly = function () {
  let c = this.look.col;
  let tw = this.tweak;
  let bw = pickGene(this.gene("bell"));
  let bh = bw * pickGene(this.gene("dome"));
  let scallops = pickGeneInt(this.gene("scallops"));
  let nT = pickGeneInt(this.gene("tentacles"));
  let nL = pickGeneInt(this.gene("rimLights"));
  let angle = radians(pickGene(this.gene("angle")));
  let gens = pickGeneInt(this.gene("gens"));
  let tLen = pickGene(this.gene("length"));
  this.breathe = pickGene(this.gene("breathe"));
  this.haloY = -bh * 0.4;

  // noise (week 5): the top half of a wobbled ellipse is the dome.
  // The rim comes back along y = 0 with a sine scallop (waves, week 4).
  let pts = this.outline(bw / 2, bh, pickGene(this.gene("wobble")), 48);
  let half = pts.length / 2;
  let dome = [];
  for (let i = half; i < pts.length; i++) dome.push(pts[i]);
  dome.push(pts[0]);
  let m = scallops * 6;
  for (let j = 1; j < m; j++) {
    let u = j / m;
    dome.push({ x: lerp(pts[0].x, pts[half].x, u), y: abs(sin(u * PI * scallops)) * 3 });
  }

  let sh = bh * 1.2 + 12;
  this.ox = bw / 2 + 4;
  this.oy = bh * 1.2 + 4;
  this.sprite = this.makeSprite(bw + 8, sh);
  let s = this.sprite;
  s.translate(this.ox, this.oy);

  // the bell is see-through, so a soft fill with a brighter edge
  s.fill(c[0], c[1], c[2], 55);
  s.stroke(c[0], c[1], c[2], 150);
  s.strokeWeight(1.2);
  fillPolygon(s, dome);

  // modulo (week 3): a radial canal runs down to every other scallop,
  // or to every one for the sun bell
  s.strokeWeight(0.8);
  s.stroke(c[0], c[1], c[2], 60);
  let canalEvery = tw.rays ? 1 : 2;
  for (let k = 0; k <= scallops; k++) {
    if (k % canalEvery !== 0) continue;
    s.line(0, -bh * 0.85, lerp(pts[0].x, pts[half].x, k / scallops), 0);
  }

  s.noStroke();
  if (tw.rings) {
    // the moon jelly's four horseshoe gonads, seen through the bell
    s.noFill();
    s.stroke(c[0], c[1], c[2], 120);
    s.strokeWeight(1.5);
    for (let k = 0; k < 4; k++) {
      s.arc(lerp(-bw * 0.22, bw * 0.22, k / 3), -bh * 0.45, bw * 0.14, bh * 0.3, PI * 0.1, PI * 0.9);
    }
    s.noStroke();
  } else {
    // the stomach, a smaller dome inside
    s.fill(c[0], c[1], c[2], 90);
    s.push();
    s.translate(0, -bh * 0.22);
    s.scale(0.45, 0.4);
    fillPolygon(s, dome);
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
  } else {
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
  for (let t = 0; t < nT; t++) {
    let u = nT === 1 ? 0.5 : (t + 0.5) / nT;
    let x = lerp(-bw * 0.42, bw * 0.42, u);
    let heading = HALF_PI + (u - 0.5) * 0.5 + random(-0.1, 0.1); // hang down, the outer ones splay
    let walk = walkTurtle(rule, x, 2, heading, step, step, angle * random(0.85, 1.15));
    for (let i = 0; i < walk.segs.length; i++) segs.push(walk.segs[i]);
    box = unionBox(box, walk.box);
  }
  this.tox = -box.x0 + 3;
  this.toy = -box.y0 + 3;
  this.tentacles = this.makeSprite(box.x1 - box.x0 + 6, box.y1 - box.y0 + 6);
  this.tentacles.translate(this.tox, this.toy);
  drawSegments(this.tentacles, segs, c, 1.6, 170);

  this.box = unionBox({ x0: -this.ox, y0: -this.oy, x1: bw + 8 - this.ox, y1: sh - this.oy }, box);
};

// 3 - sea pen. An L-system feather on a stalk, standing upright.
Body.prototype.growSeaPen = function () {
  let c = this.look.col;
  let stemH = pickGene(this.gene("stem"));
  let stalk = pickGene(this.gene("stalk"));
  let gens = pickGeneInt(this.gene("gens"));
  let angle = radians(pickGene(this.gene("angle")));
  let step = pickGene(this.gene("step"));
  let weight = pickGene(this.gene("weight"));
  this.sway = pickGene(this.gene("sway"));
  this.stemH = stemH;
  this.base = (stemH - stalk) / 2; // the stem starts here so the whole colony is centred on the position
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
  let dull = mixColour(c, [40, 30, 30], 0.6);
  s.stroke(dull[0], dull[1], dull[2]);
  s.strokeWeight(weight + 1);
  s.line(0, this.base, 0, this.base + stalk);
  s.noStroke();
  s.fill(dull[0], dull[1], dull[2]);
  s.ellipse(0, this.base + stalk, weight * 3, weight * 2);

  drawSegments(s, walk.segs, c, weight, 200);
  this.bakeLights(s, 100);
  this.box = { x0: box.x0 - 4, y0: box.y0 - 4, x1: box.x1 + 4, y1: box.y1 + 4 };
};

// 4 - dragon. A long dark body, a searchlight under the eye, a
// recursive antler lure on the chin (or a spine, or a lamp) and fin rays.
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
  let fangs = tw.fangs !== undefined ? tw.fangs : this.genes.fangs;
  this.len = len;
  this.tail = h * 0.9;
  this.beam = pickGene(this.gene("beam"));
  this.beamStrength = tw.beamStrength !== undefined ? tw.beamStrength : 1;
  this.flick = pickGene(this.gene("flick"));
  this.bodyCol = mixColour(c, [8, 6, 14], 0.88); // nearly black, so it is the lights you see

  // noise (week 5): the silhouette, long and thin
  let pts = this.outline(len / 2, h / 2, pickGene(this.gene("wobble")), 48);

  let top = 18 + (tw.spine || tw.lamp ? 22 : 0);
  let sh = h + top + 54;
  this.ox = len / 2 + 6;
  this.oy = h / 2 + top;
  this.sprite = this.makeSprite(len + 12, sh);
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  let hidden = tw.glass || tw.lampOnly; // a glass dragon is nearly clear, a black angler is only its lamp
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
  if (tw.lampOnly) this.bodyCol = [this.bodyCol[0], this.bodyCol[1], this.bodyCol[2], 30]; // the tail fades too

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

  // the head: a pale eye, the jaw with its fangs, and the searchlight
  // photophore just under the eye
  let eyeX = len * 0.36;
  let eyeY = -h * 0.1;
  if (!tw.lampOnly) {
    s.fill(225, 225, 235);
    s.circle(eyeX, eyeY, h * 0.34);
    s.fill(4, 4, 10);
    s.circle(eyeX + h * 0.04, eyeY, h * 0.2);
  }
  if (tw.eyeLights) this.lights.push({ x: eyeX - h * 0.05, y: eyeY + h * 0.3, r: 2.4, k: 1, lure: false, eye: true });
  s.stroke(c[0], c[1], c[2], 110);
  s.strokeWeight(0.8);
  s.line(len / 2 - 1, h * 0.08, len * 0.22, h * 0.3);
  for (let i = 0; i < fangs; i++) {
    let fx = len * 0.46 - i * (len * 0.22 / fangs);
    let fl = 3.5 + (fangs > 4 ? 3 * (i % 2) : 0); // modulo (week 3): a viperfish's fangs alternate long and short
    s.line(fx, h * 0.1 + i * 1.5, fx - 1, h * 0.1 + i * 1.5 - fl);
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
  } else {
    let chinX = len * 0.26;
    let chinY = sliceOutline(pts, chinX).bottom;
    s.line(chinX, chinY, chinX - 2, chinY + 10);
    this.branch(s, chinX - 2, chinY + 10, HALF_PI + 0.15, aLen, depth, spread, tips);
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

// 5 - squid. It swims mantle first, so the mantle is at +x and the
// arms trail behind. The mantle, head, eyes and the skirt of short
// arms are the sprite; the two long arms and the fins move live.
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
  this.ml = ml;
  this.mh = mh;
  this.longArm = ml * pickGene(this.gene("longArm"));
  this.fin = pickGene(this.gene("fin"));
  this.ripple = pickGene(this.gene("ripple"));
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
  if (tw.glass) {
    s.fill(c[0], c[1], c[2], 26);
    s.stroke(c[0], c[1], c[2], 120);
    s.strokeWeight(0.8);
  } else {
    s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2]);
  }
  fillPolygon(s, pts);
  s.ellipse(headX, 0, 12, mh * 0.85);
  s.noStroke();
  let eyeR = tw.web ? mh * 0.3 : mh * 0.2;
  s.fill(225, 235, 240);
  s.circle(headX, -mh * 0.22, eyeR);
  s.circle(headX, mh * 0.22, eyeR);
  s.fill(4, 8, 16);
  s.circle(headX + 0.5, -mh * 0.22, eyeR * 0.55);
  s.circle(headX + 0.5, mh * 0.22, eyeR * 0.55);

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
  if (!tw.glass) this.bakeLights(s, 90); // a glass squid shows nothing until it is lit
  this.box = { x0: -this.ox - this.longArm, y0: -this.oy - mh * 0.3, x1: ml + 6, y1: hh - this.oy + mh * 0.3 };
};

// 6 - eel. Only the head is a sprite. The body is a chain of
// segments that rides a travelling sine wave (waves, week 4), drawn
// live as one tapered shape, with a light on every nth segment.
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
  this.haloY = 0;

  // modulo (week 3): which segments carry a light. Their positions
  // move with the wave, so only the segment numbers are kept.
  this.lightSegs = [];
  for (let i = 2; i < n - 1; i++) {
    if (i % lightEvery === 0) this.lightSegs.push(i);
  }

  // noise (week 5): the head, a short wobbled ellipse. The gulper's
  // is mostly an open jaw.
  let hh = tw.mouth ? hl * 0.9 : this.thick * 1.3;
  let pts = this.outline(hl / 2, hh / 2, pickGene(this.gene("wobble")), 24);
  this.ox = hl / 2 + 3;
  this.oy = hh / 2 + 3 + (tw.mouth ? 2 : 0);
  this.sprite = this.makeSprite(hl + 6, hh + 6 + (tw.mouth ? hh * 0.9 : 0));
  let s = this.sprite;
  s.translate(this.ox, this.oy);
  s.fill(this.bodyCol[0], this.bodyCol[1], this.bodyCol[2]);
  fillPolygon(s, pts);
  if (tw.mouth) {
    // the lower jaw hangs open below the head
    s.fill(this.bodyCol[0] * 0.8, this.bodyCol[1] * 0.8, this.bodyCol[2] * 0.8);
    s.triangle(hl * 0.45, 0, -hl * 0.3, hh * 0.1, hl * 0.1, hh * 0.95);
    s.stroke(c[0], c[1], c[2], 90);
    s.strokeWeight(0.8);
    s.line(hl * 0.45, 0, -hl * 0.3, hh * 0.1);
    s.noStroke();
  }
  let eye = tw.mouth ? hh * 0.18 : hh * 0.34;
  s.fill(225, 238, 242);
  s.circle(hl * 0.2, -hh * 0.12, eye);
  s.fill(4, 8, 16);
  s.circle(hl * 0.22, -hh * 0.12, eye * 0.55);
  this.box = { x0: -this.len - 4, y0: -this.amp - this.thick, x1: hl / 2 + 3, y1: this.amp + this.thick + (tw.mouth ? hh : 0) };
};

// Draws each light dimly into the sprite, so the body still reads
// when nothing is lighting it.
Body.prototype.bakeLights = function (g, alpha) {
  let c = this.look.col;
  g.noStroke();
  g.fill(c[0], c[1], c[2], alpha);
  for (let i = 0; i < this.lights.length; i++) {
    g.circle(this.lights[i].x, this.lights[i].y, this.lights[i].r * 1.4);
  }
};

///////////////////////////////////////////////////////////////////
// Techniques
// The generative tools the grow functions share.
///////////////////////////////////////////////////////////////////

// All of these run once, when a creature is born, so none of them
// needs to be fast.

// noise (week 5): walk around an ellipse and wobble the radius with
// noise(seed + angle). The noise is read at a point on a small
// circle in noise space, so the last point meets the first with no
// seam (Shiffman's polar noise loop). Facing right: the nose is at
// index 0, the walk runs round the bottom first (y down is
// positive in p5), then back over the top.
Body.prototype.outline = function (rx, ry, wobble, steps) {
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

// Where the outline crosses the vertical line at x: the top and
// bottom of the body there. Used to place segments and belly lights.
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

// The piece of the outline between two vertical lines, as a closed
// shape that follows the body edge exactly: along the top from left
// to right, then back along the bottom. Used for stripes.
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

// L-system (week 10): rewrite every letter of the string with its
// rule, gens times. Letters without a rule stay as they are.
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

// L-system (week 10): the turtle from the plant demo. F and G step
// forward (G is the thicker stem step), + and - turn, [ and ] save
// and restore the state, L marks a light. We keep our own x, y and
// heading instead of translate()/rotate() so we can remember where
// the lights are. Returns the line segments, the lights and the
// box they fit in, all in the caller's coordinates.
function walkTurtle(s, x, y, heading, step, stemStep, angle) {
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

// recursion (week 9): the branch() tree from class, kept shallow.
// Draws one line, then calls itself twice from its end, turned left
// and right, until depth runs out. The angles jitter with random(),
// which is stable because the seed was set at birth. Tips are
// collected so a light can hang on each one.
Body.prototype.branch = function (g, x, y, heading, len, depth, spread, tips) {
  let nx = x + cos(heading) * len;
  let ny = y + sin(heading) * len;
  g.strokeWeight(0.5 + depth * 0.35);
  g.line(x, y, nx, ny);
  if (depth <= 0) {
    tips.push({ x: nx, y: ny });
    return;
  }
  this.branch(g, nx, ny, heading + spread * random(0.7, 1.3), len * 0.68, depth - 1, spread, tips);
  this.branch(g, nx, ny, heading - spread * random(0.7, 1.3), len * 0.68, depth - 1, spread, tips);
};

// Strokes a list of turtle segments. Deeper branches get thinner
// and fainter, so the trunk reads as the trunk.
function drawSegments(g, segs, c, weight, alpha) {
  for (let i = 0; i < segs.length; i++) {
    let s = segs[i];
    g.stroke(c[0], c[1], c[2], alpha * pow(0.8, s.depth));
    g.strokeWeight(max(weight * pow(0.55, s.depth), 0.6));
    g.line(s.x0, s.y0, s.x1, s.y1);
  }
}

function fillPolygon(g, pts) {
  g.beginShape();
  for (let i = 0; i < pts.length; i++) g.vertex(pts[i].x, pts[i].y);
  g.endShape(CLOSE);
}

// A fresh transparent sprite, w by h body units, drawn sk times
// larger so a big species scaled up by render() stays sharp.
Body.prototype.makeSprite = function (w, h) {
  let g = createGraphics(ceil(w * this.sk), ceil(h * this.sk));
  g.scale(this.sk);
  g.noStroke();
  return g;
};

// Draws a sprite at its body-unit size, or a dark copy of it for a
// locked guide row.
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

// A dark copy of a sprite, made once when the guide first asks:
// the same shape and alpha in one flat colour.
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

function unionBox(a, b) {
  return { x0: min(a.x0, b.x0), y0: min(a.y0, b.y0), x1: max(a.x1, b.x1), y1: max(a.y1, b.y1) };
}

// Between two [r, g, b] colours, t = 0 is the first.
function mixColour(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

// A value from a [low, high] range, chosen with the seeded random().
function pickGene(range) {
  return random(range[0], range[1]);
}

function pickGeneInt(range) {
  return floor(random(range[0], range[1] + 1));
}

///////////////////////////////////////////////////////////////////
// Rendering
// Drawing a creature every frame, and its portrait for the guide.
///////////////////////////////////////////////////////////////////

// render() runs every frame for every creature on screen, so it is
// one image() for the still body plus a few shapes for the parts
// that move or glow. Glows use blendMode(ADD), which adds light the
// way real light adds up, then goes back to the normal BLEND mode.

// Draws the creature.
//   x, y     position
//   heading  see the header: travel direction, or where a bell points
//   flash    0 to 1, how recently the line struck it
//   lit      0 to 1, how close the lure is (ambient light from it)
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

// A still lit portrait for the field guide, fitted inside px pixels.
Body.prototype.renderIcon = function (x, y, px) {
  this.portrait(x, y, px, false);
};

// The same footprint dark and unlit, for a row not yet found.
Body.prototype.renderSilhouette = function (x, y, px) {
  this.portrait(x, y, px, true);
};

Body.prototype.portrait = function (x, y, px, shadow) {
  let c = this.look.col;
  push();
  translate(x, y);
  noStroke();
  if (this.plan === 0) {
    if (shadow) {
      fill(shadowCol[0], shadowCol[1], shadowCol[2]);
    } else {
      blendMode(ADD);
      image(haloSprites[this.species], -px / 2, -px / 2, px, px);
      blendMode(BLEND);
      fill(c[0], c[1], c[2], 230);
    }
    circle(0, 0, px * 0.3);
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

// 0 - sparkle, the cheap path: no push(), no rotate(), one circle,
// and the shared halo only while it flashes.
Body.prototype.drawSparkle = function (x, y, flash, lit, t) {
  let c = this.dotCol;
  // waves (week 4): a slow twinkle on its own phase
  let tw = 0.5 + 0.5 * sin(t * this.twinkle + this.phase);
  noStroke();
  fill(c[0], c[1], c[2], 80 + 100 * tw + 75 * max(flash, lit));
  circle(x, y, this.dot * (1 + 1.5 * flash + 0.5 * lit));
  if (flash > 0.05) {
    blendMode(ADD);
    let d = (10 + 34 * flash) * this.halo * this.size;
    image(haloSprites[this.species], x - d / 2, y - d / 2, d, d);
    blendMode(BLEND);
  }
};

// The cached still parts, placed so the creature's position is at
// the origin. The jelly breathes and the sea pen sways here (waves,
// week 4); the others just blit.
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

// The parts that move every frame and are flesh, not light: the
// fish and dragon tail, the squid's long arms and fins, the eel's
// whole body. Drawn in the shadow colour for a locked guide row.
Body.prototype.drawMoving = function (t, flash, shadow) {
  let b = shadow ? shadowCol : this.bodyCol;
  noStroke();
  if (this.plan === 1 || this.plan === 4) this.drawTail(t, flash, b);
  else if (this.plan === 5) this.drawSquidArms(t, flash, b, shadow);
  else if (this.plan === 6) this.drawEelBody(t, b, shadow);
};

// waves (week 4): the tail flicks with sin(), harder when struck.
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

// waves (week 4): the two long arms trail and wave behind the squid,
// the fins at the mantle tip ripple. The firefly squid has lights
// down the arms, on every third point (modulo, week 3).
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
    fill(c[0], c[1], c[2], 120 + 135 * flash);
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
  // the fins: a pair of rhombs at the tip, rippling
  let r = 1 + 0.3 * sin(t * this.ripple + this.phase);
  let fx = this.ml * 0.55;
  let fw = this.ml * 0.42;
  let fh = this.mh * this.fin * 1.6 * r;
  fill(b[0], b[1], b[2], 170);
  triangle(fx, -this.mh * 0.2, fx + fw * 0.45, -this.mh * 0.3 - fh, fx + fw, -this.mh * 0.05);
  triangle(fx, this.mh * 0.2, fx + fw * 0.45, this.mh * 0.3 + fh, fx + fw, this.mh * 0.05);
};

// waves (week 4): where segment i of the eel is right now. A sine
// travels down the body, the head barely moves and the tail swings.
Body.prototype.eelY = function (i, t) {
  let u = i / this.segs;
  return this.amp * (0.1 + 0.9 * u) * sin(t * this.freq - u * TWO_PI * this.waves + this.phase);
};

// The eel's body as one tapered shape along the wave, and a fin
// along the back for the ribbon species.
Body.prototype.drawEelBody = function (t, b, shadow) {
  let n = this.segs;
  let segLen = this.len / n;
  let c = this.look.col;
  let ys = [];
  for (let i = 0; i <= n; i++) ys.push(this.eelY(i, t));

  if (this.tweak.fin) {
    if (shadow) fill(b[0], b[1], b[2], 120);
    else fill(c[0], c[1], c[2], 60);
    beginShape();
    for (let i = 1; i < n; i++) vertex(-i * segLen, ys[i] - this.thick * 0.5 - 3 - 2 * sin(i * 0.9 + t * 0.1));
    for (let i = n - 1; i >= 1; i--) vertex(-i * segLen, ys[i]);
    endShape(CLOSE);
  }

  fill(b[0], b[1], b[2]);
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
};

// The glowing parts, added onto the water: the flash halo and the
// photophores of each plan.
Body.prototype.drawLights = function (flash, lit, t) {
  let c = this.look.col;
  noStroke();
  blendMode(ADD);
  if (flash > 0.05) {
    let d = planRadius[this.plan] * (3 + 4 * flash);
    image(haloSprites[this.species], -d / 2, this.haloY - d / 2, d, d);
  }
  if (this.plan === 1 || this.plan === 5) this.drawRowLights(c, flash, lit);
  else if (this.plan === 2) this.drawJellyLights(c, flash, lit, t);
  else if (this.plan === 3) this.drawSeaPenLights(c, flash, lit);
  else if (this.plan === 4) this.drawDragonLights(c, flash, lit, t);
  else this.drawEelLights(c, flash, lit, t);
  blendMode(BLEND);
};

// Photophores brighten with the flash and with the lure's light.
// A glass creature stays dark until something lights it.
Body.prototype.drawRowLights = function (c, flash, lit) {
  let base = this.tweak.glass ? 0.05 : 0.2;
  let b = base + (1 - base) * max(flash, lit);
  fill(c[0], c[1], c[2], 255 * b);
  let L = this.lights;
  for (let i = 0; i < L.length; i++) {
    circle(L[i].x, L[i].y, L[i].r * (1.4 + 1.2 * flash));
  }
};

// The alarm: a pulse of light runs round the ring of rim lights
// (waves, week 4, offset by each light's place k in the ring).
Body.prototype.drawJellyLights = function (c, flash, lit, t) {
  let sx = 1 + 0.07 * sin(t * this.breathe + this.phase); // follow the breathing bell
  let sy = 1 - 0.06 * sin(t * this.breathe + this.phase);
  let L = this.lights;
  for (let i = 0; i < L.length; i++) {
    let run = 0.5 + 0.5 * sin(t * 0.35 - L[i].k * TWO_PI * 2);
    let b = min(1, 0.15 + 0.5 * lit + flash * (0.4 + 0.8 * run));
    fill(c[0], c[1], c[2], 255 * b);
    circle(L[i].x * sx, L[i].y * sy, L[i].r * (1.4 + 1.5 * flash * run));
  }
};

// The light runs up the stem while the flash fades: struck at the
// base, it reaches the tip as flash gets small, lighting each polyp
// as it passes. The ember whip flares all at once instead.
Body.prototype.drawSeaPenLights = function (c, flash, lit) {
  let pos = 1 - flash;
  let f = sqrt(flash);
  let L = this.lights;
  for (let i = 0; i < L.length; i++) {
    let near = this.tweak.flare ? 1 : max(0, 1 - abs(L[i].k - pos) * 3);
    let b = min(1, 0.12 + 0.5 * lit + f * near);
    fill(c[0], c[1], c[2], 255 * b);
    circle(L[i].x, L[i].y, L[i].r * (1.4 + 2 * f * near));
  }
  if (flash > 0.03 && !this.tweak.flare) {
    let y = this.base - pos * this.stemH;
    fill(c[0], c[1], c[2], 220 * f);
    circle(0, y, 3 + 3 * f);
    let d = 8 + 24 * f;
    image(haloSprites[this.species], -d / 2, y - d / 2, d, d);
  }
};

// Belly lights, the lure flickering to tempt prey (waves, week 4),
// and the searchlight sweeping slowly ahead of the eye. The angler's
// lamp goes dark as the lure comes close, then flares when struck.
Body.prototype.drawDragonLights = function (c, flash, lit, t) {
  let b = 0.15 + 0.85 * max(flash, lit);
  let L = this.lights;
  for (let i = 0; i < L.length; i++) {
    let l = L[i];
    let a = b;
    if (l.lamp) a = this.tweak.lampSteady ? 0.8 + 0.2 * flash : 0.7 * (1 - lit) + flash;
    else if (l.eye) a = 0.6 * (0.5 + 0.5 * sin(t * 0.05 + this.phase)) * (1 - lit) + flash; // blinks, and switches off when you come close
    else if (l.lure) a = 0.35 + 0.35 * sin(t * 0.09 + this.phase + l.x) + 0.3 * flash;
    fill(c[0], c[1], c[2], 255 * min(1, a));
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

// The eel's lights sit on the moving segments, so they are placed
// from the same wave as the body. A pulse runs tailward when struck.
Body.prototype.drawEelLights = function (c, flash, lit, t) {
  let segLen = this.len / this.segs;
  let S = this.lightSegs;
  for (let i = 0; i < S.length; i++) {
    let k = S[i] / this.segs;
    let run = 0.5 + 0.5 * sin(t * 0.3 - k * 8);
    let b = min(1, 0.2 + 0.6 * lit + flash * (0.4 + 0.6 * run));
    fill(c[0], c[1], c[2], 255 * b);
    circle(-S[i] * segLen, this.eelY(S[i], t), 1.8 + 1.5 * flash);
  }
};


///////////////////////////////////////////////////////////////////
// 6. CREATURES
// How the creatures move, school, migrate and react to the line.
///////////////////////////////////////////////////////////////////

// A Creature is an autonomous agent (week 6): it steers itself by a
// few simple rules. It also drifts on a noise current (week 5), rises
// and sinks with the clock, and reacts to the fishing line. It does
// not draw itself; it asks its Body (Anatomy) to. The Shoal looks
// after the whole population: which period's species are alive, the
// slow swap when the period changes, and the plankton chain reaction.
//
// The body plan decides how a creature moves. The species decides
// its depth band, its period of the day and how many there are.
//
// Flocking adapted from the Week 6 boids template (Ashley Hi), which
// is based on Daniel Shiffman's Flocking example for p5.js, by way of
// our earlier haze project (boid.js and flock.js): neighbours from
// a spatial grid, alignment and cohesion within one species only, a
// noise flow field and the energy feedback loop. Rewritten here with
// plain x and y numbers instead of p5.Vector objects, so 800
// creatures can move without allocating anything each frame.

///////////////////////////////////////////////////////////////////
// Plan behaviour
// How each body plan moves, and how many creatures there are.
///////////////////////////////////////////////////////////////////

// One entry per body plan, in the same order as bodyPlans.
//   maxSpeed, maxForce     how fast it swims and how sharply it can turn
//   sep, ali, coh          the three flocking weights (week 6). 0 turns a rule off
//   flee                   how hard a moving line pushes it away
//   sense                  how far away it notices the line, in pixels
//   cool                   frames before it can light up again
//   dayDepth / nightDepth  where the plan lives, as fractions of the
//                          screen height, [shallowest, deepest]. A
//                          species' band uses one third of that range.
// Both depth ranges stay on screen, so every species of the current
// period can be reached at any hour. The migration only shifts the
// whole set up at night and down by day. Only species from another
// period sink below the screen.

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
  { maxSpeed: 0.7, maxForce: 0.02, sep: 0.4, ali: 0, coh: 0, flee: 1.5, sense: 70, cool: 120, dayDepth: [0.3, 0.94], nightDepth: [0.15, 0.88] }
];

// How many of a species to spawn, per 100k pixels of canvas, clamped.
// Bigger species are fewer (the count is divided by size).
// *** change the population here
let rarityCount = {
  common: { perArea: 1.8, min: 15, max: 30 }, // schools
  uncommon: { perArea: 0.3, min: 3, max: 5 },
  rare: { perArea: 0.1, min: 1, max: 2 }
};
let planktonCount = { perArea: 15, min: 60, max: 210 }; // *** common plan 0 species, about 600 in all
let goneDepth = 1.3; // *** where a species out of its period waits, as a fraction of height (below the screen)
let swapSeconds = 20; // *** how long a period's set takes to sink away, and the next to rise, at 60 fps
let spawnPerFrame = 6; // *** how many of the new set are born each frame. Growing a body costs about 1 ms, so 6 keeps the frame

// Shared tuning. Distances are squared once here so the loops never sqrt.
let neighbourDist = 55; // *** alignment and cohesion range, keep <= the grid cell size (60, set in setup)
let neighbourDistSq = neighbourDist * neighbourDist;
let flowScale = 0.002; // *** size of the swirls in the noise field
let flowSpeed = 0.002; // *** how fast the field itself changes
let scatterEnergy = 40; // *** sound.energy at which schools fully break up (one plankton chain is about 16)
let litRange = 160; // *** how far the lure's glow reaches a creature

// Plankton chain reaction (see Shoal.spark). The struck one is
// generation 0, the ones it lights are generation 1, and so on.
let chainFanout = [3, 2, 1]; // *** how many neighbours each generation lights
let chainFlash = [1, 0.8, 0.65, 0.5]; // *** flash strength per generation
let chainDelay = 7; // *** frames between one light and the next
let chainDist = 42; // *** how far a spark can jump, keep <= grid cell size
let chainDistSq = chainDist * chainDist;
let chainMax = 36; // *** lights waiting at once. keeps a sweep through a thick cloud from playing hundreds of notes

// Jelly pulse and squid jet.
let jellyBeat = 0.04; // *** phase per frame, about one squeeze every 2.5 s
let jellyThrust = 0.06; // *** push on each squeeze
let squidJetEvery = 130; // *** frames between jets, give or take a third
let squidJet = 2.2; // *** speed a jet adds, in pixels per frame

///////////////////////////////////////////////////////////////////
// Creature
// One animal: where it is, how fast it moves, how bright it glows.
///////////////////////////////////////////////////////////////////

// Each plan has its own way of moving (see run), but they all feel
// the clock and their period, notice the line, and light up when
// struck.

function Creature(x, y, species) {
  this.species = species;
  this.info = speciesList[species];
  this.plan = this.info.plan;
  this.settings = planBehaviour[this.plan];
  this.body = new Body(species, random(100000));

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
  this.leaving = false; // true once its period is over: present ramps back to 0, then the shoal removes it

  this.flash = 0; // 1 just after a strike, fades to 0
  this.panic = 0; // 1 while the line is shoving it, lets it go faster than it swims
  this.cooldown = 0; // frames until it can light up again
  this.gen = 0; // chain reaction generation of the last flash, the Sound section reads it
  this.seed = random(1000); // for its own noise wander

  // plan quirks
  this.angle = this.velocity.heading(); // where a jelly, squid, eel or dragon points
  this.phase = random(TWO_PI); // a jelly's pulse, an eel's wiggle
  this.jetIn = random(squidJetEvery); // frames until a squid's next jet
  this.anchorX = x; // a sea pen never leaves this column
  this.sway = 0; // a sea pen's lean in radians, 0 is upright
  this.swayVel = 0;
}

// Each plan moves its own way, then everyone feels the line.
// Below the screen nothing can be touched or seen, so those two
// steps are skipped there to keep the deep cheap.
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
  else this.undulate(neighbours);

  if (reachable) this.sense();
  this.update();
  this.borders();
  if (reachable) this.render();
};

// Adds a steering force the Reynolds way: the caller passes desired
// velocity minus current velocity, this caps it at limit.
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

// Noise flow field (week 5). One field for the whole sea, so
// neighbours swirl the same way, like a current. w scales the force.
Creature.prototype.flow = function (w) {
  let a = noise(this.position.x * flowScale, this.position.y * flowScale, frameCount * flowSpeed) * TWO_PI * 2;
  this.steer(cos(a) * this.maxSpeed - this.velocity.x, sin(a) * this.maxSpeed - this.velocity.y, this.maxForce * w);
};

// Where this creature belongs right now: its band's depth for this
// hour of the migration, or the waiting depth below the screen when
// its species is out of its period, blended by present (smoothstepped
// so the ends of the journey are gentle).
Creature.prototype.wantDepth = function () {
  let home = tide.depthFor(this.pref, this.settings.dayDepth, this.settings.nightDepth);
  let u = this.present * this.present * (3 - 2 * this.present);
  return lerp(height * goneDepth, home, u);
};

// The diel migration: a pull toward wantDepth. Gain is how many
// times maxForce the pull may reach: above 1 it beats the flow
// field, so an up-current cannot hold a creature near the surface.
Creature.prototype.migrate = function (gain) {
  let pull = (this.wantDepth() - this.position.y) * 0.0004; // *** how firmly depth is held
  let limit = this.maxForce * gain;
  this.ay += constrain(pull, -limit, limit);
};

// Turns angle toward a direction by a fraction, the short way round.
Creature.prototype.turnToward = function (to, amount) {
  let diff = atan2(sin(to - this.angle), cos(to - this.angle));
  this.angle += diff * amount;
};

///////////////////////////////////////////////////////////////////
// Ways of moving
// One method per body plan. run() picks the right one.
///////////////////////////////////////////////////////////////////

// Sparkle: carried by the current, no will of its own.
Creature.prototype.drift = function () {
  this.flow(1);
  this.migrate(2);
};

// Fish: the week 6 rules, plus the current and the tide.
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

// Jelly: a thrust on each squeeze of the bell, then it coasts.
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

// Sea pen: anchored, so it only rises and sinks with the tide and
// leans in the current. The lean is a spring the line can knock.
Creature.prototype.lean = function () {
  this.position.x = this.anchorX;
  this.position.y += (this.wantDepth() - this.position.y) * 0.01;

  let current = sin(frameCount * 0.01 + this.seed) * 0.15; // *** how far the current bends it
  this.swayVel += (current - this.sway) * 0.004; // *** stiffness of the stem
  this.swayVel *= 0.96;
  this.sway += this.swayVel;
};

// Dragon: slow, wide turns on its own noise, and it leans toward
// any fish it can see.
Creature.prototype.hunt = function (neighbours) {
  this.angle += (noise(this.seed, frameCount * 0.004) - 0.5) * 0.06; // *** how wide the turns are

  let bestD = neighbourDistSq * 4; // it sees a little past the grid, but only what the grid returns
  let tx = 0;
  let ty = 0;
  for (let i = 0; i < neighbours.length; i++) {
    let other = neighbours[i];
    if (other.plan !== 1) continue;
    let dx = other.position.x - this.position.x;
    let dy = other.position.y - this.position.y;
    let d2 = dx * dx + dy * dy;
    if (d2 < bestD) {
      bestD = d2;
      tx = dx;
      ty = dy;
    }
  }
  if (tx !== 0 || ty !== 0) this.turnToward(atan2(ty, tx), 0.03); // *** how keenly it turns toward prey

  this.steer(cos(this.angle) * this.maxSpeed - this.velocity.x, sin(this.angle) * this.maxSpeed - this.velocity.y, this.maxForce);
  this.migrate(3);
};

// Squid: a jet every couple of seconds in the direction it faces,
// then it drifts, slows, and turns a little on noise before the next.
Creature.prototype.jet = function (neighbours) {
  this.angle += (noise(this.seed, frameCount * 0.005) - 0.5) * 0.05; // *** how much it turns between jets

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

// Eel: keeps a heading that only turns slowly, and swims along it in
// a travelling sine (week 4), swaying side to side as it goes.
Creature.prototype.undulate = function (neighbours) {
  this.angle += (noise(this.seed, frameCount * 0.002) - 0.5) * 0.02; // *** how slowly it changes course
  this.phase += 0.05; // *** how fast it wiggles

  // forward along the heading, plus a sideways sway at right angles to it
  let sway = sin(this.phase) * 0.6; // *** how wide the wiggle is, as a fraction of speed
  let dx = cos(this.angle) - sin(this.angle) * sway;
  let dy = sin(this.angle) + cos(this.angle) * sway;
  this.steer(dx * this.maxSpeed - this.velocity.x, dy * this.maxSpeed - this.velocity.y, this.maxForce * 3); // 3 so the sway is not flattened by the cap

  this.separate(neighbours, this.settings.sep);
  this.migrate(2);
};

///////////////////////////////////////////////////////////////////
// Rules of flocking
// Separation, alignment and cohesion, the three boid rules (week 6).
///////////////////////////////////////////////////////////////////

// Same rules as the Week 6 template, but looping only over the
// neighbours the grid returns, and written with plain numbers.
// Alignment and cohesion only count the same species, so each kind of
// fish keeps its own school. Separation counts everyone except
// plankton, which are too small to swim around.

// Separation
// Steers away from anything inside its personal space.
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

// Alignment
// Matches the average velocity of nearby creatures of the same species.
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

// Cohesion
// Seeks the average position of nearby creatures of the same species.
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
// How a creature senses the line, flees it, and lights up when struck.
///////////////////////////////////////////////////////////////////

// A still line is just another thing in the water. A moving one
// pushes water ahead of it, so creatures feel it coming and move
// away: schools and squid bolt, jellies and eels drift aside, and
// plankton swirl in its wake. Touching a body while moving is a strike.

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
      this.swayVel += (dx > 0 ? 1 : -1) * moving * near * 0.004; // *** how hard the line rocks a sea pen
    }
  }

  if (hit.d < this.body.radius + 4 && fline.speed > 0.5 && this.cooldown <= 0) {
    this.strike();
  }
};


// The line struck this creature. The lure flares and the field
// guide learns the species.
Creature.prototype.strike = function () {
  fline.strike();
  this.ignite(1, 0);
  ui.unlock(this.species);
};

// Lights up and sounds. Chain reaction flashes come through here
// too, weaker and with a later generation. A struck plankton asks
// the shoal to spread the light to its neighbours.
Creature.prototype.ignite = function (strength, gen) {
  this.flash = strength;
  this.gen = gen; // set before play() so the sound can climb with it
  this.cooldown = this.settings.cool;
  sound.play(this);
  if (this.plan === 0 && gen < chainFanout.length) shoal.spark(this, gen);
};

///////////////////////////////////////////////////////////////////
// Moving and drawing
// Applying the forces, keeping creatures in the water, drawing them.
///////////////////////////////////////////////////////////////////

Creature.prototype.update = function () {
  let v = this.velocity;
  v.x += this.ax;
  v.y += this.ay;
  this.ax = 0;
  this.ay = 0;

  // a struck or frightened creature can go faster than it swims
  let limit = this.maxSpeed * (1 + this.flash * 0.9 + this.panic); // *** panic doubles the speed
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

// Wrap left and right. Vertical movement is the migration, so no
// wrap there, just a nudge off the surface and a floor well below.
Creature.prototype.borders = function () {
  let r = this.body.radius * 2;
  if (this.position.x < -r) this.position.x = width + r;
  if (this.position.x > width + r) this.position.x = -r;
  if (this.position.y < 12) this.velocity.y += 0.1;
  if (this.position.y > height * 1.5) this.position.y = height * 1.5;
};

// Asks the body to draw itself. Heading is the direction of travel
// for sparkle, fish and squid; a sea pen stands up (minus half pi)
// and leans by its sway; jellies, the dragon and eels face their own
// angle, so an eel's ribbon keeps its course while its path wiggles.
Creature.prototype.render = function () {
  let heading;
  if (this.plan === 3) heading = -HALF_PI + this.sway;
  else if (this.plan === 2 || this.plan === 4 || this.plan === 6) heading = this.angle;
  else heading = atan2(this.velocity.y, this.velocity.x);

  // ambient light from the lure when it is close
  let dx = fline.lx - this.position.x;
  let dy = fline.ly - this.position.y;
  let d2 = dx * dx + dy * dy;
  let lit = d2 < litRange * litRange ? 1 - sqrt(d2) / litRange : 0;

  this.body.render(this.position.x, this.position.y, heading, this.flash, lit);
};

///////////////////////////////////////////////////////////////////
// Shoal
// All the creatures together, and the swap between periods.
///////////////////////////////////////////////////////////////////

// The Shoal keeps the current period's species alive, spawns the
// right number of each for the screen size, swaps the set slowly when
// the period changes, runs everyone through the grid, and holds the
// queue of plankton waiting to light up in a chain reaction.

// *** back to front: big slow plans draw behind small quick ones
let drawOrder = [3, 2, 5, 6, 4, 1, 0];

function Shoal() {
  this.creatures = [];
  this.period = null; // set by populate()
  this.nextPeriod = null; // a change waiting until the set now leaving has gone
  this.births = []; // species still to spawn for the current period, one entry per creature, in draw order
  this.pending = 0;
  this.queue = []; // plankton about to light: { c, gen, at }
  this.grid = null; // the grid from the last run(), for spark()
}

// How many of a species this canvas should have.
Shoal.prototype.targetCount = function (species) {
  let info = speciesList[species];
  let r = rarityCount[info.rarity];
  if (info.plan === 0 && info.rarity === "common") r = planktonCount;
  let n = round(((width * height) / 100000) * r.perArea / info.size);
  return constrain(n, r.min, r.max);
};

// Fills the sea at the start with the current period's set, every
// creature already at its depth. Plans go in draw order so the list
// never needs sorting.
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

// Lists what is missing from a period's set, in draw order, as one
// entry per creature to be born. Species already alive (a set that
// was leaving and has been called back) are not born again.
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

// Births one creature below the screen, ready to rise.
Shoal.prototype.spawn = function (species) {
  let c = new Creature(random(width), height * random(1.1, 1.45), species);
  this.creatures.push(c);
  return c;
};

// The clock has crossed into another period. Everyone not in it
// starts sinking away, anyone of it who was sinking turns back, and
// whatever the new set is missing is queued to be born below the
// screen over the next frames. Anyone already out of sight is dropped
// at once.
//
// Only two sets may be alive: the one leaving and the one arriving.
// If a set is still leaving and the new period is a third one (the
// clock crossed two boundaries in under a swap), the change waits
// in nextPeriod until the leaving set has gone.
Shoal.prototype.changePeriod = function (period) {
  if (this.periodsAlive(period) > 2) {
    this.nextPeriod = period;
    return;
  }
  this.nextPeriod = null;
  this.period = period;
  for (let i = this.creatures.length - 1; i >= 0; i--) {
    let c = this.creatures[i];
    c.leaving = speciesList[c.species].period !== period;
    if (c.leaving && c.position.y > height + 40) this.creatures.splice(i, 1);
  }
  this.schedule(period);
};

// How many different periods would be alive if this one joined.
Shoal.prototype.periodsAlive = function (period) {
  let seen = [period];
  for (let i = 0; i < this.creatures.length; i++) {
    let p = speciesList[this.creatures[i].species].period;
    if (seen.indexOf(p) < 0) seen.push(p);
  }
  return seen.length;
};

Shoal.prototype.count = function (species) {
  let n = 0;
  for (let i = 0; i < this.creatures.length; i++) {
    if (this.creatures[i].species === species && !this.creatures[i].leaving) n++;
  }
  return n;
};

Shoal.prototype.countPlan = function (plan) {
  let n = 0;
  for (let i = 0; i < this.creatures.length; i++) {
    if (this.creatures[i].plan === plan) n++;
  }
  return n;
};

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
// One struck plankton lights its neighbours, which light theirs.
///////////////////////////////////////////////////////////////////

// Sea sparkle (Noctiluca) glows when disturbed, and one flash can
// set off the next. When one is struck it lights up to 3 unlit
// neighbours after a short delay, each of those lights 2, and each of
// those 1, every flash a little weaker. Each plankton only reacts to
// its nearest neighbours, but together they make a ring of light that
// spreads outward. This is emergence (week 7). The waiting lights sit
// in a queue, each marked with the frame it should go off. Any
// plankton species can pass the light on.

// Queues the nearest unlit plankton around "from". gen is the
// generation of "from"; the ones it lights are gen + 1.
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

// Lights whatever in the queue is due. Walks backwards so splice is safe.
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

// The piece opens above the water: a boat, the sky, the sun or the
// moon, the line hanging into the water. When the player starts, the
// camera sinks through the surface into the dark and stays there.
// The sky follows the real clock too.
//
// Techniques from class:
//   waves (week 4)          the surface is a sum of sine waves
//   noise (week 5)          marine snow drifts on a noise field
//   living forest (week 9)  one celestial body on a sine arc: the sun
//                           by day, the moon by night, with the
//                           crescent carved out by a sky-coloured disc
//
// Coordinates: y = 0 is the water surface, the sea runs from 0 down
// to the canvas height, and the sky is above 0 (negative y).
//
// The camera has a focus point and a zoom. The focus is the
// waterline under the boat. Above water the view is zoomed in 1.6
// times, with the boat in the middle and the waterline four fifths
// of the way down the screen. Under water the zoom is 1 and the
// world lines up exactly with the screen. The dive eases between
// the two, so the view widens to the whole sea as the camera arrives.

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
  this.view = { x0: 0, y0: 0, x1: width, y1: height }; // the world rectangle on screen
  this.skyH = max(1, (height * this.restY) / this.zoomSurface); // world height of sky visible at rest

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

Sea.prototype.begin = function () {
  if (this.state !== "surface") return;
  this.state = "diving";
  this.moveStart = millis();
  this.makeBubbles();
};

// The dive in reverse: back up to the boat, ready to begin() again.
Sea.prototype.surface = function () {
  if (this.state !== "under") return;
  this.state = "rising";
  this.moveStart = millis();
  this.makeBubbles();
};

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
// Turning world positions into screen positions, and back.
///////////////////////////////////////////////////////////////////

// screen = S + zoom * (world - F). F is the waterline under the boat,
// S is where F appears on the screen. As the dive goes from u = 0 to
// u = 1, S slides from the start screen's spot to F itself and the
// zoom eases from zoomSurface to 1, so under water nothing changes.

Sea.prototype.placeCamera = function () {
  let u = this.u;
  let ax = fline.anchorX;
  this.zoom = lerp(this.zoomSurface, 1, u);
  this.fx = ax;
  this.fy = 0;
  this.sx = lerp(width / 2, ax, u);
  this.sy = lerp(height * this.restY, 0, u);

  // the world rectangle that fills the screen, for skipping what is
  // off screen and for sizing the backgrounds
  let v = this.view;
  v.x0 = this.fx - this.sx / this.zoom;
  v.y0 = this.fy - this.sy / this.zoom;
  v.x1 = this.fx + (width - this.sx) / this.zoom;
  v.y1 = this.fy + (height - this.sy) / this.zoom;
};

// The world transform. draw() calls this inside push().
Sea.prototype.applyCamera = function () {
  translate(this.sx, this.sy);
  scale(this.zoom);
  translate(-this.fx, -this.fy);
};

// Screen to world, the exact reverse of applyCamera. The mouse gives
// screen pixels, but the lure lives in the world, so its target goes
// through this. That keeps the lure under the pointer at any zoom.
Sea.prototype.toWorld = function (sx, sy) {
  return {
    x: this.fx + (sx - this.sx) / this.zoom,
    y: this.fy + (sy - this.sy) / this.zoom
  };
};

///////////////////////////////////////////////////////////////////
// Clock colours
// Everything that reads the time of day.
///////////////////////////////////////////////////////////////////

// "night" is the migration value (eased), so colours never jump.
// The sun's height comes straight from the hour.

// Blend two [r, g, b] arrays. Arrays are cheaper than p5 colors here
// because this runs hundreds of times per repaint.
Sea.prototype.mix = function (a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
};

// How much the sun is near the horizon: 1 at sunrise and sunset, 0
// at noon and midnight. Drives the warm band in the sky.
Sea.prototype.dusk = function () {
  let e = -cos((tide.hour / 24) * TWO_PI); // sun height, 1 noon, -1 midnight
  let d = max(0, 1 - abs(e) / 0.3); // *** 0.3 = how long dusk lasts, as a fraction of the arc
  return d * d * (3 - 2 * d);
};

// Sky colour at t, 0 at the top of the visible sky (-skyH), 1 at the water.
Sea.prototype.skyColor = function (t) {
  let night = tide.migration;
  let top = this.mix([64, 126, 198], [3, 6, 18], night); // *** day and night sky, top
  let low = this.mix([168, 204, 228], [18, 30, 58], night); // *** day and night sky, horizon
  let c = this.mix(top, low, t * t);
  // the warm glow of dusk sits low and only when the sun is near the horizon
  let w = this.dusk() * t * t * 0.85;
  return this.mix(c, [236, 140, 84], w);
};

// Water colour at t, 0 at the surface, 1 at the bottom of the screen.
// Light falls off exponentially with depth, so the curve does too.
Sea.prototype.waterColor = function (t) {
  let night = tide.migration;
  let top = this.mix([16, 86, 134], [5, 18, 40], night); // *** day and night water, surface
  let low = this.mix([2, 10, 24], [1, 2, 6], night); // *** day and night water, bottom
  let k = (1 - exp(-2.4 * t)) / (1 - exp(-2.4));
  return this.mix(top, low, k);
};

// A tiny seeded random for the stars, so they never move or flicker
// and so we do not disturb p5's random() for the creatures.
// The sin-fract hash from shader folklore (The Book of Shaders,
// Patricio Gonzalez Vivo).
Sea.prototype.hash = function (n) {
  let v = sin(n * 12.9898 + 78.233) * 43758.5453;
  return v - floor(v);
};

// Phase of the real moon, 0 new, 0.5 full, from the date.
// Reference new moon 6 Jan 2000 18:14 UTC, synodic month 29.530588
// days (Meeus, Astronomical Algorithms).
Sea.prototype.moonPhase = function () {
  let days = Date.now() / 86400000 - 10962.76;
  let p = (days / 29.530588) % 1;
  return p < 0 ? p + 1 : p;
};

///////////////////////////////////////////////////////////////////
// Sky
// A cached gradient, seeded stars, and one sun or moon.
///////////////////////////////////////////////////////////////////

// The stars fade in with the night. The sun by day becomes the moon
// by night, arcing across the sky on a sine path set by the hour.

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

// Where the sun or moon is right now, in world coords. Shared with
// the reflection. p is 0 as it rises, 1 as it sets. The day arc runs
// 6 to 18, the night arc 18 to 6, and the jump between them happens
// below the horizon where nobody sees it. The arc spans the current
// view: something that far away does not shift when the boat drifts.
Sea.prototype.bodyPos = function () {
  let p = (((tide.hour - 6) % 12) + 12) % 12 / 12;
  let v = this.view;
  let x = lerp(v.x0 + (v.x1 - v.x0) * 0.1, v.x1 - (v.x1 - v.x0) * 0.1, p);
  let y = 14 - this.skyH * 0.8 * sin(p * PI); // *** 0.8 = how high the arc climbs
  return { x: x, y: y, p: p };
};

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
    fill(sky[0], sky[1], sky[2], 255 * night * night); // squared, so the dawn sun loses its bite early
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
// The moving waterline, the reflection, and the boat.
///////////////////////////////////////////////////////////////////

// The waterline is a sum of sines (waves, week 4). It is drawn inside
// renderWater so the boat can sit in it and the water can fill below it.

// Height of the surface at x, in world coords (negative is up).
// Three waves of different lengths and speeds, two running one way
// and one the other, so the pattern never repeats visibly.
Sea.prototype.surfaceY = function (x) {
  let t = millis() * 0.001;
  return sin(x * 0.012 + t * 0.9) * 3.2 + sin(x * 0.031 - t * 1.4) * 1.6 + sin(x * 0.0051 + t * 0.5) * 2.4; // *** wave sizes
};

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

// A thin trail of light under the sun or moon: a bright stretch of
// waterline and short dashes fading down into the water.
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

// A small dark boat at the top of the line. The line's anchor is at
// (fline.anchorX, -8), so the rod ends there and the hull sits just
// behind it, bobbing on the wave.
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
// The depth gradient, light shafts by day, and the dive band.
///////////////////////////////////////////////////////////////////

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

// Slanted columns of sunlight that sway slowly and fade with depth,
// drawn additively. They disappear as the migration rises.
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

// The underside of the surface as we pass through it: a bright band
// that swells and fades over the dive, and again on the way up.
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
// Marine snow, bubbles and depth haze, drawn over the creatures.
///////////////////////////////////////////////////////////////////

// The haze thickens toward the bottom, so deep things look far away.

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

// Bubbles are let go once, when the dive begins, and rise until
// they reach the waterline.
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

Sea.prototype.moveBubbles = function () {
  for (let i = this.bubbles.length - 1; i >= 0; i--) {
    let b = this.bubbles[i];
    b.y -= b.rise;
    b.x += sin(frameCount * 0.05 + b.ph) * 0.3;
    if (b.y < this.surfaceY(b.x) + b.r) this.bubbles.splice(i, 1);
  }
};

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
// The three background gradients, painted rarely and stretched.
///////////////////////////////////////////////////////////////////

// The sky, water and haze gradients are painted into narrow
// off-screen strips, one row per 3 pixels, and stretched across the
// canvas with image(). They are repainted every 20 frames and when
// the window changes size.

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
    let t = this.rows > 1 ? r / (this.rows - 1) : 0; // one row only when the canvas has no height yet
    let s = this.skyColor(t);
    this.skyG.fill(s[0], s[1], s[2]);
    this.skyG.rect(0, r, 2, 1);

    let w = this.waterColor(t);
    this.waterG.fill(w[0], w[1], w[2]);
    this.waterG.rect(0, r, 2, 1);

    // haze: nothing in the top third, then thickening to the bottom
    let h = constrain((t - 0.35) / 0.65, 0, 1);
    this.hazeG.fill(hazeCol[0], hazeCol[1], hazeCol[2], 200 * pow(h, 1.6)); // *** 200 = how thick the deep haze gets
    this.hazeG.rect(0, r, 2, 1);
  }
};

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
// audio context. The engine is adapted from the sound.js of our
// earlier haze project (same group, DM3008 2026): the same
// filter -> delay -> reverb -> limiter chain, scale helpers and the
// energy feedback value, with new voices for the seven body plans.
//
// A synth is an electronic instrument made from simple waves. Each
// body plan has its own kind, so you can tell what you hit by ear:
// FM synthesis (one wave bending another's pitch) gives the fish a
// glassy pluck, AM synthesis (one wave changing another's volume)
// gives the jelly a soft swell, and so on.

///////////////////////////////////////////////////////////////////
// Scale
// The notes the creatures are allowed to play.
///////////////////////////////////////////////////////////////////

// An A minor pentatonic scale. Its five notes have no clashing
// neighbours, so a crowd of creatures striking at once still sounds
// like one chord. A "step" counts up the scale: 0 is the root, 5 is
// the root one octave up, and negative steps go down.

let scaleSteps = [0, 3, 5, 7, 10]; // *** A minor pentatonic in semitones
let rootNote = 45; // *** scale step 0 as a midi number (45 = A2)

// Scale step index -> midi note. floor() keeps negative steps right.
function stepToMidi(step) {
  let n = scaleSteps.length;
  let octave = floor(step / n);
  let within = step - octave * n;
  return rootNote + octave * 12 + scaleSteps[within];
}

// Same formula p5.sound uses, so we don't need the addon for one function.
function midiToFreq(midi) {
  return 440 * pow(2, (midi - 69) / 12);
}

// The scale step above "step" that is a third (3 or 4 semitones) up,
// for the jelly's dyad. Pentatonic steps are sometimes a second
// apart, so we may have to skip one.
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
// Giving each of the 100 species its own note, without a table.
///////////////////////////////////////////////////////////////////

// Bigger species sit lower: about two scale steps down for every 0.5
// of size above 1, and higher below it. A fixed hash of the species
// number then nudges it one step up or down, so two species of the
// same size still differ. A species always lands on the same note.
// The giants of a plan (size 1.5 and up) always take the low nudge,
// so "the lowest note of all" in the field guide stays true.

let stepsPerSize = -4; // *** scale steps per 1.0 of size (negative: bigger is lower)
let pitchSeed = 311.7; // *** change to reshuffle which species sit high or low
// how far above or below its home note a plan is still comfortable, in steps
let planRange = [[-3, 3], [-3, 3], [-3, 3], [-3, 3], [-2, 3], [-3, 3], [-3, 2]];

// A number in 0..1 that is always the same for the same species index.
// The usual sin-and-fract one-liner from GLSL shaders (origin unknown,
// widely used), fine here because we only need it stable, not random.
function speciesHash(i) {
  let h = sin(i * 127.1 + pitchSeed) * 43758.5453;
  return h - floor(h);
}

// -1, 0 or 1 from the hash, so the nudge is always a whole scale step.
function speciesNudge(i) {
  return floor(speciesHash(i) * 3) - 1;
}

///////////////////////////////////////////////////////////////////
// VoicePool
// A fixed set of single-note synths, played in turn.
///////////////////////////////////////////////////////////////////

// Each voice can play one note at a time. The pool hands each new
// note to the next voice in line (modulo, week 3), and when all are
// busy it reuses the oldest one, so no note is ever refused. All the
// voices are built once, when the sound starts, so playing a note
// during a busy moment costs almost nothing. (Tone's PolySynth would
// build and throw away voices as it goes, which costs time exactly
// when the lure sweeps through a crowd.)

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

// Plays one note on the next voice and returns that voice, so the
// caller can bend its frequency afterwards (the eel does).
VoicePool.prototype.trigger = function (freq, duration, time, velocity) {
  let i = this.next;
  this.next = (this.next + 1) % this.voices.length;
  if (time <= this.started[i]) time = this.started[i] + 0.001;
  this.started[i] = time;
  this.voices[i].triggerAttackRelease(freq, duration, time, velocity);
  return this.voices[i];
};

///////////////////////////////////////////////////////////////////
// SoundEngine
// The synths, the effects chain, and the rules for playing a note.
///////////////////////////////////////////////////////////////////

// The signal path, like a row of effects pedals: one voice pool per
// body plan, each through its own panner (so a note comes from where
// the creature is, left or right), then a lowpass filter (muffles
// the sound), a feedback delay (an echo), a reverb (a large space),
// a limiter (stops it getting too loud) and the master volume. A
// quiet brown-noise rumble joins at the limiter so the sea is never
// silent.
//
// sound.energy measures how busy the music has been lately. The
// fish read it for the feedback loop: busy music scatters the schools.

function SoundEngine() {
  this.ready = false;
  this.muted = false;
  this.energy = 0;
  this.notesThisFrame = 0;

  this.maxNotesPerFrame = 4; // *** hard cap when the lure sweeps through a crowd
  // same order as bodyPlans: sparkle, fish, jelly, seapen, dragon, squid, eel
  this.gap = [45, 30, 150, 300, 500, 60, 250]; // *** ms between notes of one plan
  this.lastNoteAt = [-1e9, -1e9, -1e9, -1e9, -1e9, -1e9, -1e9];
  this.pools = [null, null, null, null, null, null, null]; // one VoicePool per plan, built one a frame after init()
  this.chime = null; // the squid's second pool, a sine on top of the jet
  this.building = []; // pools still to build, see update()
}

// Builds the chain and the voices. Has to run after Tone.start(),
// which toggleSound() calls from the first click.
SoundEngine.prototype.init = function () {
  if (this.ready) return;

  // the shared chain, built from the output back
  this.master = new Tone.Volume(-4).toDestination(); // *** overall level
  this.limiter = new Tone.Limiter(-6).connect(this.master);
  this.reverb = new Tone.Reverb({ decay: 7.5, wet: 0.5 }).connect(this.limiter); // *** the size of the water
  this.delay = new Tone.FeedbackDelay({ delayTime: 0.38, feedback: 0.32, wet: 0.22 }).connect(this.reverb); // *** echo off the deep
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

  // *** change the sound of each body plan here (same order as bodyPlans).
  // Each entry is built on its own frame by update(), so the click that
  // starts the dive never stalls. count = voices, then the volume in dB.
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
    // 3 - sea pen: a bowed pad. the filter envelope opens as the light runs up the stem (two voices a hit)
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
    { plan: 5, chime: true, count: 6, volume: -20, make: function () {
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
    } }
  ];

  this.ready = true;
};

// The feel of each period of the day, all subtle. Same order as
// dayPeriods: morning, afternoon, evening, night.
// *** change how the hour colours the sound here
let periodFeel = [
  { bright: 1.0, delay: 0.38, reverb: 0.6 }, // morning: wettest, like a wide calm sea at dawn
  { bright: 1.15, delay: 0.34, reverb: 0.45 }, // afternoon: a touch brighter and drier
  { bright: 0.95, delay: 0.42, reverb: 0.5 }, // evening: a little darker, the echo starts to stretch
  { bright: 1.0, delay: 0.5, reverb: 0.55 } // night: the longest echo off the deep
];

// migration: 0 (noon, creatures deep) to 1 (midnight, risen).
// By day the water is a muffled wall; at night it opens up and the
// rumble drops back so the notes can carry. On top of that the
// period of the day tints the filter, delay and reverb.
SoundEngine.prototype.setDepth = function (migration) {
  if (!this.ready) return;
  if (frameCount % 30 !== 0) return; // twice a second is plenty for a ramp

  let m = constrain(migration, 0, 1);
  if (m !== m) m = 1; // NaN guard
  let feel = this.feelNow();

  // exponential, because we hear pitch on a log scale
  let cutoff = 1400 * pow(3200 / 1400, m) * feel.bright; // *** muffle range, day to night
  this.filter.frequency.rampTo(cutoff, 1);
  this.rumbleGain.volume.rampTo(lerp(-30, -36, m), 1); // *** rumble by day, then by night
  this.delay.delayTime.rampTo(feel.delay, 1);
  this.reverb.wet.rampTo(feel.reverb, 1);
};

// The feel of the current period of the day.
SoundEngine.prototype.feelNow = function () {
  return periodFeel[dayPeriods.indexOf(periodOf(tide.hour))];
};

// Called once a frame, before the creatures check for strikes.
// Also builds one voice pool a frame until all are there, so the
// first seconds of the dive carry the cost instead of the first strike.
SoundEngine.prototype.update = function () {
  this.notesThisFrame = 0;
  this.energy *= 0.97; // *** how fast the music calms down

  if (this.building.length > 0) {
    let b = this.building.shift();
    let pool = new VoicePool(b.count, b.make, b.volume, this.panners[b.plan]);
    if (b.chime) this.chime = pool;
    else this.pools[b.plan] = pool;
  }
};

// How many scale steps above or below the plan's home note this
// species sits, always a whole number.
SoundEngine.prototype.speciesSteps = function (creature, plan) {
  let i = creature.species;
  let size = speciesList[i].size;
  let nudge = speciesNudge(i);
  if (size >= 1.5) nudge = -1; // the giants keep the lowest note of their plan
  let steps = round(stepsPerSize * (size - 1) + nudge);
  return constrain(steps, planRange[plan][0], planRange[plan][1]);
};

// Plays the voice for the creature the line just struck.
// Returns false when the note was skipped: the sound is not on yet
// or is muted, it is too soon after the last note of that plan, there
// were too many notes this frame, or the voices are still being built.
SoundEngine.prototype.play = function (creature) {
  if (!this.ready || this.muted) return false;
  if (this.notesThisFrame >= this.maxNotesPerFrame) return false;

  let plan = creature.plan;
  let x = creature.position.x;
  let y = creature.position.y;
  let gen = creature.gen;

  let now = millis();
  if (now - this.lastNoteAt[plan] < this.gap[plan]) return false;
  let pool = this.pools[plan];
  if (pool === null) return false; // still being built, a few frames after init()
  if (plan === 5 && this.chime === null) return false;
  this.lastNoteAt[plan] = now;
  this.notesThisFrame++;
  this.energy += 1;

  // the busier the music, the softer each new note, so a swarm stays comfortable
  let duck = 1 / (1 + this.energy * 0.05); // *** how hard a crowd gets turned down
  let pan = constrain(map(x, 0, width, -0.85, 0.85), -0.85, 0.85);
  this.panners[plan].pan.rampTo(pan, 0.02);

  let sp = this.speciesSteps(creature, plan);
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
    this.chime.trigger(midiToFreq(stepToMidi(step + 5)), 0.1, t + 0.02, 0.6 * duck);
  } else {
    // eel: bends up three semitones into its note as the body passes the line.
    // home is E2, low enough that the giants land under the dragon's A1
    let target = midiToFreq(stepToMidi(-3 + sp));
    let from = midiToFreq(stepToMidi(-3 + sp) - 3); // *** how far below the bend starts
    let voice = pool.trigger(from, 0.7, t, 0.6 * duck);
    voice.frequency.exponentialRampToValueAtTime(target, t + 0.4); // *** how long the bend takes
  }

  return true;
};

// Mutes at the very end of the chain, so the rumble goes quiet too.
SoundEngine.prototype.toggleMute = function () {
  this.muted = !this.muted;
  Tone.Destination.mute = this.muted;
};


///////////////////////////////////////////////////////////////////
// 9. INTERFACE
// Everything written or clickable on top of the sea.
///////////////////////////////////////////////////////////////////

// All of it is drawn with p5 (text, rect, circle); there is no HTML.
// A click is checked against each button's rectangle in
// mousePressed(). The small title and the clock are plain text. The
// field guide and the help are panels that collapse to their heading,
// with the round button at the end of the heading, a click anywhere
// on the heading, or the key shown beside the button. Keys are shown
// as capitals and matched in lowercase.
//
// Look: a serif face for titles (Georgia), a plain sans face for body
// text (Arial), pale text, and one glowing green for anything you can
// press. Panels are see-through dark rounded boxes with a pale border.
//
// The field guide's portraits come from Body(species, 1): seed 1, so
// a species' portrait is always the same. Portraits are grown one per
// frame, only for the guide page that is showing, and kept.

function Panels() {
  this.shown = { clock: true, guide: false, help: true }; // *** the guide starts closed, press G or its heading to open it
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
// Where every panel and button sits on the screen.
///////////////////////////////////////////////////////////////////

// One table of boxes that drawing and clicking both read, so a button
// is always clickable exactly where it is drawn. Each panel has h
// (open) and hh (collapsed, just the heading). Bottom panels hang
// from the bottom edge, so collapsing them keeps them there.

Panels.prototype.layout = function () {
  this.lastW = width;
  this.lastH = height;
  let m = 20; // *** margin from the canvas edge
  let p = this.pad;
  let b = {};

  // the new-log link. renderSurface places it under the start button
  b.resetLink = { x: m, y: m + 90, w: 90, h: 16 };

  // the start screen group, centred: the big title, the start button
  // under it, and the new-log link under that
  b.start = { x: width / 2 - 90, y: height * 0.42, w: 180, h: 48 }; // *** 0.42 = how far down the screen the button sits

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
  let detailH = height < 720 ? 36 : 88; // *** the detail strip, one line when space is short
  let gh = 44 + tabsH + 6 + gridH + 10 + detailH + 8;
  b.guide = { x: m, y: height - m - gh, w: gw, h: gh, hh: 44, anchor: "bottom", cell: cell, gap: gap, cols: cols, gridH: gridH, tabsH: tabsH, detailH: detailH };

  // help, bottom right. short, the keys sit on the panels now
  b.help = { x: width - m - 300, y: height - m - 96, w: 300, h: 96, hh: 44, anchor: "bottom" };

  this.boxes = b;
};

// The rectangle a block takes up right now, open or collapsed.
Panels.prototype.frame = function (name) {
  let b = this.boxes[name];
  let h = this.shown[name] ? b.h : b.hh;
  let y = b.anchor === "bottom" ? b.y + b.h - h : b.y;
  return { x: b.x, y: y, w: b.w, h: h };
};

// The heading strip of a panel, which is what you click to toggle it.
Panels.prototype.heading = function (name) {
  let f = this.frame(name);
  return { x: f.x, y: f.y, w: f.w, h: this.boxes[name].hh };
};

// The round collapse button at the right end of a heading frame.
Panels.prototype.buttonBox = function (f) {
  return { x: f.x + f.w - this.pad - 20, y: f.y + 12, w: 20, h: 20 };
};

// One tab of the guide.
Panels.prototype.tabBox = function (p) {
  let f = this.frame("guide");
  let b = this.boxes.guide;
  let w = (f.w - 2 * this.pad) / this.pages.length;
  return { x: f.x + this.pad + p * w, y: f.y + 44, w: w, h: b.tabsH };
};

// One portrait cell of the showing page, k is the cell number.
Panels.prototype.cellBox = function (k) {
  let f = this.frame("guide");
  let b = this.boxes.guide;
  let col = k % b.cols;
  let row = floor(k / b.cols);
  let top = f.y + 44 + b.tabsH + 6;
  return { x: f.x + this.pad + col * (b.cell + b.gap), y: top + row * (b.cell + b.gap), w: b.cell, h: b.cell };
};

Panels.prototype.inBox = function (b) {
  return mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h;
};

Panels.prototype.toggle = function (name) {
  if (this.shown[name] === undefined) return;
  this.shown[name] = !this.shown[name];
};

// The guide and the help only appear once the dive begins. The title
// and the clock stay, the time of day being the point of the piece.
Panels.prototype.panelAlpha = function (name) {
  if (name === "clock" || name === "title") return 1;
  return 1 - this.startAlpha;
};

// Which period of the day the clock is in, as an index into dayPeriods.
Panels.prototype.periodNow = function () {
  return dayPeriods.indexOf(periodOf(tide.hour));
};

// "Night . 22:00 to 05:00", with a middle dot. Escaped, since index.html
// sets no charset and a raw UTF-8 character would show as two
Panels.prototype.periodLabel = function (p) {
  let name = dayPeriods[p];
  let from = periodStarts[p];
  let to = periodStarts[(p + 1) % periodStarts.length];
  return name.charAt(0).toUpperCase() + name.slice(1) + " \u00b7 " + nf(from, 2) + ":00 to " + nf(to, 2) + ":00";
};

///////////////////////////////////////////////////////////////////
// The log
// Which species the player has found.
///////////////////////////////////////////////////////////////////

// Every strike calls unlock(). Only the first strike of a species
// does anything. The log lasts until the page is reloaded.

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

// How many of one page's species have been found.
Panels.prototype.pageCount = function (p) {
  let list = this.pages[p];
  let n = 0;
  for (let i = 0; i < list.length; i++) {
    if (this.found[list[i]]) n++;
  }
  return n;
};

// The Body that draws a species' portrait. Grown the first time the
// guide needs it, at most one per frame so a fresh page never stalls,
// and kept. null until then.
Panels.prototype.bodyFor = function (i) {
  if (this.bodies[i] !== undefined) return this.bodies[i];
  if (this.grewThisFrame) return null;
  this.grewThisFrame = true;
  this.bodies[i] = new Body(i, 1);
  return this.bodies[i];
};

///////////////////////////////////////////////////////////////////
// Render
// Drawn last each frame, on top of everything, in screen pixels.
///////////////////////////////////////////////////////////////////

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

// The surface text fades out over the first second of the dive and
// back in when the camera rises. One eased fade, retargeted whenever
// the sea changes state.
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

// A hand over anything pressable. The arrow stays on the surface, where
// the player aims the hold with it, and over panels. Under water there
// is no pointer at all, so the lure is the only thing that moves.
Panels.prototype.updateCursor = function () {
  if (this.hot) cursor(HAND);
  else if (this.startAlpha > 0 || this.hovering) cursor(ARROW);
  else noCursor();
};

///////////////////////////////////////////////////////////////////
// Drawing helpers
// Shared pieces, so every panel and button looks the same.
///////////////////////////////////////////////////////////////////

// Translucent dark rounded panel with a 1 px pale border.
Panels.prototype.panel = function (f, a) {
  stroke(this.pale[0], this.pale[1], this.pale[2], 55 * a);
  strokeWeight(1);
  fill(this.ink[0], this.ink[1], this.ink[2], 170 * a);
  rect(f.x, f.y, f.w, f.h, this.radius);
  noStroke();
};

// The heading controls: a key tag and the round collapse button at
// the right end of a frame. open decides between minus and plus,
// drawn as lines so no font or charset can turn them into boxes.
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

// Serif heading for a panel, italic so it reads as a title.
// Returns its width so something can sit after it.
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

// Body text, pale or muted.
Panels.prototype.body = function (str, x, y, w, size, muted, a) {
  textFont(this.sans);
  textAlign(LEFT, TOP);
  textSize(size);
  fill(this.pale[0], this.pale[1], this.pale[2], (muted ? 150 : 225) * a);
  text(str, x, y, w, 200);
};

// A small muted underlined link. Brightens when hovered and marks the
// pointer as over something pressable. Sets the box's width to the
// word's width, so hit-testing matches the drawing. Returns that width.
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

// The start button: a filled pill, the first thing to press on the surface.
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

// A species portrait. The grown body when there is one, a dot until then.
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

// A species not found yet: its dark shape, so you can tell something
// is there.
Panels.prototype.silhouette = function (i, x, y, size, a) {
  let body = this.bodyFor(i);
  if (body !== null) {
    body.renderSilhouette(x, y, size);
    return;
  }
  noStroke();
  fill(this.pale[0], this.pale[1], this.pale[2], 22 * a);
  circle(x, y, size * 0.36);
};

///////////////////////////////////////////////////////////////////
// Title
// The small title at the top left, under water.
///////////////////////////////////////////////////////////////////

// Small, so it never competes with the scene. On the surface the
// start screen draws its own big centred title instead, and the two
// cross-fade during the dive.

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
};

///////////////////////////////////////////////////////////////////
// Surface
// The start screen: big title, Start button, new-log link, hold ring.
///////////////////////////////////////////////////////////////////

// Shown above the water. It fades out over the first second of the
// dive and back in while rising. The ring fills around the pointer
// while it is held at the bottom of the screen, which also dives.

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
  let hold = diveHold;
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
// The time, the phase of the migration, the period, and the sound toggle.
///////////////////////////////////////////////////////////////////

// Plain text at the top right. T hides the whole block.

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
  let on = soundOn();
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
// The field guide and the help.
///////////////////////////////////////////////////////////////////

Panels.prototype.renderGuide = function (a) {
  let f = this.frame("guide");
  let b = this.boxes.guide;
  let p = this.pad;
  this.panel(f, a);
  let tw = this.title("Field guide", f.x + p, f.y + 11, 20, a);
  this.body(this.foundCount + " of " + speciesList.length, f.x + p + tw + 12, f.y + 17, 120, 12, true, a);
  if (!this.shown.guide) return;

  this.renderTabs(a);

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
  let dy = f.y + 44 + b.tabsH + 6 + b.gridH + 10;
  let show = this.hoverCell >= 0 ? this.hoverCell : this.selected;
  stroke(this.pale[0], this.pale[1], this.pale[2], 30 * a);
  strokeWeight(1);
  line(f.x + p, dy - 5, f.x + f.w - p, dy - 5);
  noStroke();
  if (b.detailH < 60) this.renderDetailLine(show, f.x + p, dy, f.w - 2 * p, a);
  else this.renderDetail(show, f.x + p, dy, f.w - 2 * p, a);
};

// The four pages. The one for the hour on the clock says "now".
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

// One species written out: portrait, latin name, common name, blurb.
// A locked one shows only a "?", an empty log shows a hint.
Panels.prototype.renderDetail = function (i, x, y, w, a) {
  if (i < 0) {
    this.body("Brush a creature with the line to add it to the log.", x, y + 8, w, 12, true, a);
    return;
  }
  let s = speciesList[i];
  let px = x + 30;
  let py = y + 40;
  let tx = x + 64;
  if (!this.found[i]) {
    this.silhouette(i, px, py, 48, a);
    textFont(this.serif);
    textStyle(ITALIC);
    textAlign(LEFT, TOP);
    textSize(22);
    fill(this.pale[0], this.pale[1], this.pale[2], 200 * a);
    text("?", tx, y + 6);
    textStyle(NORMAL);
    this.body("Not found yet.", tx, y + 40, w - 64, 11, true, a);
    return;
  }
  this.portrait(i, px, py, 52, a);

  // latin name in italic serif, the common name after it in the species colour
  textFont(this.serif);
  textStyle(ITALIC);
  textAlign(LEFT, TOP);
  textSize(15);
  fill(this.pale[0], this.pale[1], this.pale[2], 235 * a);
  text(s.latin, tx, y + 4);
  let lw = textWidth(s.latin);
  textStyle(NORMAL);
  textFont(this.sans);
  textSize(11);
  fill(s.col[0], s.col[1], s.col[2], 220 * a);
  text(s.name.toUpperCase(), tx + lw + 10, y + 8);
  this.body(s.blurb, tx, y + 26, w - 64, 11, true, a);
};

// The same on one line, for short screens: no blurb.
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
  textFont(this.serif);
  textStyle(ITALIC);
  textAlign(LEFT, TOP);
  textSize(14);
  fill(this.pale[0], this.pale[1], this.pale[2], 235 * a);
  text(s.latin, tx, y + 5);
  let lw = textWidth(s.latin);
  textStyle(NORMAL);
  textFont(this.sans);
  textSize(10);
  fill(s.col[0], s.col[1], s.col[2], 220 * a);
  text(s.name.toUpperCase(), tx + lw + 10, y + 9);
};

Panels.prototype.renderHelp = function (a) {
  let f = this.frame("help");
  let p = this.pad;
  this.panel(f, a);
  this.title("How to play", f.x + p, f.y + 11, 20, a);
  if (!this.shown.help) return;
  this.body("move the mouse to steer the lure", f.x + p, f.y + 50, f.w - 2 * p, 12, false, a);
  this.body("M sound   B back up   G guide   T clock", f.x + p, f.y + 70, f.w - 2 * p, 12, true, a);
};

// "New: Firefly squid" floats above the guide for a moment.
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
// Interface input
// Clicks and keys for the interface, checked before anything else.
///////////////////////////////////////////////////////////////////

// The Main section asks here first, and leaves the lure alone when
// this answers true.

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
      toggleSound();
      return true;
    }
  }

  let names = ["guide", "help"];
  for (let i = 0; i < names.length; i++) {
    let n = names[i];
    if (this.panelAlpha(n) <= 0.5) continue; // not visible yet, so not clickable
    if (n === "guide" && this.shown.guide) {
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

// *** the key map, in lowercase (keyPressed() lowercases the key first).
// Unused keys return false so keyPressed() can use them
Panels.prototype.keyPressed = function (k) {
  if (k === "g") this.toggle("guide");
  else if (k === "t") this.toggle("clock");
  else if (k === "i") this.toggle("help");
  else return false;
  return true;
};


///////////////////////////////////////////////////////////////////
// 10. MAIN
// The global state, setup(), the draw order, diving and the sound.
///////////////////////////////////////////////////////////////////

// The objects that make up the piece. Each is built in setup().
let tide;
let fline; // the fishing line (not "line", that is a p5 function)
let shoal;
let grid;
let sea;
let sound;
let ui;

let lastSeaState = ""; // sea.state last frame, to catch the moment the camera comes to rest
let lastMove = -1e9; // ms when the pointer last moved, for the autopilot

let diveZone = 0.85; // *** the bottom of the screen below this fraction is the dive zone
let diveHoldMs = 1500; // *** how long to hold the lure there before diving
let diveSince = -1; // ms when the pointer entered the dive zone
let diveHold = 0; // 0 to 1, how far through the hold. The interface draws it as a ring

function setup() {
  createCanvas(windowWidth, windowHeight);

  tide = new Tide();
  tide.update();
  tide.migration = tide.target(); // start where the clock says, no fade in

  grid = new Grid(60); // *** keep >= the biggest neighbour distance in Creatures
  sound = new SoundEngine();
  buildWorld();
}

// Everything that depends on the canvas size. Called from setup(),
// and again from windowResized() if the canvas had no size when
// setup() ran (some pages embed it that way), since then the line,
// the sea and every creature would have been built in one corner.
function buildWorld() {
  fline = new FishingLine(width / 2, height * 0.42);
  sea = new Sea();
  ui = new Panels();
  shoal = new Shoal();
  shoal.populate();
}

// One frame. First everything updates, then the world is drawn
// through the sea's camera, back to front, then the interface on top.
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

  // the world, seen through the sea's camera: zoomed in above the
  // water, or settled under it
  push();
  sea.applyCamera();
  sea.renderSky();
  sea.renderWater();
  shoal.run(grid);
  sea.renderFog();
  fline.render();
  pop();

  ui.render();
}

// Going down and coming back up by holding the lure still.
// On the surface, holding the pointer in the bottom band of the screen
// for diveHoldMs lowers the line, without turning the sound on. Under
// water, keeping it at the top edge for a second brings it back to the
// boat, as does the B key.
let topEdgeSince = -1; // ms when the lure target first touched the top edge

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
    else if (millis() - topEdgeSince > 1000) surfaceAgain(); // *** 1000 = ms to hold at the top edge
  } else {
    topEdgeSince = -1;
  }
}

// When nobody touches it for a while the line wanders on its own,
// following slow noise (week 5), so it keeps playing as an installation.
let autoX = -1; // the autopilot's own target, in screen pixels
let autoY = -1;

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

// Lowers the line. The Start button and the hold at the bottom of
// the surface screen both call this.
function beginDive() {
  if (sea.state !== "surface") return;
  sea.begin();
  diveSince = -1;
  diveHold = 0;
  lastMove = millis();
}

// The Start button, the sound toggle and the M key. Browsers only let
// audio start from a click or a key press, so the first press starts
// Tone.js and builds the synths; after that it mutes and unmutes.
function toggleSound() {
  if (!sound.ready) {
    Tone.start();
    sound.init();
    if (sound.muted) sound.toggleMute();
    return;
  }
  sound.toggleMute();
}

// True when sound is actually playing, for the toggle's label.
function soundOn() {
  return sound.ready && !sound.muted;
}

// Back up to the boat. The guide keeps what you have found, and you
// can lower the line again.
function surfaceAgain() {
  if (sea.state !== "under") return;
  sea.surface();
  topEdgeSince = -1;
}

///////////////////////////////////////////////////////////////////
// 11. INPUT
// The mouse, the keys, and changes to the window size.
///////////////////////////////////////////////////////////////////

// Any mouse movement counts as someone playing, so the autopilot waits.
function mouseMoved() {
  lastMove = millis();
  autoX = -1; // next autopilot starts from wherever the mouse left the lure
}

function mouseDragged() {
  lastMove = millis();
}

function mousePressed() {
  if (ui.mousePressed()) return; // the click was on a panel or a button
  lastMove = millis();
}

// G, I and T go to the interface first; M and B are handled here.
function keyPressed() {
  // the keys are shown as capitals, so accept them with or without Shift
  let k = key.toLowerCase();
  if (ui.keyPressed(k)) return;
  if (k === "m") toggleSound();
  if (k === "b") surfaceAgain();
}

// Keeps the canvas filling the window. If it had no size when the
// piece started, the whole world is built again at the new size.
function windowResized() {
  let wasEmpty = width < 2 || height < 2;
  resizeCanvas(windowWidth, windowHeight);
  if (wasEmpty && width > 1 && height > 1) buildWorld();
  else sea.resize();
}
