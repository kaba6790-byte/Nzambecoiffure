require('dotenv').config();
const mongoose = require('mongoose');
const Admin    = require('../models/Admin');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const exists = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
  if (exists) {
    console.log('✅ Admin existe déjà.');
    process.exit(0);
  }
  await Admin.create({
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  });
  console.log(`✅ Admin créé : ${process.env.ADMIN_USERNAME}`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
