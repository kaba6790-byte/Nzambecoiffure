const axios       = require('axios');
const Appointment = require('../models/Appointment');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s\+\-\(\)\.]{6,20}$/;

async function verifyCaptcha(token) {
  const { data } = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
    params: { secret: process.env.RECAPTCHA_SECRET, response: token },
    timeout: 5000,
  });
  return data.success === true;
}

exports.submit = async (req, res) => {
  try {
    const { name, phone, email, service, date, time, message, honeypot } = req.body;
    const captchaToken = req.body['g-recaptcha-response'];

    if (honeypot) return res.status(201).json({ message: 'Demande reçue.' });

    if (!name || !phone || !email || !service || !date || !time)
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });

    if (name.trim().length < 2 || name.trim().length > 100)
      return res.status(400).json({ message: 'Le nom doit contenir entre 2 et 100 caractères.' });
    if (!EMAIL_RE.test(email))
      return res.status(400).json({ message: 'Adresse email invalide.' });
    if (!PHONE_RE.test(phone))
      return res.status(400).json({ message: 'Numéro de téléphone invalide.' });

    if (!captchaToken)
      return res.status(400).json({ message: 'Veuillez valider le reCAPTCHA.' });
    const captchaOk = await verifyCaptcha(captchaToken);
    if (!captchaOk)
      return res.status(400).json({ message: 'Vérification reCAPTCHA échouée. Veuillez réessayer.' });

    const appt = await Appointment.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      service: service.trim(),
      date,
      time,
      message: (message || '').trim(),
    });

    res.status(201).json({ message: 'Rendez-vous enregistré avec succès.', id: appt._id });
  } catch (err) {
    console.error('[appointment]', err.message);
    if (err.code === 'ECONNABORTED') return res.status(503).json({ message: 'Service indisponible. Réessayez.' });
    res.status(500).json({ message: 'Erreur serveur. Veuillez réessayer.' });
  }
};
