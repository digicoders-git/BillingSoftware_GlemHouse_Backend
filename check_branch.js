const mongoose = require('mongoose');
const User = require('./models/User');
const Branch = require('./models/Branch');
require('dotenv').config();

async function checkBranch() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const branches = await Branch.find({});
        console.log('--- Branch Accounts ---');
        branches.forEach(b => {
            console.log(`Name: ${b.name} | Email: ${b.email} | Status: ${b.status} | Password: ${b.password}`);
        });

        const branchUsers = await User.find({ role: 'branch' });
        console.log('\n--- Branch Users in Auth Table ---');
        branchUsers.forEach(u => {
            console.log(`Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkBranch();

