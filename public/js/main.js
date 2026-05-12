document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initScrollReveal();
  initActiveNav();
  initSmoothScroll();
  initDateMin();
  initReservationForm();
  initFaq();
});

function initHeader() {
  const h = document.getElementById('header');
  if (!h) return;
  const update = () => h.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initMobileNav() {
  const burger = document.getElementById('burger');
  const nav    = document.getElementById('nav');
  if (!burger || !nav) return;
  const toggle = open => {
    nav.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggle(!nav.classList.contains('open')));
  nav.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => toggle(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
}

function initScrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const delay = parseInt(el.dataset.revealDelay || '0', 10);
      setTimeout(() => el.classList.add('visible'), delay);
      obs.unobserve(el);
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link[href^="#"]');
  if (!sections.length || !links.length) return;
  const header = document.getElementById('header');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
    });
  }, { rootMargin: `-${header ? header.offsetHeight : 80}px 0px -50% 0px`, threshold: 0 });
  sections.forEach(s => obs.observe(s));
}

function initSmoothScroll() {
  const header = document.getElementById('header');
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0);
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

function initDateMin() {
  const dateInput = document.getElementById('rdate');
  if (!dateInput) return;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = tomorrow.toISOString().split('T')[0];
}

function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('toggle', () => {
      const icon = item.querySelector('.faq-icon');
      if (icon) icon.textContent = item.open ? '×' : '+';
    });
  });
}

function initReservationForm() {
  const form       = document.getElementById('reservationForm');
  const successBox = document.getElementById('formSuccess');
  const errorBox   = document.getElementById('formError');
  const errorMsg   = document.getElementById('formErrorMsg');
  const submitBtn  = document.getElementById('submitBtn');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (errorBox) errorBox.hidden = true;

    const name    = form.name.value.trim();
    const phone   = form.phone.value.trim();
    const email   = form.email.value.trim();
    const service = form.service.value.trim();
    const date    = form.date.value;
    const time    = form.time.value;

    if (!name || !phone || !email || !service || !date || !time) {
      showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (name.length < 2) { showError('Le nom doit contenir au moins 2 caractères.'); return; }

    const captchaToken = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';
    if (!captchaToken) {
      showError('Veuillez valider le reCAPTCHA avant d\'envoyer.');
      return;
    }

    const data = {
      name, phone, email, service, date, time,
      message: form.message.value.trim(),
      'g-recaptcha-response': captchaToken,
    };

    setLoading(true);
    try {
      const res  = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erreur serveur');
      form.hidden = true;
      if (successBox) successBox.hidden = false;
    } catch (err) {
      showError(err.message || 'Erreur réseau. Veuillez réessayer.');
      if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
    } finally {
      setLoading(false);
    }
  });

  function setLoading(v) {
    submitBtn.disabled = v;
    const txt = submitBtn.querySelector('.btn-text');
    if (txt) txt.textContent = v ? 'Envoi en cours...' : 'Envoyer ma demande';
  }
  function showError(msg) {
    if (errorMsg) errorMsg.textContent = msg;
    if (errorBox) { errorBox.hidden = false; errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }
}
