import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getMe } from './api'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Room from './pages/Room'

/**
 * Root application component. Manages auth state and routing.
 */
export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe().then(data => {
      if (data.loggedIn) setUser(data.username)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text3)', fontFamily:'var(--font-display)', fontSize:'13px', letterSpacing:'0.1em' }}>
      LOADING...
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth onLogin={setUser} />} />
        <Route path="/" element={user ? <Home user={user} onLogout={() => setUser(null)} /> : <Navigate to="/auth" />} />
        <Route path="/:roomId" element={user ? <Room user={user} onLogout={() => setUser(null)} /> : <Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  )
}
