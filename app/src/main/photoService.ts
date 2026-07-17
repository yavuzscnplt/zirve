import { app, dialog } from 'electron'
import { join, extname, basename } from 'path'
import { existsSync, mkdirSync, copyFileSync, unlinkSync, readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { insertPhoto, deletePhotoRow, listPhotos } from './db/photos'
import type { ClientPhoto, Photo, PhotoInput } from '../shared/types'

// Fotoğraflar userData/photos altında saklanır (cihazda, dışarı çıkmaz).
export function photosDir(): string {
  const dir = join(app.getPath('userData'), 'photos')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function mimeFor(filename: string): string {
  switch (extname(filename).toLowerCase()) {
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    default:
      return 'image/jpeg'
  }
}

// Dosyayı base64 data URL'e çevir (renderer'da <img src> için — protokol gerekmez).
function toDataUrl(filename: string): string {
  const buf = readFileSync(join(photosDir(), basename(filename)))
  return `data:${mimeFor(filename)};base64,${buf.toString('base64')}`
}

function toClient(photo: Photo): ClientPhoto {
  return { ...photo, dataUrl: toDataUrl(photo.filename) }
}

export function listClientPhotos(): ClientPhoto[] {
  return listPhotos().map(toClient)
}

// Dosya seçtirir, userData'ya kopyalar, DB'ye kaydeder. İptalde null döner.
export async function addPhoto(input: PhotoInput): Promise<ClientPhoto | null> {
  const result = await dialog.showOpenDialog({
    title: 'Fotoğraf seç',
    properties: ['openFile'],
    filters: [{ name: 'Görseller', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null

  const src = result.filePaths[0]
  const ext = extname(src).toLowerCase() || '.jpg'
  const filename = `${randomUUID()}${ext}`
  copyFileSync(src, join(photosDir(), filename))

  return toClient(insertPhoto(input.date, input.pose, filename, input.note))
}

export function removePhoto(id: number): void {
  const filename = deletePhotoRow(id)
  if (filename) {
    const filePath = join(photosDir(), basename(filename))
    if (existsSync(filePath)) unlinkSync(filePath)
  }
}
