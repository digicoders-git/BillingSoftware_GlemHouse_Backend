const mongoose = require('mongoose');
const Branch = require('./models/Branch');
const SalesRep = require('./models/SalesRep');
const Distributor = require('./models/Distributor');
require('dotenv').config();

async function activateAll() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const bResult = await Branch.updateMany({}, { status: 'Active' });
        console.log(`Updated ${bResult.modifiedCount} branches to Active`);

        const sResult = await SalesRep.updateMany({}, { status: 'Active' });
        console.log(`Updated ${sResult.modifiedCount} sales reps to Active`);

        const dResult = await Distributor.updateMany({}, { status: 'Active' });
        console.log(`Updated ${dResult.modifiedCount} distributors to Active`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

activateAll();
