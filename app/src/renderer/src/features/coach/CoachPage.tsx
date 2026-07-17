import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement
} from 'react'
import type { Chat, ChatMessage } from '@shared/types'
import { Markdown } from '../../components/Markdown'

const SUGGESTIONS = [
  'Son durumumu değerlendir, ne yapmalıyım?',
  'Bu hafta için antrenman önerir misin?',
  'Beslenmemi nasıl düzenlemeliyim?'
]

export function CoachPage(): ReactElement {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void (async () => {
      const list = await window.api.chats.list()
      setChats(list)
      if (list.length > 0) {
        setActiveId(list[0].id)
        setMessages(await window.api.chats.messages(list[0].id))
      }
    })()
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function selectChat(id: number): Promise<void> {
    setActiveId(id)
    setMessages(await window.api.chats.messages(id))
  }

  async function newChat(): Promise<void> {
    const chat = await window.api.chats.create()
    setChats((prev) => [chat, ...prev])
    setActiveId(chat.id)
    setMessages([])
  }

  async function removeChat(id: number): Promise<void> {
    await window.api.chats.delete(id)
    const list = await window.api.chats.list()
    setChats(list)
    if (activeId === id) {
      if (list.length > 0) {
        setActiveId(list[0].id)
        setMessages(await window.api.chats.messages(list[0].id))
      } else {
        setActiveId(null)
        setMessages([])
      }
    }
  }

  async function send(text: string): Promise<void> {
    const message = text.trim()
    if (!message || busy) return

    let chatId = activeId
    if (chatId == null) {
      const chat = await window.api.chats.create()
      chatId = chat.id
      setActiveId(chatId)
      setChats((prev) => [chat, ...prev])
    }

    setInput('')
    setBusy(true)
    setMessages((prev) => [
      ...prev,
      { id: -1, chat_id: chatId as number, role: 'user', text: message, created_at: '' }
    ])
    try {
      await window.api.coach.ask(chatId, message)
      setMessages(await window.api.chats.messages(chatId))
      setChats(await window.api.chats.list())
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: -2, chat_id: chatId as number, role: 'coach', text: 'Bir hata oldu: ' + String(err), created_at: '' }
      ])
    } finally {
      setBusy(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  return (
    <div className="coach">
      <aside className="chatlist">
        <button className="btn btn--primary chatlist__new" onClick={() => void newChat()}>
          + Yeni sohbet
        </button>
        <div className="chatlist__items">
          {chats.length === 0 && <p className="chatlist__empty">Henüz sohbet yok</p>}
          {chats.map((c) => (
            <div
              key={c.id}
              className={`chatitem ${c.id === activeId ? 'chatitem--active' : ''}`}
              onClick={() => void selectChat(c.id)}
            >
              <span className="chatitem__title">{c.title}</span>
              <button
                className="chatitem__del"
                title="Sil"
                onClick={(e) => {
                  e.stopPropagation()
                  void removeChat(c.id)
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="coach__main">
        <div className="coach__log">
          {messages.length === 0 && !busy && (
            <div className="coach__welcome">
              <p className="empty">
                👋 Ben senin AI spor koçunum. Ölçüm, antrenman ve fotoğraf geçmişini biliyorum.
                Aşağıdan bir şey sor:
              </p>
              <div className="coach__suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => void send(s)} disabled={busy}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`bubble bubble--${m.role}`}>
              {m.role === 'coach' ? <Markdown text={m.text} /> : m.text}
            </div>
          ))}

          {busy && <div className="bubble bubble--coach bubble--typing">Koç yazıyor…</div>}
          <div ref={endRef} />
        </div>

        <div className="coach__input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Koçuna yaz… (Enter ile gönder, Shift+Enter alt satır)"
            rows={2}
          />
          <button
            className="btn btn--primary"
            onClick={() => void send(input)}
            disabled={busy || !input.trim()}
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  )
}
