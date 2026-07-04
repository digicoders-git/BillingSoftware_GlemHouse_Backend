const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Distributor = require('./models/Distributor');
const DistributorInventory = require('./models/DistributorInventory');
const SalesRep = require('./models/SalesRep');
const Branch = require('./models/Branch');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  try {
    const distUser = await User.findOne({ role: 'distributor' });
    const token = jwt.sign({ id: distUser._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    const distDoc = await Distributor.findOne({ user: distUser._id });
    const inventory = await DistributorInventory.find({ distributor: distDoc._id }).limit(1);
    
    if (inventory.length === 0 || inventory[0].currentStock === 0) {
        console.log('No inventory to return');
        return;
    }

    const itemToReturn = inventory[0];
    
    console.log('Initiating return for product', itemToReturn.product);

    const res = await fetch(`http://localhost:5555/api/returns`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            items: [{
                product: itemToReturn.product,
                name: 'Test Product',
                qty: 1,
                reason: 'Damaged'
            }],
            note: 'Testing from script'
        })
    });
    const data = await res.json();
    console.log(`POST /returns/initiate -> Status: ${res.status}`);
    console.log(data);

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
});
