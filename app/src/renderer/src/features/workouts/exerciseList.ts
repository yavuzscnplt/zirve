// Kas grubuna göre kapsamlı hareket listesi (varyasyonlar dahil).
export interface ExerciseGroup {
  group: string
  items: string[]
}

export const EXERCISE_GROUPS: ExerciseGroup[] = [
  {
    group: 'Göğüs',
    items: [
      'Bench Press (Barbell)',
      'Bench Press (Dumbbell)',
      'Incline Bench Press (Barbell)',
      'Incline Bench Press (Dumbbell)',
      'Decline Bench Press (Barbell)',
      'Decline Bench Press (Dumbbell)',
      'Close-Grip Bench Press',
      'Floor Press',
      'Smith Machine Bench Press',
      'Chest Press Machine',
      'Incline Chest Press Machine',
      'Hammer Strength Chest Press',
      'Cable Fly (Yüksekten)',
      'Cable Fly (Alçaktan)',
      'Cable Crossover',
      'Dumbbell Fly (Düz)',
      'Incline Dumbbell Fly',
      'Pec Deck (Butterfly)',
      'Push-Up (Şınav)',
      'Incline Push-Up',
      'Decline Push-Up',
      'Diamond Push-Up',
      'Weighted Push-Up',
      'Chest Dip (Paralel)',
      'Weighted Chest Dip',
      'Dumbbell Pullover',
      'Svend Press',
      'Landmine Press'
    ]
  },
  {
    group: 'Sırt',
    items: [
      'Deadlift (Klasik)',
      'Sumo Deadlift',
      'Romanian Deadlift',
      'Trap Bar Deadlift',
      'Rack Pull',
      'Pull-Up (Barfiks)',
      'Weighted Pull-Up',
      'Chin-Up (Ters Barfiks)',
      'Neutral-Grip Pull-Up',
      'Lat Pulldown (Geniş)',
      'Lat Pulldown (Dar/Nötr)',
      'Behind-the-Neck Pulldown',
      'Straight-Arm Pulldown',
      'Barbell Bent-Over Row',
      'Pendlay Row',
      'Yates Row (Ters Tutuş)',
      'Dumbbell Row (Tek Kol)',
      'Chest-Supported Dumbbell Row',
      'T-Bar Row',
      'Seated Cable Row (Geniş)',
      'Seated Cable Row (Dar)',
      'Machine Row',
      'Hammer Strength Row',
      'Inverted Row',
      'Meadows Row',
      'Face Pull',
      'Reverse Pec Deck',
      'Barbell Shrug',
      'Dumbbell Shrug',
      'Back Extension (Hiperekstansiyon)',
      'Good Morning'
    ]
  },
  {
    group: 'Omuz',
    items: [
      'Overhead Press (Barbell)',
      'Overhead Press (Dumbbell)',
      'Seated Dumbbell Press',
      'Arnold Press',
      'Machine Shoulder Press',
      'Smith Machine Shoulder Press',
      'Push Press',
      'Lateral Raise (Dumbbell)',
      'Cable Lateral Raise',
      'Machine Lateral Raise',
      'Lean-Away Lateral Raise',
      'Front Raise (Dumbbell)',
      'Front Raise (Plaka)',
      'Front Raise (Cable)',
      'Rear Delt Fly (Dumbbell)',
      'Cable Rear Delt Fly',
      'Upright Row (Barbell)',
      'Upright Row (Cable)',
      'Landmine Press (Omuz)'
    ]
  },
  {
    group: 'Biceps',
    items: [
      'Barbell Curl',
      'EZ-Bar Curl',
      'Dumbbell Curl',
      'Alternating Dumbbell Curl',
      'Hammer Curl',
      'Cross-Body Hammer Curl',
      'Preacher Curl (Barbell)',
      'Preacher Curl (Dumbbell)',
      'Concentration Curl',
      'Incline Dumbbell Curl',
      'Cable Curl',
      'Cable Rope Hammer Curl',
      'Spider Curl',
      'Zottman Curl',
      'Machine Curl',
      'Bayesian Cable Curl'
    ]
  },
  {
    group: 'Triceps',
    items: [
      'Triceps Pushdown (Halat)',
      'Triceps Pushdown (Bar)',
      'Triceps Pushdown (V-Bar)',
      'Overhead Rope Extension',
      'Overhead Dumbbell Extension',
      'Skull Crusher (EZ-Bar)',
      'Skull Crusher (Dumbbell)',
      'Close-Grip Bench Press',
      'Triceps Dip (Paralel)',
      'Bench Dip',
      'Dumbbell Kickback',
      'Cable Kickback',
      'JM Press',
      'Machine Triceps Extension'
    ]
  },
  {
    group: 'Bacak (Quad/Ham)',
    items: [
      'Back Squat',
      'Front Squat',
      'High-Bar Squat',
      'Low-Bar Squat',
      'Box Squat',
      'Goblet Squat',
      'Hack Squat (Makine)',
      'Pendulum Squat',
      'Bulgarian Split Squat',
      'Leg Press',
      'Leg Press (Tek Bacak)',
      'Leg Extension',
      'Lying Leg Curl',
      'Seated Leg Curl',
      'Standing Leg Curl',
      'Romanian Deadlift',
      'Stiff-Leg Deadlift',
      'Good Morning',
      'Walking Lunge',
      'Reverse Lunge',
      'Forward Lunge',
      'Step-Up',
      'Sissy Squat',
      'Belt Squat',
      'Smith Machine Squat',
      'Zercher Squat',
      'Nordic Hamstring Curl'
    ]
  },
  {
    group: 'Kalça / Glute',
    items: [
      'Hip Thrust (Barbell)',
      'Hip Thrust (Makine)',
      'Glute Bridge',
      'Single-Leg Hip Thrust',
      'Cable Glute Kickback',
      'Machine Glute Kickback',
      'Hip Abduction Machine',
      'Hip Adduction Machine',
      'Sumo Squat',
      'Cable Pull-Through',
      'Curtsy Lunge',
      'Frog Pump'
    ]
  },
  {
    group: 'Baldır',
    items: [
      'Standing Calf Raise (Makine)',
      'Standing Calf Raise (Dumbbell)',
      'Seated Calf Raise',
      'Leg Press Calf Raise',
      'Smith Machine Calf Raise',
      'Single-Leg Calf Raise',
      'Donkey Calf Raise'
    ]
  },
  {
    group: 'Ön Kol',
    items: [
      'Wrist Curl (Barbell)',
      'Wrist Curl (Dumbbell)',
      'Reverse Wrist Curl',
      'Reverse Curl (EZ-Bar)',
      'Behind-the-Back Wrist Curl',
      "Farmer's Carry",
      'Plate Pinch',
      'Dead Hang',
      'Wrist Roller'
    ]
  },
  {
    group: 'Karın / Core',
    items: [
      'Plank',
      'Side Plank',
      'Crunch',
      'Cable Crunch',
      'Machine Crunch',
      'Sit-Up',
      'Decline Sit-Up',
      'Leg Raise (Yerde)',
      'Hanging Leg Raise',
      'Hanging Knee Raise',
      "Captain's Chair Leg Raise",
      'Russian Twist',
      'Bicycle Crunch',
      'Ab Wheel Rollout',
      'Mountain Climber',
      'Dead Bug',
      'Hollow Hold',
      'Cable Woodchopper',
      'Toes-to-Bar',
      'V-Up',
      'Reverse Crunch',
      'Pallof Press'
    ]
  },
  {
    group: 'Kompound / Olimpik',
    items: [
      'Power Clean',
      'Hang Clean',
      'Clean and Jerk',
      'Snatch',
      'Hang Snatch',
      'Push Press',
      'Push Jerk',
      'Thruster',
      'Overhead Squat',
      'Clean Pull',
      'Snatch Pull',
      'Kettlebell Swing',
      'Kettlebell Clean',
      'Kettlebell Snatch',
      'Turkish Get-Up'
    ]
  },
  {
    group: 'Kardiyo / Kondisyon',
    items: [
      'Koşu (Treadmill)',
      'Yürüyüş (Eğimli)',
      'Dış Koşu',
      'Bisiklet (Sabit)',
      'Bisiklet (Spin)',
      'Rowing (Kürek)',
      'Eliptik',
      'İp Atlama',
      'Stairmaster (Merdiven)',
      'Assault Bike',
      'SkiErg',
      'Yüzme',
      'Battle Rope',
      'Sled Push',
      'Sled Pull',
      'Burpee',
      'HIIT'
    ]
  },
  {
    group: 'Esneklik / Mobility',
    items: [
      'Dinamik Isınma',
      'Statik Germe',
      'Foam Roller',
      'Yoga',
      'Hip Mobility',
      'Shoulder Mobility',
      'Cat-Cow',
      "World's Greatest Stretch",
      'Couch Stretch'
    ]
  }
]
