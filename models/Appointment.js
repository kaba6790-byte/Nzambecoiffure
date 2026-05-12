const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, maxlength: 100 },
  phone:   { type: String, required: true, trim: true, maxlength: 30 },
  email:   { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
  service: { type: String, required: true, trim: true, maxlength: 100 },
  date:    { type: String, required: true },
  time:    { type: String, required: true },
  message: { type: String, trim: true, maxlength: 2000, default: '' },
  status:  { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
