import { dialog } from 'electron'
import { copyFileSync } from 'fs'
import { getDbPath, reloadDb } from './db'

export async function exportBackup(): Promise<boolean> {
  const stamp = new Date().toISOString().slice(0, 10)
  const res = await dialog.showSaveDialog({
    title: 'Yedeği kaydet',
    defaultPath: `zirve-yedek-${stamp}.zirvedb`,
    filters: [{ name: 'Zirve yedek', extensions: ['zirvedb', 'db'] }]
  })
  if (res.canceled || !res.filePath) return false
  copyFileSync(getDbPath(), res.filePath)
  return true
}

export async function importBackup(): Promise<boolean> {
  const res = await dialog.showOpenDialog({
    title: 'Yedek dosyası seç',
    properties: ['openFile'],
    filters: [{ name: 'Zirve yedek', extensions: ['zirvedb', 'db'] }]
  })
  if (res.canceled || res.filePaths.length === 0) return false
  copyFileSync(res.filePaths[0], getDbPath())
  reloadDb()
  return true
}
