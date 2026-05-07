require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkUsers = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({});
  console.log('Total Users:', users.length);
  users.forEach(u => {
    console.log(`- ${u.email} (${u.role})`);
  });
  process.exit();
};

checkUsers();
