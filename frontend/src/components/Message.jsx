import { useState } from 'react'
import { editMessage, deleteMessage, voteMessage, sendReply, voteReply } from '../api'

/**
 * Formats a date to a readable local string.
 * @param {string} iso - ISO date string
 */
function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

/**
 * Renders a single message with edit, delete, voting, and reply functionality.
 * @param {{ message: object, user: string, onUpdate: (msg: object) => void, onDelete: (id: string) => void }} props
 */
export default function MessageItem({ message, user, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showReplies, setShowReplies] = useState(false)

  const isOwner = message.username === user

  async function handleEdit(e) {
    e.preventDefault()
    if (!editText.trim()) return
    const updated = await editMessage(message._id, editText.trim())
    onUpdate(updated)
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this message?')) return
    await deleteMessage(message._id)
    onDelete(message._id)
  }

  async function handleVote(vote) {
    const updated = await voteMessage(message._id, vote)
    onUpdate(updated)
  }

  async function handleReply(e) {
    e.preventDefault()
    if (!replyText.trim()) return
    const updated = await sendReply(message._id, replyText.trim())
    onUpdate(updated)
    setReplyText('')
    setReplying(false)
    setShowReplies(true)
  }

  async function handleReplyVote(replyId, vote) {
    const updated = await voteReply(message._id, replyId, vote)
    onUpdate(updated)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <span style={{ ...styles.username, ...(isOwner ? styles.mine : {}) }}>
            {isOwner ? '★ ' : ''}{message.username}
          </span>
          <span style={styles.time}>{formatDate(message.createdAt)}</span>
        </div>

        {/* Body */}
        {editing ? (
          <form onSubmit={handleEdit} style={styles.editForm}>
            <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2} autoFocus />
            <div style={styles.editActions}>
              <button type="submit" className="btn btn-primary btn-sm">SAVE</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setEditText(message.text) }}>CANCEL</button>
            </div>
          </form>
        ) : (
          <p style={styles.text}>{message.text}</p>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          <VoteButtons up={message.thumbsUp} down={message.thumbsDown} onVote={handleVote} />
          <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setReplying(r => !r)}>
              💬 {message.replies?.length > 0 ? message.replies.length : 'Reply'}
            </button>
            {message.replies?.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReplies(s => !s)}>
                {showReplies ? '▲ Hide' : '▼ Show'}
              </button>
            )}
            {isOwner && !editing && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✎ Edit</button>
                <button className="btn btn-sm" style={{ color: 'var(--accent2)', border: '1px solid transparent', padding: '5px 8px' }} onClick={handleDelete}>✕</button>
              </>
            )}
          </div>
        </div>

        {/* Reply form */}
        {replying && (
          <form onSubmit={handleReply} style={styles.replyForm}>
            <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." autoFocus />
            <button type="submit" className="btn btn-primary btn-sm">SEND</button>
          </form>
        )}
      </div>

      {/* Replies */}
      {showReplies && message.replies?.length > 0 && (
        <div style={styles.replies}>
          {message.replies.map(reply => (
            <div key={reply._id} style={styles.reply}>
              <div style={styles.replyHeader}>
                <span style={{ ...styles.username, fontSize: '11px', ...(reply.username === user ? styles.mine : {}) }}>
                  {reply.username === user ? '★ ' : ''}{reply.username}
                </span>
                <span style={styles.time}>{formatDate(reply.createdAt)}</span>
              </div>
              <p style={{ ...styles.text, fontSize: '13px' }}>{reply.text}</p>
              <VoteButtons up={reply.thumbsUp} down={reply.thumbsDown} onVote={(vote) => handleReplyVote(reply._id, vote)} small />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Thumbs up / down voting buttons.
 */
function VoteButtons({ up = 0, down = 0, onVote, small }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <button
        onClick={() => onVote('up')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent3)', fontSize: small ? '12px' : '13px', display: 'flex', alignItems: 'center', gap: '3px' }}>
        👍 <span style={{ color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{up}</span>
      </button>
      <button
        onClick={() => onVote('down')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent2)', fontSize: small ? '12px' : '13px', display: 'flex', alignItems: 'center', gap: '3px' }}>
        👎 <span style={{ color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{down}</span>
      </button>
    </div>
  )
}

const styles = {
  wrap: { animation: 'fadeIn 0.25s ease' },
  card: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '16px 18px',
  },
  header: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  username: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: 'var(--text2)', letterSpacing: '0.04em' },
  mine: { color: 'var(--accent)' },
  time: { fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' },
  text: { color: 'var(--text)', lineHeight: 1.65, marginBottom: '12px', wordBreak: 'break-word' },
  actions: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' },
  editForm: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
  editActions: { display: 'flex', gap: '8px' },
  replyForm: { display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' },
  replies: { marginLeft: '24px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' },
  reply: {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '12px 14px',
    borderLeft: '2px solid var(--accent)',
  },
  replyHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
}
