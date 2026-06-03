require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const DistributorInventory = require('./models/DistributorInventory');
    
    const tableId = '6a01b9db1af1c9acd7a06035';
    const distributor1 = '6a01da5fae2a14c0ddaed5e7';
    const distributor2 = '6a08276685dd4d98a456f26b';
    
    // Check and add for distributor 1
    const existing1 = await DistributorInventory.findOne({distributor: distributor1, product: tableId});
    if(!existing1) {
      await DistributorInventory.create({distributor: distributor1, product: tableId, currentStock: 50});
      console.log('✅ Added Table (50 units) to Agrawal Distributor');
    } else {
      console.log('⚠️  Agrawal Distributor already has Table');
    }
    
    // Check and add for distributor 2
    const existing2 = await DistributorInventory.findOne({distributor: distributor2, product: tableId});
    if(!existing2) {
      await DistributorInventory.create({distributor: distributor2, product: tableId, currentStock: 30});
      console.log('✅ Added Table (30 units) to Partner');
    } else {
      console.log('⚠️  Partner already has Table');
    }
    
    console.log('\n✅ Distributor inventory updated successfully!');
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
