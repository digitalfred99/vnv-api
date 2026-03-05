// ── Toast ────────────────────────────────────────────────────
export function toast(msg, type = 'info', duration = 4000) {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, duration);
}

// ── Loading state on buttons ──────────────────────────────────
export function setLoading(btn, loading, text = '') {
  if (loading) {
    btn._origText = btn.innerHTML;
    btn.innerHTML = `<span class="loader loader-sm"></span>${text ? ' ' + text : ''}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._origText || btn.innerHTML;
    btn.disabled = false;
  }
}

// ── Format date ───────────────────────────────────────────────
export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
export function fmtDateTime(d) {
  if (!d) return '—';
  return `${fmtDate(d)} ${fmtTime(d)}`;
}

// ── Local storage helpers ─────────────────────────────────────
export const store = {
  get:    (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set:    (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  remove: (k) => localStorage.removeItem(k),
};

// ── Auth guards ───────────────────────────────────────────────
export function requireAdmin() {
  if (!localStorage.getItem('vnv_admin_token')) {
    window.location.href = '/admin/login.html';
  }
}
export function requireParticipant() {
  if (!localStorage.getItem('vnv_participant_token')) {
    window.location.href = '/register.html';
  }
}

// ── Badge helpers ─────────────────────────────────────────────
export function roleBadge(role) {
  const map = { SUPER_ADMIN: 'badge-orange', ADMIN: 'badge-cyan', STAFF: 'badge-grey' };
  return `<span class="badge ${map[role] || 'badge-grey'}">${role}</span>`;
}
export function zoneBadge(slug) {
  const map = { PT: 'badge-orange', SR: 'badge-cyan', SC: 'badge-green', SL: 'badge-grey' };
  const names = { PT: 'Partners', SR: 'Searching', SC: 'Social', SL: 'Solo' };
  return `<span class="badge ${map[slug] || 'badge-grey'}">${names[slug] || slug}</span>`;
}

// ── Debounce ──────────────────────────────────────────────────
export function debounce(fn, ms = 300) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Confirm dialog ────────────────────────────────────────────
export function confirm(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal" style="max-width:380px">
        <p style="font-size:1rem;font-weight:600;margin-bottom:8px">Confirm Action</p>
        <p class="text-muted" style="margin-bottom:24px">${msg}</p>
        <div class="flex gap-12 justify-center">
          <button class="btn btn-ghost" id="conf-no">Cancel</button>
          <button class="btn btn-danger" id="conf-yes">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#conf-yes').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#conf-no').onclick  = () => { overlay.remove(); resolve(false); };
  });
}

// ── Zone colors ───────────────────────────────────────────────
export const ZONE_COLOR = { PT: '#FF6B00', SR: '#00D4FF', SC: '#00E87A', SL: '#FFB800' };
export const ZONE_NAME  = { PT: 'Partners', SR: 'Searching', SC: 'Social', SL: 'Solo' };
