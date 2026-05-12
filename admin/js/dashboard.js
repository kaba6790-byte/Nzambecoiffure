(function () {
  const TOKEN_KEY = 'nzambe_token';
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) { window.location.replace('index.html'); return; }

  // ── State ──────────────────────────────────────────────
  let all        = [];
  let filtered   = [];
  let activeTab  = 'all';
  let searchQ    = '';
  let currentId  = null;

  // ── DOM refs ───────────────────────────────────────────
  const tbody        = document.getElementById('apptTbody');
  const loadingState = document.getElementById('loadingState');
  const emptyState   = document.getElementById('emptyState');
  const tableWrap    = document.getElementById('apptTable');
  const searchInput  = document.getElementById('searchInput');
  const pendingBadge = document.getElementById('pendingBadge');
  const refreshBtn   = document.getElementById('refreshBtn');
  const logoutBtn    = document.getElementById('logoutBtn');
  const dashDate     = document.getElementById('dashDate');

  // stats
  const totalCount     = document.getElementById('totalCount');
  const pendingCount   = document.getElementById('pendingCount');
  const confirmedCount = document.getElementById('confirmedCount');
  const todayCount     = document.getElementById('todayCount');

  // modal
  const overlay        = document.getElementById('modalOverlay');
  const modalClose     = document.getElementById('modalClose');
  const modalCloseText = document.getElementById('modalCloseText');
  const modalName      = document.getElementById('modalName');
  const modalService   = document.getElementById('modalService');
  const modalDate      = document.getElementById('modalDate');
  const modalTime      = document.getElementById('modalTime');
  const modalStatus    = document.getElementById('modalStatus');
  const modalEmail     = document.getElementById('modalEmail');
  const modalPhone     = document.getElementById('modalPhone');
  const modalMessage   = document.getElementById('modalMessage');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');
  const modalCancelBtn  = document.getElementById('modalCancelBtn');
  const modalDeleteBtn  = document.getElementById('modalDeleteBtn');

  // ── Init ───────────────────────────────────────────────
  const now = new Date();
  if (dashDate) {
    dashDate.textContent = now.toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  load();

  // ── Load data ──────────────────────────────────────────
  async function load() {
    setLoading(true);
    try {
      const res  = await apiFetch('/api/admin/appointments');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      all = data;
      render();
    } catch (err) {
      if (err.message === '401') { logout(); return; }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(v) {
    loadingState.hidden  = !v;
    tableWrap.hidden     = v;
  }

  // ── Render ─────────────────────────────────────────────
  function render() {
    const todayStr = new Date().toISOString().split('T')[0];

    // Stats
    totalCount.textContent     = all.length;
    pendingCount.textContent   = all.filter(a => a.status === 'pending').length;
    confirmedCount.textContent = all.filter(a => a.status === 'confirmed').length;
    todayCount.textContent     = all.filter(a => a.date === todayStr).length;
    pendingBadge.textContent   = all.filter(a => a.status === 'pending').length || '';

    // Filter
    filtered = all.filter(a => {
      const matchTab =
        activeTab === 'all'       ? true :
        activeTab === 'pending'   ? a.status === 'pending' :
        activeTab === 'confirmed' ? a.status === 'confirmed' :
        activeTab === 'cancelled' ? a.status === 'cancelled' : true;

      if (!matchTab) return false;

      if (searchQ) {
        const q = searchQ.toLowerCase();
        return (
          a.name.toLowerCase().includes(q)   ||
          a.email.toLowerCase().includes(q)  ||
          a.service.toLowerCase().includes(q) ||
          a.phone.includes(q)
        );
      }
      return true;
    });

    // Sort: pending first, then by date desc
    filtered.sort((a, b) => {
      const statusOrder = { pending: 0, confirmed: 1, cancelled: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status])
        return statusOrder[a.status] - statusOrder[b.status];
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    emptyState.hidden = filtered.length > 0;
    tbody.innerHTML   = filtered.map(row).join('');

    tbody.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('click', () => openModal(tr.dataset.id));
    });
  }

  function row(a) {
    const dateStr = a.date
      ? new Date(a.date + 'T00:00:00').toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
      : '—';
    return `
      <tr data-id="${a._id}">
        <td><span class="badge badge-${a.status}">${labelStatus(a.status)}</span></td>
        <td>
          <div class="td-name">${esc(a.name)}</div>
          <div class="td-email">${esc(a.email)}</div>
        </td>
        <td>${esc(a.service)}</td>
        <td>${dateStr} à ${esc(a.time)}</td>
        <td>${esc(a.phone)}</td>
        <td><button class="btn-detail" type="button">Détails</button></td>
      </tr>`;
  }

  // ── Modal ──────────────────────────────────────────────
  function openModal(id) {
    const a = all.find(x => x._id === id);
    if (!a) return;
    currentId = id;

    const dateStr = a.date
      ? new Date(a.date + 'T00:00:00').toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
      : '—';

    modalName.textContent    = a.name;
    modalService.textContent = a.service;
    modalDate.textContent    = dateStr;
    modalTime.textContent    = a.time;
    modalStatus.textContent  = labelStatus(a.status);
    modalStatus.className    = `badge badge-${a.status}`;
    modalEmail.textContent   = a.email;
    modalPhone.textContent   = a.phone;
    modalMessage.textContent = a.message || '';

    // Show/hide action buttons based on status
    modalConfirmBtn.hidden = a.status === 'confirmed' || a.status === 'cancelled';
    modalCancelBtn.hidden  = a.status === 'cancelled';

    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    currentId = null;
  }

  modalClose.addEventListener('click', closeModal);
  modalCloseText.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ── Actions ────────────────────────────────────────────
  modalConfirmBtn.addEventListener('click', async () => {
    await updateStatus(currentId, 'confirmed');
  });

  modalCancelBtn.addEventListener('click', async () => {
    await updateStatus(currentId, 'cancelled');
  });

  modalDeleteBtn.addEventListener('click', async () => {
    if (!currentId) return;
    if (!confirm('Supprimer définitivement ce rendez-vous ?')) return;
    try {
      const res = await apiFetch(`/api/admin/appointments/${currentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      all = all.filter(a => a._id !== currentId);
      closeModal();
      render();
    } catch { alert('Erreur lors de la suppression.'); }
  });

  async function updateStatus(id, status) {
    if (!id) return;
    try {
      const res = await apiFetch(`/api/admin/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const idx = all.findIndex(a => a._id === id);
      if (idx !== -1) all[idx] = data;
      closeModal();
      render();
    } catch { alert('Erreur lors de la mise à jour.'); }
  }

  // ── Filters ────────────────────────────────────────────
  document.querySelectorAll('.ftab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.filter;
      render();
    });
  });

  searchInput.addEventListener('input', () => {
    searchQ = searchInput.value.trim();
    render();
  });

  refreshBtn.addEventListener('click', load);

  // ── Logout ─────────────────────────────────────────────
  logoutBtn.addEventListener('click', logout);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.replace('index.html');
  }

  // ── Helpers ────────────────────────────────────────────
  function apiFetch(url, opts = {}) {
    return fetch(url, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
    });
  }

  function labelStatus(s) {
    return s === 'pending' ? 'En attente' : s === 'confirmed' ? 'Confirmé' : 'Annulé';
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
