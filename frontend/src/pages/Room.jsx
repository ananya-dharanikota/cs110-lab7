import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoom, getMessages, sendMessage, logout } from '../api'
import Message from '../components/Message'

/**
 * Chatroom page. Polls for new messages every 3 seconds.
 * @param {{ user: string, onLogout: () => void }} props
 */
export default function Room({ user, onLogout }) {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [roomError, setRoomError] = useState(false)
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    loadRoom()
    loadMessages()
    pollRef.current = setInterval(loadMessages, 3000)
    return () => clearInterval(pollRef.current)
  }, [roomId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function loadRoom() {
    const data = await getRoom(roomId)
    if (data.success === false) { setRoomError(true); return }
    setRoom(data)
  }

  async function loadMessages() {
    const data = await getMessages(roomId)
    if (Array.isArray(data)) setMessages(data)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    const msg = await sendMessage(roomId, text.trim())
    if (msg._id) {
      setMessages(prev => {
        const exists = prev.find(m => m._id === msg._id)
        return exists ? prev : [...prev, msg]
      })
      setText('')
    } else {
      setError('Failed to send message.')
    }
  }

  function handleUpdate(updated) {
    setMessages(prev => prev.map(m => m._id === updated._id ? updated : m))
  }

  function handleDelete(id) {
    setMessages(prev => prev.filter(m => m._id !== id))
  }

  async function handleLogout() {
    await logout()
    onLogout()
  }

  if (roomError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
      <p style={{ color: 'var(--accent2)', fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}>ROOM NOT FOUND</p>
      <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back to rooms</button>
    </div>
  )

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← ROOMS</button>
        <div style={styles.roomInfo}>
          <span style={styles.roomIdBadge}>{roomId}</span>
          {room?.name && <span style={styles.roomNameLabel}>{room.name}</span>}
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userBadge}>
            <span style={styles.dot} />{user}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>LOGOUT</button>
        </div>
      </header>

      {/* Messages */}
      <div style={styles.feed}>
        {messages.length === 0 ? (
          <div style={styles.emptyFeed}>
            <div style={styles.emptyIcon}>◈</div>
            <p>No messages yet. Be the first!</p>
          </div>
        ) : (
          <div style={styles.messageList}>
            {messages.map(msg => (
              <Message
                key={msg._id}
                message={msg}
                user={user}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div style={styles.compose}>
        <form onSubmit={handleSend} style={styles.composeForm}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Message as ${user}...`}
            style={styles.composeInput}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
          />
          <button type="submit" className="btn btn-primary" disabled={!text.trim()}>SEND</button>
        </form>
        {error && <div className="error-msg" style={{ marginTop: '8px' }}>{error}</div>}
      </div>
    </div>
  )
}

const styles = {
  page: { height: '100vh', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 24px', borderBottom: '1px solid var(--border)',
    background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(10px)',
    flexShrink: 0,
  },
  roomInfo: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' },
  roomIdBadge: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px',
    letterSpacing: '0.12em', color: 'var(--accent)',
    background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.3)',
    padding: '3px 12px', borderRadius: '6px',
  },
  roomNameLabel: { color: 'var(--text2)', fontSize: '13px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text2)', fontSize: '12px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent3)', boxShadow: '0 0 6px var(--accent3)' },
  feed: {
    flex: 1, overflowY: 'auto', padding: '24px',
    display: 'flex', flexDirection: 'column',
  },
  messageList: { display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '760px', margin: '0 auto', width: '100%' },
  emptyFeed: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', color: 'var(--text3)', gap: '12px',
  },
  emptyIcon: { fontSize: '40px', color: 'var(--accent)', opacity: 0.3 },
  compose: {
    padding: '16px 24px', borderTop: '1px solid var(--border)',
    background: 'var(--bg)', flexShrink: 0,
  },
  composeForm: {
    display: 'flex', gap: '10px', alignItems: 'center',
    maxWidth: '760px', margin: '0 auto',
  },
  composeInput: { flex: 1 },
}
