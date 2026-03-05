const API_BASE = '/vnv/api';

const _req = async (method, path, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data.data;
};

const getToken  = () => localStorage.getItem('vnv_admin_token');
const getPToken = () => localStorage.getItem('vnv_participant_token');

export const API = {
  // ── Auth ────────────────────────────────────────────────────
  adminLogin:   (email, password) => _req('POST', '/admin/login', { email, password }),
  participantLogin: (code) => _req('POST', '/participants/login', { code }),

  // ── Admin ────────────────────────────────────────────────────
  getMe:         () => _req('GET', '/admin/me', null, getToken()),
  getAdmins:     () => _req('GET', '/admin', null, getToken()),
  createAdmin:   (d) => _req('POST', '/admin', d, getToken()),
  updateAdmin:   (id, d) => _req('PATCH', `/admin/${id}`, d, getToken()),
  toggleAdmin:   (id) => _req('PATCH', `/admin/${id}/toggle`, {}, getToken()),
  deleteAdmin:   (id) => _req('DELETE', `/admin/${id}`, null, getToken()),
  changePassword:(old_, new_) => _req('PATCH', '/admin/me/password', { oldPassword: old_, newPassword: new_ }, getToken()),

  // ── Categories ───────────────────────────────────────────────
  getCategories:    () => _req('GET', '/categories'),
  getCategoryById:  (id) => _req('GET', `/categories/${id}`),
  createCategory:   (d) => _req('POST', '/categories', d, getToken()),
  updateCategory:   (id, d) => _req('PATCH', `/categories/${id}`, d, getToken()),
  deleteCategory:   (id) => _req('DELETE', `/categories/${id}`, null, getToken()),

  // ── Access Codes ─────────────────────────────────────────────
  validateCode:  (code) => _req('POST', '/access-codes/validate', { code }),
  generateCodes: (categoryId, count) => _req('POST', '/access-codes/generate', { categoryId, count }, getToken()),
  markCodeSold:  (code) => _req('PATCH', `/access-codes/${code}/sell`, {}, getToken()),
  getCodes:      (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return _req('GET', `/access-codes${q ? '?' + q : ''}`, null, getToken());
  },

  // ── Participants ─────────────────────────────────────────────
  register:         (d) => _req('POST', '/participants/register', d),
  registerPartners: (d) => _req('POST', '/participants/register/partners', d),
  getProfile:       () => _req('GET', '/participants/me', null, getPToken()),
  getParticipants:  (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return _req('GET', `/participants${q ? '?' + q : ''}`, null, getToken());
  },

  // ── Seats ────────────────────────────────────────────────────
  getSeats:     (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return _req('GET', `/seats${q ? '?' + q : ''}`, null, getToken());
  },
  getSeatSummary: () => _req('GET', '/seats/summary', null, getToken()),
  createSeats:    (d) => _req('POST', '/seats/batch', d, getToken()),
  toggleReserve:  (id) => _req('PATCH', `/seats/${id}/reserve`, {}, getToken()),
  reassignSeat:   (participantId, seatId) => _req('PATCH', '/seats/reassign', { participantId, seatId }, getToken()),
  deleteSeat:     (id) => _req('DELETE', `/seats/${id}`, null, getToken()),

  // ── Seat Assignments ──────────────────────────────────────────
  getAssignments:       (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return _req('GET', `/seat-assignments${q ? '?' + q : ''}`, null, getToken());
  },
  getAssignmentBySeat:  (seatId) => _req('GET', `/seat-assignments/seat/${seatId}`, null, getToken()),

  // ── Check-In ──────────────────────────────────────────────────
  checkIn:          (code, method, notes) => _req('POST', '/checkin', { code, method, notes }, getToken()),
  getCheckIns:      (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return _req('GET', `/checkin${q ? '?' + q : ''}`, null, getToken());
  },
  getCheckinStats:  () => _req('GET', '/checkin/stats', null, getToken()),
};
