(function () {
  if (localStorage.getItem('nzambe_token')) {
    window.location.replace('dashboard.html');
    return;
  }

  const form     = document.getElementById('loginForm');
  const errBox   = document.getElementById('authError');
  const loginBtn = document.getElementById('loginBtn');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errBox.hidden = true;

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showError('Veuillez remplir tous les champs.');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Connexion…';

    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Identifiants incorrects.');
      localStorage.setItem('nzambe_token', data.token);
      window.location.replace('dashboard.html');
    } catch (err) {
      showError(err.message || 'Erreur réseau.');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Se connecter';
    }
  });

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
  }
})();
