import type { MeasurementInput } from '@shared/types'

// date ve note dışındaki tüm sayısal ölçüm alanları.
export type NumericField = Exclude<keyof MeasurementInput, 'date' | 'note'>

export interface FieldDef {
  key: NumericField
  label: string
}

export interface FieldGroup {
  title: string
  fields: FieldDef[]
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    title: 'Genel',
    fields: [
      { key: 'weight_kg', label: 'Kilo (kg) *' },
      { key: 'height_cm', label: 'Boy (cm)' },
      { key: 'bmi', label: 'BMI' },
      { key: 'body_fat_pct', label: 'Yağ oranı (%)' },
      { key: 'fat_mass_kg', label: 'Yağ (kg)' },
      { key: 'muscle_mass_kg', label: 'Toplam kas (kg)' },
      { key: 'bmr', label: 'BMR (kcal)' },
      { key: 'water_pct', label: 'Su oranı (%)' }
    ]
  },
  {
    title: 'Gövde',
    fields: [
      { key: 'trunk_muscle_kg', label: 'Gövde kas (kg)' },
      { key: 'trunk_fat_pct', label: 'Gövde yağ (%)' }
    ]
  },
  {
    title: 'Bacaklar',
    fields: [
      { key: 'right_leg_muscle_kg', label: 'Sağ bacak kas (kg)' },
      { key: 'right_leg_fat_pct', label: 'Sağ bacak yağ (%)' },
      { key: 'left_leg_muscle_kg', label: 'Sol bacak kas (kg)' },
      { key: 'left_leg_fat_pct', label: 'Sol bacak yağ (%)' }
    ]
  },
  {
    title: 'Kollar',
    fields: [
      { key: 'right_arm_muscle_kg', label: 'Sağ kol kas (kg)' },
      { key: 'right_arm_fat_pct', label: 'Sağ kol yağ (%)' },
      { key: 'left_arm_muscle_kg', label: 'Sol kol kas (kg)' },
      { key: 'left_arm_fat_pct', label: 'Sol kol yağ (%)' }
    ]
  }
]

export const NUMERIC_FIELDS: NumericField[] = FIELD_GROUPS.flatMap((g) =>
  g.fields.map((f) => f.key)
)
