const express   = require('express');
const rateLimit = require('express-rate-limit');
const { submit } = require('../controllers/appointmentController');

const router  = express.Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Trop de demandes. Réessayez dans 15 minutes.' },
});

router.post('/', limiter, submit);
module.exports = router;
