const BASE = 'http://localhost:8080';

/**
 * Wrapper around fetch that always sends credentials (cookies).
 * @param {string} path
 * @param {RequestInit} options
 */
async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}

export const getMe = () => api('/me');
export const signup = (username, password) => api('/signup', { method: 'POST', body: JSON.stringify({ username, password }) });
export const login = (username, password) => api('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const logout = () => api('/logout', { method: 'POST' });

export const getRooms = () => api('/rooms');
export const getRoom = (roomId) => api(`/rooms/${roomId}`);
export const createRoom = (name) => api('/create-room', { method: 'POST', body: JSON.stringify({ name }) });

export const getMessages = (roomId) => api(`/messages/${roomId}`);
export const sendMessage = (roomId, text) => api('/send-message', { method: 'POST', body: JSON.stringify({ roomId, text }) });
export const editMessage = (messageId, text) => api(`/messages/${messageId}`, { method: 'PATCH', body: JSON.stringify({ text }) });
export const deleteMessage = (messageId) => api(`/messages/${messageId}`, { method: 'DELETE' });
export const voteMessage = (messageId, vote) => api(`/messages/${messageId}/vote`, { method: 'POST', body: JSON.stringify({ vote }) });

export const sendReply = (messageId, text) => api(`/reply/${messageId}`, { method: 'POST', body: JSON.stringify({ text }) });
export const voteReply = (messageId, replyId, vote) => api(`/reply/${messageId}/${replyId}/vote`, { method: 'POST', body: JSON.stringify({ vote }) });
