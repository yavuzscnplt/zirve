import { useEffect, useMemo, useState, type ReactElement } from 'react'
import type { Analysis, ClientPhoto } from '@shared/types'

export function AnalysisPage(): ReactElement {
  const [photos, setPhotos] = useState<ClientPhoto[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const ph = await window.api.photos.list()
      setPhotos(ph)
      setAnalyses(await window.api.analysis.list())
      if (ph.length > 0) {
        const latest = ph[0].date // liste tarih azalan
        setSelected(new Set(ph.filter((p) => p.date === latest).map((p) => p.id)))
      }
    })()
  }, [])

  function toggle(id: number): void {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleDate(ids: number[], allOn: boolean): void {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (allOn) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  async function run(): Promise<void> {
    if (selected.size === 0) {
      setError('Analiz için en az bir fotoğraf seç.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await window.api.analysis.run([...selected])
      setAnalyses(await window.api.analysis.list())
    } catch (e) {
      setError((e as Error)?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number): Promise<void> {
    await window.api.analysis.delete(id)
    setAnalyses(await window.api.analysis.list())
  }

  const groups = useMemo(() => {
    const map = new Map<string, ClientPhoto[]>()
    for (const p of photos) {
      const arr = map.get(p.date) ?? []
      arr.push(p)
      map.set(p.date, arr)
    }
    return [...map.entries()]
  }, [photos])

  return (
    <div className="analysis">
      <section className="panel">
        <div className="panel__head">
          <h2>🔬 AI Vücut Analizi</h2>
          <button
            className="btn btn--primary"
            onClick={() => void run()}
            disabled={busy || selected.size === 0}
          >
            {busy ? 'Analiz ediliyor…' : `Analiz et (${selected.size})`}
          </button>
        </div>
        <p className="empty">
          Analize dahil edeceğin fotoğrafları seç (tarihe göre gruplu). Eski “fit” fotoğraflarını da
          işaretleyebilirsin — AI güncel hâlinle karşılaştırır ve eski hâlini hedef olarak kullanır.
          Tahmine dayalıdır, tıbbi değildir.
        </p>

        {photos.length === 0 ? (
          <p className="empty">Önce Fotoğraflar sekmesinden fotoğraf ekle.</p>
        ) : (
          <div className="pickgroups">
            {groups.map(([d, arr]) => {
              const ids = arr.map((p) => p.id)
              const allOn = ids.every((id) => selected.has(id))
              return (
                <div key={d}>
                  <div className="pickgroup__head">
                    <span className="pickgroup__date">{d}</span>
                    <button className="btn btn--ghost" onClick={() => toggleDate(ids, allOn)}>
                      {allOn ? 'Tümünü kaldır' : 'Tümünü seç'}
                    </button>
                  </div>
                  <div className="pickgrid">
                    {arr.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`pick ${selected.has(p.id) ? 'pick--on' : ''}`}
                        onClick={() => toggle(p.id)}
                      >
                        <img src={p.dataUrl} alt="" />
                        {selected.has(p.id) && <span className="pick__check">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {error && <p className="mform__error">{error}</p>}
        {busy && (
          <p className="empty">Fotoğraflar tarihlerine göre okunuyor ve değerlendiriliyor — biraz sürebilir…</p>
        )}
      </section>

      {analyses.length === 0 && !busy ? (
        <section className="panel">
          <p className="empty">Henüz analiz yok. Fotoğraf seçip “Analiz et”e bas.</p>
        </section>
      ) : (
        analyses.map((a) => (
          <section className="panel" key={a.id}>
            <div className="panel__head">
              <h2>
                {a.date} · {a.photo_count} fotoğraf
              </h2>
              <button className="btn btn--ghost" onClick={() => void remove(a.id)}>
                Sil
              </button>
            </div>
            <div className="report">{a.report}</div>
          </section>
        ))
      )}
    </div>
  )
}
