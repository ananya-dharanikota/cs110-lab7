import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRooms, createRoom, logout } from '../api'

/**
 * Home page: displays all chatrooms and allows creating new ones.
 * @param {{ user: string, onLogout: () => void }} props
 */
export default function HomePage({ user, onLogout }) {
  const [rooms, setRooms] = useState([])
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchRooms() }, [])

  async function fetchRooms() {
    setLoading(true)
    const data = await getRooms()
    setRooms(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    const room = await createRoom(roomName.trim())
    setRoomName('')
    navigate(`/${room.roomId}`)
  }

  async function handleLogout() {
    await logout()
    onLogout()
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>◈</span>
          <span style={styles.brandText}>CHATROOM</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userBadge}>
            <span style={styles.dot} />
            {user}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>LOGOUT</button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.hero}>
          <h1 style={styles.h1}>ROOMS</h1>
          <p style={styles.sub}>Join an existing room or spin up a new one.</p>
        </div>

        <form onSubmit={handleCreate} style={styles.createForm}>
          <input
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            placeholder="Room name (optional)"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">+ NEW ROOM</button>
        </form>

        {loading ? (
          <p style={styles.empty}>Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p style={styles.empty}>No rooms yet. Create the first one!</p>
        ) : (
          <div style={styles.grid}>
            {rooms.map(room => (
              <button key={room._id} onClick={() => navigate(`/${room.roomId}`)} style={styles.roomCard}>
                <div style={styles.roomTop}>
                  <span style={styles.roomId}>{room.roomId}</span>
                  <span style={styles.arrow}>→</span>
                </div>
                {room.name && <div style={styles.roomName}>{room.name}</div>}
                <div style={styles.roomDate}>
                  {new Date(room.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 32px', borderBottom: '1px solid var(--border)',
    background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(10px)',
    position: 'sticky', top: 0, zIndex: 10,
  },
  brand: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandIcon: { color: 'var(--accent)', fontSize: '20px' },
  brandText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', letterSpacing: '0.15em' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '14px' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text2)', fontSize: '12px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent3)', boxShadow: '0 0 6px var(--accent3)' },
  main: { flex: 1, maxWidth: '800px', margin: '0 auto', padding: '48px 24px', width: '100%' },
  hero: { marginBottom: '36px' },
  h1: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '48px', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '8px' },
  sub: { color: 'var(--text2)', fontSize: '13px' },
  createForm: { display: 'flex', gap: '12px', marginBottom: '40px', alignItems: 'stretch' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' },
  roomCard: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px',
    padding: '20px', textAlign: 'left', cursor: 'pointer',
    transition: 'all 0.15s', animation: 'fadeIn 0.3s ease',
  },
  roomTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  roomId: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', letterSpacing: '0.08em', color: 'var(--accent)' },
  arrow: { color: 'var(--text3)', fontSize: '18px', transition: 'transform 0.15s' },
  roomName: { fontSize: '12px', color: 'var(--text)', marginBottom: '8px', fontWeight: 500 },
  roomDate: { fontSize: '11px', color: 'var(--text3)' },
  empty: { color: 'var(--text3)', textAlign: 'center', paddingTop: '60px' },
}
