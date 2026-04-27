const RAW = [
  // Lower-body — squats / lunges
  { aliases: ['squat', 'back squat', 'barbell squat'], muscles: 'Quads, glutes, core', cue: 'Brace core, sit hips back, knees track over toes, drive through midfoot.', sub: 'Goblet squat or bodyweight squat' },
  { aliases: ['front squat'], muscles: 'Quads, upper back, core', cue: 'High elbows, vertical torso, sit straight down between hips.', sub: 'Goblet squat' },
  { aliases: ['goblet squat'], muscles: 'Quads, glutes, core', cue: 'Hold weight at chest, elbows in, sit between hips, full depth.', sub: 'Bodyweight squat' },
  { aliases: ['bulgarian split squat', 'rear foot elevated split squat', 'bss'], muscles: 'Quads, glutes, adductors', cue: 'Front shin vertical at bottom, drop straight down, drive through whole foot.', sub: 'Reverse lunge' },
  { aliases: ['lunge', 'walking lunge', 'forward lunge'], muscles: 'Quads, glutes, hamstrings', cue: 'Long stride, knee tracks over front foot, torso upright.', sub: 'Reverse lunge' },
  { aliases: ['reverse lunge'], muscles: 'Quads, glutes', cue: 'Step back, drop back knee straight down, push through front heel.', sub: 'Stationary split squat' },
  { aliases: ['step up', 'step-up'], muscles: 'Quads, glutes', cue: 'Drive through heel of top foot — minimize push-off from bottom leg.', sub: 'Reverse lunge' },
  { aliases: ['box jump'], muscles: 'Quads, glutes, calves', cue: 'Soft landing, full hip extension at top, step down (don\'t jump down).', sub: 'Squat jump' },
  { aliases: ['pistol squat', 'single leg squat'], muscles: 'Quads, glutes, core', cue: 'Free leg straight forward, sit hips back, control descent.', sub: 'Bench-assisted single-leg squat' },

  // Lower-body — hinge
  { aliases: ['deadlift', 'conventional deadlift'], muscles: 'Hamstrings, glutes, back, core', cue: 'Bar over midfoot, brace, push the floor away — chest up, neutral spine.', sub: 'Trap bar deadlift or Romanian deadlift' },
  { aliases: ['romanian deadlift', 'rdl'], muscles: 'Hamstrings, glutes, low back', cue: 'Soft knees, hips back, bar grazes legs, feel hamstring stretch.', sub: 'Single-leg RDL with dumbbells' },
  { aliases: ['single leg rdl', 'single-leg rdl', 'sl rdl'], muscles: 'Hamstrings, glutes, balance', cue: 'Hinge at hip, free leg straight back, hips square to floor.', sub: 'Two-leg RDL' },
  { aliases: ['trap bar deadlift', 'hex bar deadlift'], muscles: 'Quads, glutes, hamstrings, traps', cue: 'Stand inside bar, brace, drive floor away — neutral spine throughout.', sub: 'Conventional deadlift' },
  { aliases: ['kettlebell swing', 'kb swing', 'swing'], muscles: 'Glutes, hamstrings, posterior chain', cue: 'Hinge (not squat), snap hips at top, bell floats — arms are ropes.', sub: 'KB deadlift' },
  { aliases: ['hip thrust', 'barbell hip thrust'], muscles: 'Glutes, hamstrings', cue: 'Shoulders on bench, ribs down, full hip extension, squeeze glutes hard.', sub: 'Glute bridge' },
  { aliases: ['glute bridge'], muscles: 'Glutes, hamstrings', cue: 'Heels under knees, drive through heels, finish at full hip extension.', sub: 'Single-leg glute bridge' },
  { aliases: ['good morning'], muscles: 'Hamstrings, low back, glutes', cue: 'Soft knees, hinge at hips, neutral spine — don\'t round low back.', sub: 'Romanian deadlift' },

  // Calves
  { aliases: ['calf raise', 'standing calf raise'], muscles: 'Calves', cue: 'Full range — pause at top, control the lower, no bouncing.', sub: 'Single-leg calf raise' },

  // Push — horizontal
  { aliases: ['bench press', 'barbell bench press'], muscles: 'Chest, triceps, front delts', cue: 'Feet planted, shoulder blades pinched, bar to lower chest, drive feet.', sub: 'Dumbbell bench press' },
  { aliases: ['dumbbell bench press', 'db bench'], muscles: 'Chest, triceps, front delts', cue: 'Slight arch, lower under control, dumbbells slightly inside shoulder line.', sub: 'Push-up' },
  { aliases: ['incline bench press', 'incline press'], muscles: 'Upper chest, front delts, triceps', cue: '30-45° bench, bar/db to upper chest, control descent.', sub: 'Incline push-up' },
  { aliases: ['push up', 'push-up', 'pushup'], muscles: 'Chest, triceps, core', cue: 'Plank from head to heel, elbows ~45°, full range to chest at floor.', sub: 'Knee push-up or hand-elevated push-up' },
  { aliases: ['dip', 'dips'], muscles: 'Chest, triceps, front delts', cue: 'Slight forward lean for chest, vertical for tris — controlled descent.', sub: 'Bench dip' },
  { aliases: ['chest fly', 'dumbbell fly'], muscles: 'Chest', cue: 'Soft elbows fixed in slight bend, wide arc, feel stretch at bottom.', sub: 'Cable fly' },

  // Push — vertical
  { aliases: ['overhead press', 'ohp', 'shoulder press', 'military press'], muscles: 'Shoulders, triceps, core', cue: 'Brace core/glutes, bar/db over crown of head — ribs stacked over hips.', sub: 'Half-kneeling press' },
  { aliases: ['push press'], muscles: 'Shoulders, triceps, legs', cue: 'Short dip, drive with legs, lock out overhead aggressively.', sub: 'Strict overhead press' },
  { aliases: ['lateral raise', 'side raise'], muscles: 'Side delts', cue: 'Slight forward lean, lead with elbows, light weight, full control.', sub: 'Cable lateral raise' },
  { aliases: ['rear delt fly', 'reverse fly'], muscles: 'Rear delts, upper back', cue: 'Hinge forward, soft elbows, squeeze shoulder blades — don\'t shrug.', sub: 'Face pull' },
  { aliases: ['face pull'], muscles: 'Rear delts, upper back', cue: 'Pull rope to face, elbows high, externally rotate at end range.', sub: 'Band pull-apart' },

  // Pull — vertical
  { aliases: ['pull up', 'pull-up', 'pullup'], muscles: 'Lats, biceps, upper back', cue: 'Full hang to chin over bar, lead with chest, no kipping.', sub: 'Banded pull-up or lat pulldown' },
  { aliases: ['chin up', 'chin-up'], muscles: 'Biceps, lats', cue: 'Underhand grip, full hang, drive elbows down to ribs.', sub: 'Banded chin-up' },
  { aliases: ['lat pulldown', 'pulldown'], muscles: 'Lats, biceps', cue: 'Slight lean back, drive elbows down — don\'t pull with arms.', sub: 'Pull-up' },

  // Pull — horizontal
  { aliases: ['barbell row', 'bent over row', 'bent-over row'], muscles: 'Mid back, lats, biceps', cue: 'Hinge to ~45°, neutral spine, pull bar to lower ribs.', sub: 'Dumbbell row' },
  { aliases: ['dumbbell row', 'db row', 'one arm row', 'single-arm row'], muscles: 'Lats, mid back, biceps', cue: 'Stable spine, drive elbow back along ribs, full stretch at bottom.', sub: 'Seated cable row' },
  { aliases: ['seated cable row', 'cable row'], muscles: 'Mid back, lats, biceps', cue: 'Tall spine, retract shoulder blades first, then pull elbows back.', sub: 'Inverted row' },
  { aliases: ['inverted row'], muscles: 'Mid back, lats, biceps', cue: 'Body straight, chest to bar, control the lower.', sub: 'Ring row at higher angle' },

  // Arms
  { aliases: ['bicep curl', 'biceps curl', 'dumbbell curl'], muscles: 'Biceps', cue: 'Elbows pinned to ribs, control the lower, no swinging.', sub: 'Hammer curl' },
  { aliases: ['hammer curl'], muscles: 'Biceps, brachialis, forearms', cue: 'Neutral grip, elbows fixed, full range.', sub: 'Bicep curl' },
  { aliases: ['triceps pushdown', 'tricep pushdown', 'pushdown'], muscles: 'Triceps', cue: 'Elbows pinned to sides, full extension at bottom.', sub: 'Diamond push-up' },
  { aliases: ['triceps extension', 'overhead triceps extension', 'skull crusher'], muscles: 'Triceps', cue: 'Elbows fixed and high, full stretch overhead.', sub: 'Tricep pushdown' },

  // Core
  { aliases: ['plank'], muscles: 'Core, shoulders', cue: 'Ribs down, glutes squeezed, straight line head-to-heel — quality over time.', sub: 'Knee plank' },
  { aliases: ['side plank'], muscles: 'Obliques, core', cue: 'Stack hips, push floor away with bottom shoulder, hips up.', sub: 'Knee side plank' },
  { aliases: ['hanging leg raise', 'leg raise'], muscles: 'Core, hip flexors', cue: 'No swing, posterior pelvic tilt, raise legs to 90°+.', sub: 'Knee raise' },
  { aliases: ['ab wheel', 'rollout', 'ab rollout'], muscles: 'Core, lats', cue: 'Ribs tucked, no low-back sag, only roll as far as you can return.', sub: 'Plank' },
  { aliases: ['dead bug'], muscles: 'Core (anti-extension)', cue: 'Low back glued to floor, slow opposite arm/leg, exhale on extension.', sub: 'Bird dog' },
  { aliases: ['bird dog'], muscles: 'Core, glutes, low back', cue: 'Square hips, opposite arm/leg slow and level — no rotation.', sub: 'Dead bug' },
  { aliases: ['russian twist'], muscles: 'Obliques', cue: 'Tall spine (don\'t round), rotate from ribs not arms.', sub: 'Side plank with rotation' },
  { aliases: ['farmer carry', "farmer's carry", 'farmer walk'], muscles: 'Grip, traps, core', cue: 'Tall posture, ribs stacked, brisk pace — don\'t let shoulders shrug.', sub: 'Suitcase carry' },

  // Conditioning / HIIT
  { aliases: ['burpee'], muscles: 'Full body', cue: 'Pace yourself — chest to floor, full extension at top.', sub: 'Squat thrust (no jump)' },
  { aliases: ['mountain climber'], muscles: 'Core, hip flexors, conditioning', cue: 'Strong plank, drive knees to chest fast — hips low.', sub: 'Slow plank with knee drive' },
  { aliases: ['jump rope', 'jumping rope', 'skipping'], muscles: 'Calves, conditioning', cue: 'Small jumps off balls of feet, wrists do the work.', sub: 'Marching in place' },
  { aliases: ['rowing', 'row erg', 'rower', 'row', 'm row'], muscles: 'Full body, conditioning', cue: 'Legs → back → arms; reverse on return. Power from legs.', sub: 'Stationary bike' },
  { aliases: ['squat jump', 'jump squat'], muscles: 'Quads, glutes, calves', cue: 'Full depth, explosive up, soft landing — reset between reps.', sub: 'Bodyweight squat' },
  { aliases: ['tuck jump'], muscles: 'Quads, calves, core', cue: 'Drive knees to chest, soft landing, minimal ground contact.', sub: 'Squat jump' },
  { aliases: ['broad jump'], muscles: 'Glutes, quads, calves', cue: 'Big arm swing, full hip extension, stick the landing.', sub: 'Squat jump' },
  { aliases: ['skater', 'skater jump', 'lateral bound'], muscles: 'Glutes, quads, balance', cue: 'Push off outside leg, land soft on opposite, hold balance briefly.', sub: 'Lateral step' },
  { aliases: ['high knees'], muscles: 'Hip flexors, calves, conditioning', cue: 'Knees to hip height, fast feet, tall posture.', sub: 'Marching in place' },
  { aliases: ['butt kick', 'butt kicks'], muscles: 'Hamstrings, calves', cue: 'Heels to glutes, fast feet, stay on balls of feet.', sub: 'Marching in place' },
  { aliases: ['sprint', 'sprints'], muscles: 'Full body, anaerobic', cue: 'Drive arms, full power for the work interval, walk to recover.', sub: 'Tempo run intervals' },
  { aliases: ['shuttle run'], muscles: 'Conditioning, agility', cue: 'Low hips at turns, plant outside foot, accelerate hard out.', sub: 'Steady jog' },
  { aliases: ['battle rope', 'battle ropes'], muscles: 'Shoulders, core, conditioning', cue: 'Stay low in athletic stance, brace core, full waves to the anchor.', sub: 'Shadow boxing' },
  { aliases: ['sled push', 'sled drive'], muscles: 'Quads, glutes, conditioning', cue: 'Low body angle, drive knees, full hip extension on each step.', sub: 'Hill walk' },
  { aliases: ['sled pull', 'sled drag'], muscles: 'Hamstrings, glutes, back', cue: 'Stay tall, short fast steps, pull through hip extension.', sub: 'Heavy walk' },
  { aliases: ['thruster'], muscles: 'Full body', cue: 'Squat to overhead — let leg drive launch the press, full lockout.', sub: 'Squat + press separately' },
  { aliases: ['wall ball'], muscles: 'Quads, glutes, shoulders', cue: 'Squat depth, drive ball up, catch into next squat — one continuous move.', sub: 'Goblet squat' },
  { aliases: ['med ball slam', 'medicine ball slam', 'slam ball'], muscles: 'Core, shoulders, lats', cue: 'Reach tall overhead, slam hard, exhale on impact.', sub: 'Russian twist' },
  { aliases: ['bear crawl'], muscles: 'Core, shoulders, conditioning', cue: 'Knees hover an inch off floor, opposite arm/leg, hips low.', sub: 'Crawling on knees' },

  // Boxing
  { aliases: ['shadow box', 'shadow boxing', 'shadowbox'], muscles: 'Conditioning, coordination', cue: 'Hands up, chin tucked, work footwork and combos — pretend the bag is dodging.', sub: 'Light footwork drills' },
  { aliases: ['heavy bag', 'heavy bag work', 'bag work'], muscles: 'Full body, conditioning', cue: 'Stay light on feet, exhale on every punch, vary combos and tempo.', sub: 'Shadow boxing' },
  { aliases: ['speed bag'], muscles: 'Shoulders, coordination', cue: 'Strike on the rebound, elbows up, find the rhythm before adding speed.', sub: 'Shadow boxing' },
  { aliases: ['double end bag', 'double-end bag'], muscles: 'Coordination, timing', cue: 'Track the bag, throw single shots first, build to combos.', sub: 'Shadow boxing' },
  { aliases: ['jab'], muscles: 'Shoulders, core', cue: 'Snap from the shoulder, return to guard fast, exhale on impact.', sub: 'Shadow jabs in front of mirror' },
  { aliases: ['cross', 'straight right', 'straight'], muscles: 'Shoulders, core, hips', cue: 'Rotate hips and back foot, full extension, return to guard.', sub: 'Shadow cross' },
  { aliases: ['hook', 'left hook', 'right hook'], muscles: 'Obliques, shoulders', cue: 'Pivot lead foot, elbow at shoulder height, rotate from the hips.', sub: 'Shadow hook' },
  { aliases: ['uppercut'], muscles: 'Legs, core, shoulders', cue: 'Slight knee bend, drive up through hips, palm up at impact.', sub: 'Shadow uppercut' },
  { aliases: ['jab cross', 'jab-cross', '1-2', 'one two'], muscles: 'Full body, conditioning', cue: 'Jab to set up, rotate fully into the cross, return to guard.', sub: 'Shadow jab-cross' },
  { aliases: ['slip', 'slips'], muscles: 'Core, legs, defense', cue: 'Bend at the knees, not the waist — keep eyes on target.', sub: 'Lateral steps' },
  { aliases: ['roll', 'rolls'], muscles: 'Legs, core, defense', cue: 'Bend, dip under the imaginary punch, come up on the other side.', sub: 'Squat with head movement' },
  { aliases: ['boxing combo', 'punch combo', 'combo'], muscles: 'Full body, conditioning', cue: 'Tight technique first, exhale every punch, return to guard between.', sub: 'Single jab/cross' },
  { aliases: ['footwork', 'boxing footwork'], muscles: 'Calves, balance', cue: 'Stay light, in-out and side-to-side, never cross your feet.', sub: 'Marching in place' },

  // Home workout — bodyweight & resistance bands
  { aliases: ['band squat', 'banded squat', 'resistance band squat'], muscles: 'Quads, glutes', cue: 'Band under both feet, ends at shoulders — sit hips back, drive up against tension.', sub: 'Bodyweight squat' },
  { aliases: ['band deadlift', 'banded deadlift'], muscles: 'Hamstrings, glutes, back', cue: 'Stand on band, hinge at hips, neutral spine — drive floor away to lock out.', sub: 'Single-leg RDL bodyweight' },
  { aliases: ['band romanian deadlift', 'band rdl', 'banded rdl'], muscles: 'Hamstrings, glutes', cue: 'Soft knees, hinge until you feel hamstring stretch, ribs over hips.', sub: 'Bodyweight good morning' },
  { aliases: ['band good morning'], muscles: 'Hamstrings, low back, glutes', cue: 'Band on traps, hinge at hips with neutral spine — soft knees throughout.', sub: 'Glute bridge' },
  { aliases: ['band glute bridge', 'banded glute bridge'], muscles: 'Glutes, hamstrings', cue: 'Band above knees, drive knees out, full hip extension — squeeze glutes hard.', sub: 'Bodyweight glute bridge' },
  { aliases: ['banded hip thrust', 'band hip thrust'], muscles: 'Glutes, hamstrings', cue: 'Shoulders elevated, band above knees, push knees out at top.', sub: 'Glute bridge' },
  { aliases: ['banded lateral walk', 'band lateral walk', 'monster walk', 'crab walk'], muscles: 'Glute medius, hips', cue: 'Band above knees, athletic stance, small steps with constant tension.', sub: 'Side-lying clamshell' },
  { aliases: ['clamshell', 'band clamshell'], muscles: 'Glute medius, hips', cue: 'Side-lying, band above knees, open top knee without rolling pelvis.', sub: 'Side-lying leg raise' },
  { aliases: ['fire hydrant'], muscles: 'Glute medius, core', cue: 'Square hips, lift bent leg sideways — keep back flat, no rotation.', sub: 'Clamshell' },
  { aliases: ['donkey kick', 'glute kickback'], muscles: 'Glutes, hamstrings', cue: 'Hips square, drive heel up to ceiling, squeeze glute at top.', sub: 'Glute bridge' },
  { aliases: ['wall sit'], muscles: 'Quads, glutes', cue: 'Knees at 90°, back flat against wall, weight in heels — breathe.', sub: 'Bodyweight squat hold' },
  { aliases: ['split squat', 'stationary lunge'], muscles: 'Quads, glutes', cue: 'Long stance, drop back knee straight down, torso upright.', sub: 'Bodyweight squat' },
  { aliases: ['jumping jack', 'jumping jacks'], muscles: 'Full body, conditioning', cue: 'Stay tall, full arm range overhead, soft landings.', sub: 'Step-out jacks' },
  { aliases: ['band row', 'banded row', 'resistance band row'], muscles: 'Mid back, lats, biceps', cue: 'Anchor band low, hinge slightly, drive elbows back along ribs.', sub: 'Inverted row under table' },
  { aliases: ['band pull apart', 'band pull-apart'], muscles: 'Rear delts, upper back', cue: 'Arms straight, pull band to chest level — squeeze shoulder blades.', sub: 'Reverse fly with light weight' },
  { aliases: ['band face pull'], muscles: 'Rear delts, upper back', cue: 'Anchor at face height, pull to forehead, elbows high — externally rotate.', sub: 'Band pull-apart' },
  { aliases: ['band overhead press', 'band shoulder press'], muscles: 'Shoulders, triceps', cue: 'Stand on band, press straight up — ribs stacked over hips, no arch.', sub: 'Pike push-up' },
  { aliases: ['band lateral raise'], muscles: 'Side delts', cue: 'Stand on band, lead with elbows, slight forward lean.', sub: 'Lateral raise with water bottles' },
  { aliases: ['band chest press', 'band bench press'], muscles: 'Chest, triceps, front delts', cue: 'Anchor behind, press forward to full extension — control return.', sub: 'Push-up' },
  { aliases: ['band bicep curl', 'band curl'], muscles: 'Biceps', cue: 'Stand on band, elbows pinned, curl with control — no swinging.', sub: 'Bodyweight isometric curl' },
  { aliases: ['band triceps extension', 'band tricep extension', 'band pushdown'], muscles: 'Triceps', cue: 'Anchor overhead, elbows pinned, extend fully at bottom.', sub: 'Diamond push-up' },
  { aliases: ['pike push up', 'pike push-up'], muscles: 'Shoulders, triceps', cue: 'Hips high in pike, lower head between hands, press back up.', sub: 'Incline push-up' },
  { aliases: ['decline push up', 'decline push-up', 'feet elevated push-up'], muscles: 'Upper chest, shoulders, triceps', cue: 'Feet on chair, plank line, elbows ~45° — full range to floor.', sub: 'Push-up' },
  { aliases: ['diamond push up', 'diamond push-up'], muscles: 'Triceps, chest', cue: 'Hands form a diamond under chest, elbows tight to ribs.', sub: 'Knee diamond push-up' },
  { aliases: ['superman'], muscles: 'Low back, glutes', cue: 'Lift arms and legs together, squeeze glutes — hold briefly at top.', sub: 'Bird dog' },
  { aliases: ['hollow hold', 'hollow body'], muscles: 'Core (anti-extension)', cue: 'Low back glued to floor, arms and legs extended — quality over time.', sub: 'Dead bug' },
  { aliases: ['crunch', 'sit up', 'sit-up'], muscles: 'Abs', cue: 'Curl ribs to hips, exhale at top, slow on the way down.', sub: 'Dead bug' },
  { aliases: ['flutter kick', 'flutter kicks'], muscles: 'Lower abs, hip flexors', cue: 'Low back pinned, small fast scissor kicks — breathe.', sub: 'Dead bug' },
  { aliases: ['v up', 'v-up'], muscles: 'Abs, hip flexors', cue: 'Reach hands to feet, fold at hips, control the lower.', sub: 'Crunch' },
  { aliases: ['inchworm', 'walkout'], muscles: 'Full body, mobility', cue: 'Walk hands out to plank, hold, walk back — keep legs straight.', sub: 'Plank' },
]

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

const INDEX = new Map()
for (const entry of RAW) {
  for (const alias of entry.aliases) {
    INDEX.set(normalize(alias), entry)
  }
}

export function lookupExercise(name) {
  if (!name) return null
  const n = normalize(name)
  if (INDEX.has(n)) return INDEX.get(n)
  // Try matching by removing trailing modifiers like "(or bench press)" handled by normalize.
  // Try keyword match — find the entry whose alias is contained in the input.
  let best = null
  let bestLen = 0
  for (const [alias, entry] of INDEX) {
    if (n.includes(alias) && alias.length > bestLen) {
      best = entry
      bestLen = alias.length
    }
  }
  return best
}

export function youtubeSearchUrl(name) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' form tutorial')}`
}
