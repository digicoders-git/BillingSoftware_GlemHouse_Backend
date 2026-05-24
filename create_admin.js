require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Delete existing admin@gmail.com to be sure
  await User.deleteMany({ email: 'admin@gmail.com' });
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  
  const user = await User.create({
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: hashedPassword,
    role: 'admin'
  });
  
  console.log('Admin created successfully:', user.email);
  process.exit();
};

createAdmin();

