import { useEffect, useMemo, useState, type ReactElement } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { Measurement } from '@shared/types'

interface MetricDef {
  key: keyof Measurement
  label: string
  unit: string
  color: string
}

const METRICS: MetricDef[] = [
  { key: 'weight_kg', label: 'Kilo', unit: 'kg', color: '#e23b3b' },
  { key: 'body_fat_pct', label: 'Yağ oranı', unit: '%', color: '#e2913b' },
  { key: 'muscle_mass_kg', label: 'Toplam kas', unit: 'kg', color: '#35c26b' },
  { key: 'bmi', label: 'BMI', unit: '', color: '#3b82e2' },
  { key: 'fat_mass_kg', label: 'Yağ kütlesi', unit: 'kg', color: '#e2c23b' },
  { key: 'water_pct', label: 'Su oranı', unit: '%', color: '#3bc9e2' }
]

interface Point {
  date: string
  value: number
}

function series(data: Measurement[], key: keyof Measurement): Point[] {
  return data
    .map((m) => ({ date: m.date, value: m[key] as number | null }))
    .filter((d): d is Point => d.value != null)
}

export function ChartsPage(): ReactElement {
  const [items, setItems] = useState<Measurement[]>([])

  useEffect(() => {
    void window.api.measurements.list().then(setItems)
  }, [])

  const sorted = useMemo(() => [...items].sort((a, b) => a.date.localeCompare(b.date)), [items])

  if (items.length === 0) {
    return (
      <div className="panel">
        <p className="empty">Grafikler için önce ölçüm ekle. En az 2 ölçümle trendler görünür.</p>
      </div>
    )
  }

  return (
    <div className="charts">
      <div className="summary">
        {METRICS.slice(0, 3).map((m) => (
          <SummaryCard key={m.key} metric={m} data={sorted} />
        ))}
      </div>
      <div className="chartgrid">
        {METRICS.map((m) => (
          <MetricChart key={m.key} metric={m} data={sorted} />
        ))}
      </div>
    </div>
  )
}

function SummaryCard({ metric, data }: { metric: MetricDef; data: Measurement[] }): ReactElement {
  const s = series(data, metric.key)
  const latest = s.length ? s[s.length - 1].value : null
  const first = s.length ? s[0].value : null
  const delta = latest != null && first != null ? latest - first : null
  return (
    <div className="scard">
      <span className="scard__label">{metric.label}</span>
      <span className="scard__value" style={{ color: metric.color }}>
        {latest ?? '—'} {metric.unit}
      </span>
      {delta != null && delta !== 0 && (
        <span className={`scard__delta ${delta > 0 ? 'up' : 'down'}`}>
          {delta > 0 ? '▲ +' : '▼ '}
          {delta.toFixed(1)} {metric.unit} (ilk ölçüme göre)
        </span>
      )}
    </div>
  )
}

function MetricChart({ metric, data }: { metric: MetricDef; data: Measurement[] }): ReactElement {
  const s = series(data, metric.key)
  return (
    <div className="ccard">
      <div className="ccard__title">{metric.label}</div>
      {s.length < 2 ? (
        <p className="empty">2+ ölçüm gerekli</p>
      ) : (
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={s} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="#262c34" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#9aa4b2" fontSize={10} />
              <YAxis stroke="#9aa4b2" fontSize={10} domain={['auto', 'auto']} width={34} />
              <Tooltip
                contentStyle={{
                  background: '#1d232b',
                  border: '1px solid #262c34',
                  borderRadius: 8,
                  color: '#e8eaed',
                  fontSize: 12
                }}
                formatter={(v) => [`${v} ${metric.unit}`.trim(), metric.label]}
              />
              <Line type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
