import { useState } from 'react'
import { login, signup } from '../api'

/**
 * Auth page with toggling login / signup forms.
 * Shows inline error messages on failed attempts.
 * @param {{ onLogin: (username: string) => void }} props
 */
export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        const data = await login(username, password)
        if (data.success) {
          onLogin(data.username)
        } else {
          setError(data.message || 'Invalid username or password.')
        }
      } else {
        const data = await signup(username, password)
        if (data.success) {
          // Auto-login after signup
          const loginData = await login(username, password)
          if (loginData.success) onLogin(loginData.username)
        } else {
          setError(data.message || 'Signup failed. Try a different username.')
        }
      }
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.noise} />
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>CHATROOM</span>
        </div>
        <p style={styles.tagline}>Real-time. Threaded. Yours.</p>

        <div style={styles.tabs}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>USERNAME</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your_handle"
              autoComplete="username"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p style={styles.switch}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', position: 'relative', overflow: 'hidden',
  },
  noise: {
    position: 'absolute', inset: 0, opacity: 0.03,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
    backgroundSize: '200px',
  },
  card: {
    width: '100%', maxWidth: '420px', padding: '48px 40px',
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '16px', boxShadow: 'var(--shadow)',
    animation: 'slideUp 0.4s ease',
    position: 'relative', zIndex: 1,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  logoIcon: { fontSize: '28px', color: 'var(--accent)' },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '24px', letterSpacing: '0.15em' },
  tagline: { color: 'var(--text3)', fontSize: '12px', marginBottom: '32px', fontFamily: 'var(--font-mono)' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '28px', background: 'var(--bg3)', padding: '4px', borderRadius: '8px' },
  tab: {
    flex: 1, padding: '8px', background: 'transparent', border: 'none',
    color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: '11px',
    fontWeight: 600, letterSpacing: '0.1em', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
  },
  tabActive: { background: 'var(--accent)', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text3)' },
  switch: { marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text2)' },
}
