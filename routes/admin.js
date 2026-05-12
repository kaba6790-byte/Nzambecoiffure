const express     = require('express');
const protect     = require('../middleware/auth');
const Appointment = require('../models/Appointment');

const router = express.Router();
router.use(protect);

router.get('/appointments', async (_req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending','confirmed','cancelled'].includes(status))
      return res.status(400).json({ message: 'Statut invalide.' });
    const appt = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!appt) return res.status(404).json({ message: 'Rendez-vous introuvable.' });
    res.json({ appointment: appt });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/appointments/:id', async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndDelete(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Rendez-vous introuvable.' });
    res.json({ message: 'Supprimé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
