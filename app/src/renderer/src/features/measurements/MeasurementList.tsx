import type { ReactElement } from 'react'
import type { Measurement } from '@shared/types'

interface Props {
  items: Measurement[]
  onDelete: (id: number) => void
}

function fmt(value: number | null, unit = ''): string {
  return value == null ? '—' : `${value}${unit}`
}

export function MeasurementList({ items, onDelete }: Props): ReactElement {
  if (items.length === 0) {
    return <p className="empty">Henüz ölçüm yok. Formu doldurup ilk ölçümünü ekle.</p>
  }

  return (
    <div className="mlist">
      {items.map((m) => (
        <article className="mcard" key={m.id}>
          <div className="mcard__head">
            <strong>{m.date}</strong>
            <button className="btn btn--ghost" onClick={() => onDelete(m.id)}>
              Sil
            </button>
          </div>
          <div className="mcard__stats">
            <Stat label="Kilo" value={fmt(m.weight_kg, ' kg')} />
            <Stat label="BMI" value={fmt(m.bmi)} />
            <Stat label="Yağ" value={fmt(m.body_fat_pct, '%')} />
            <Stat label="Kas" value={fmt(m.muscle_mass_kg, ' kg')} />
            <Stat label="BMR" value={fmt(m.bmr, ' kcal')} />
            <Stat label="Su" value={fmt(m.water_pct, '%')} />
          </div>
          {m.note && <p className="mcard__note">{m.note}</p>}
        </article>
      ))}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  )
}
