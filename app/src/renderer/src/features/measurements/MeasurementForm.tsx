import { useState, type FormEvent, type ReactElement } from 'react'
import type { MeasurementInput } from '@shared/types'
import { FIELD_GROUPS, NUMERIC_FIELDS } from './fields'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface Props {
  onAdded: () => void
}

export function MeasurementForm({ onAdded }: Props): ReactElement {
  const [date, setDate] = useState(today())
  const [values, setValues] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function setField(key: string, value: string): void {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)

    const weight = parseFloat((values['weight_kg'] ?? '').replace(',', '.'))
    if (!date) {
      setError('Tarih gerekli.')
      return
    }
    if (!Number.isFinite(weight)) {
      setError('Kilo alanı zorunlu.')
      return
    }

    const input = { date, note: note.trim() || null } as Record<string, unknown>
    for (const key of NUMERIC_FIELDS) {
      const raw = values[key]
      const num = raw != null && raw !== '' ? parseFloat(raw.replace(',', '.')) : NaN
      input[key] = Number.isFinite(num) ? num : null
    }
    input['weight_kg'] = weight

    setSaving(true)
    try {
      await window.api.measurements.add(input as unknown as MeasurementInput)
      setValues({})
      setNote('')
      setDate(today())
      onAdded()
    } catch (err) {
      setError('Kaydedilemedi: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="mform" onSubmit={handleSubmit}>
      <label className="field">
        <span>Tarih *</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      {FIELD_GROUPS.map((group) => (
        <fieldset className="mform__group" key={group.title}>
          <legend>{group.title}</legend>
          <div className="mform__grid">
            {group.fields.map((f) => (
              <label className="field" key={f.key}>
                <span>{f.label}</span>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={values[f.key] ?? ''}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <label className="field">
        <span>Not</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="opsiyonel"
        />
      </label>

      {error && <p className="mform__error">{error}</p>}

      <button className="btn btn--primary" type="submit" disabled={saving}>
        {saving ? 'Kaydediliyor…' : 'Ölçümü kaydet'}
      </button>
    </form>
  )
}
