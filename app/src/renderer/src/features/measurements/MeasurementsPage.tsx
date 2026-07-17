import { useEffect, useState, type ReactElement } from 'react'
import type { Measurement } from '@shared/types'
import { MeasurementForm } from './MeasurementForm'
import { MeasurementList } from './MeasurementList'
import { BodyMeasuresPanel } from './BodyMeasuresPanel'

export function MeasurementsPage(): ReactElement {
  const [items, setItems] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh(): Promise<void> {
    setItems(await window.api.measurements.list())
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function handleDelete(id: number): Promise<void> {
    await window.api.measurements.delete(id)
    void refresh()
  }

  async function handleSeed(): Promise<void> {
    setItems(await window.api.measurements.seedBaseline())
  }

  return (
    <div className="measurements">
      <div className="page">
        <section className="panel">
          <h2>Yeni ölçüm (tartı)</h2>
          <MeasurementForm onAdded={refresh} />
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Geçmiş ({items.length})</h2>
            <button className="btn btn--ghost" onClick={handleSeed}>
              Referans ölçümleri ekle
            </button>
          </div>
          {loading ? (
            <p className="empty">Yükleniyor…</p>
          ) : (
            <MeasurementList items={items} onDelete={handleDelete} />
          )}
        </section>
      </div>

      <BodyMeasuresPanel />
    </div>
  )
}
