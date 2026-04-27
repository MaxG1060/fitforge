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

  // Conditioning
  { aliases: ['burpee'], muscles: 'Full body', cue: 'Pace yourself — chest to floor, full extension at top.', sub: 'Squat thrust (no jump)' },
  { aliases: ['mountain climber'], muscles: 'Core, hip flexors, conditioning', cue: 'Strong plank, drive knees to chest fast — hips low.', sub: 'Slow plank with knee drive' },
  { aliases: ['jump rope', 'jumping rope'], muscles: 'Calves, conditioning', cue: 'Small jumps off balls of feet, wrists do the work.', sub: 'Marching in place' },
  { aliases: ['rowing', 'row erg', 'rower'], muscles: 'Full body, conditioning', cue: 'Legs → back → arms; reverse on return. Power from legs.', sub: 'Stationary bike' },
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
