import { getDb, persist } from './index'
import type { Chat, ChatMessage } from '../../shared/types'

export function createChat(): Chat {
  const db = getDb()
  const now = new Date().toISOString()
  db.run('INSERT INTO chats (title, created_at, updated_at) VALUES (?, ?, ?)', [
    'Yeni sohbet',
    now,
    now
  ])
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
  persist()
  return getChat(id) as Chat
}

export function getChat(id: number): Chat | null {
  const db = getDb()
  const res = db.exec('SELECT * FROM chats WHERE id = ?', [id])
  if (res.length === 0 || res[0].values.length === 0) return null
  return rowToObj<Chat>(res[0].columns, res[0].values[0])
}

export function listChats(): Chat[] {
  const db = getDb()
  const res = db.exec('SELECT * FROM chats ORDER BY updated_at DESC, id DESC')
  if (res.length === 0) return []
  return res[0].values.map((r) => rowToObj<Chat>(res[0].columns, r))
}

export function deleteChat(id: number): void {
  const db = getDb()
  db.run('DELETE FROM chat_messages WHERE chat_id = ?', [id])
  db.run('DELETE FROM chats WHERE id = ?', [id])
  persist()
}

export function listMessages(chatId: number): ChatMessage[] {
  const db = getDb()
  const res = db.exec('SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY id ASC', [chatId])
  if (res.length === 0) return []
  return res[0].values.map((r) => rowToObj<ChatMessage>(res[0].columns, r))
}

export function addMessage(chatId: number, role: 'user' | 'coach', text: string): ChatMessage {
  const db = getDb()
  const now = new Date().toISOString()
  db.run('INSERT INTO chat_messages (chat_id, role, text, created_at) VALUES (?, ?, ?, ?)', [
    chatId,
    role,
    text,
    now
  ])
  // id'yi persist()'ten ÖNCE oku — db.export() last_insert_rowid'i sıfırlar.
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
  db.run('UPDATE chats SET updated_at = ? WHERE id = ?', [now, chatId])
  persist()
  return { id, chat_id: chatId, role, text, created_at: now }
}

export function setChatTitle(chatId: number, title: string): void {
  const db = getDb()
  db.run('UPDATE chats SET title = ? WHERE id = ?', [title.slice(0, 60), chatId])
  persist()
}

function rowToObj<T>(columns: string[], row: Array<number | string | Uint8Array | null>): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((c, i) => {
    obj[c] = row[i]
  })
  return obj as unknown as T
}
