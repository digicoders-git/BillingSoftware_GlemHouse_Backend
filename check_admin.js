require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const checkUser = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const user = await User.findOne({ email: 'admin@gmail.com' });
  
  if (user) {
    console.log('User found:', user.email);
    console.log('Hashed Password in DB:', user.password);
    
    // Test with admin123
    const isMatch = await bcrypt.compare('admin123', user.password);
    console.log('Match with "admin123":', isMatch);
    
    // Reset to admin123 for convenience
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash('admin123', salt);
    await user.save();
    console.log('Password reset to "admin123" for safety.');
  } else {
    console.log('User NOT found');
  }
  
  process.exit();
};

checkUser();

