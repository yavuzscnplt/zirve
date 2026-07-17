import { useEffect, useState, type Dispatch, type SetStateAction, type ReactElement } from 'react'
import type { ClientPhoto, PhotoPose } from '@shared/types'

const POSES: Array<{ value: PhotoPose; label: string }> = [
  { value: 'front', label: 'Ön' },
  { value: 'side', label: 'Yan' },
  { value: 'back', label: 'Arka' },
  { value: 'other', label: 'Diğer' }
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function poseLabel(pose: PhotoPose): string {
  return POSES.find((p) => p.value === pose)?.label ?? pose
}

function photoSrc(photo: ClientPhoto): string {
  return photo.dataUrl
}

export function PhotosPage(): ReactElement {
  const [photos, setPhotos] = useState<ClientPhoto[]>([])
  const [date, setDate] = useState(today())
  const [pose, setPose] = useState<PhotoPose>('front')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [leftId, setLeftId] = useState<number | ''>('')
  const [rightId, setRightId] = useState<number | ''>('')

  async function refresh(): Promise<void> {
    setPhotos(await window.api.photos.list())
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function handleAdd(): Promise<void> {
    setBusy(true)
    try {
      const added = await window.api.photos.add({ date, pose, note: note.trim() || null })
      if (added) {
        setNote('')
        await refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: number): Promise<void> {
    await window.api.photos.delete(id)
    if (leftId === id) setLeftId('')
    if (rightId === id) setRightId('')
    await refresh()
  }

  return (
    <div className="photos">
      <section className="panel">
        <h2>Fotoğraf ekle</h2>
        <div className="mform__grid">
          <label className="field">
            <span>Tarih</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Poz</span>
            <select
              className="select"
              value={pose}
              onChange={(e) => setPose(e.target.value as PhotoPose)}
            >
              {POSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Not</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="opsiyonel"
          />
        </label>
        <button className="btn btn--primary" onClick={handleAdd} disabled={busy}>
          {busy ? 'Ekleniyor…' : 'Fotoğraf seç ve ekle'}
        </button>
      </section>

      {photos.length >= 2 && (
        <section className="panel">
          <h2>Karşılaştır (before / after)</h2>
          <div className="compare">
            <CompareCol caption="Önce" value={leftId} onChange={setLeftId} photos={photos} />
            <CompareCol caption="Sonra" value={rightId} onChange={setRightId} photos={photos} />
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Galeri ({photos.length})</h2>
        {photos.length === 0 ? (
          <p className="empty">Henüz fotoğraf yok. Yukarıdan ilk fotoğrafını ekle.</p>
        ) : (
          <div className="gallery">
            {photos.map((p) => (
              <figure className="gphoto" key={p.id}>
                <img src={photoSrc(p)} alt={poseLabel(p.pose)} />
                <figcaption>
                  <span>
                    {p.date} · {poseLabel(p.pose)}
                  </span>
                  <button className="btn btn--ghost" onClick={() => handleDelete(p.id)}>
                    Sil
                  </button>
                </figcaption>
                {p.note && <p className="gphoto__note">{p.note}</p>}
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

interface CompareColProps {
  caption: string
  value: number | ''
  onChange: Dispatch<SetStateAction<number | ''>>
  photos: ClientPhoto[]
}

function CompareCol({ caption, value, onChange, photos }: CompareColProps): ReactElement {
  const photo = photos.find((p) => p.id === value)
  return (
    <div className="compare__col">
      <select
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      >
        <option value="">— {caption} seç —</option>
        {photos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.date} · {poseLabel(p.pose)}
          </option>
        ))}
      </select>
      {photo ? (
        <img className="compare__img" src={photoSrc(photo)} alt={caption} />
      ) : (
        <div className="compare__empty">{caption}</div>
      )}
    </div>
  )
}
