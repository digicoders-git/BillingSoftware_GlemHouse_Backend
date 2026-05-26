require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const BranchInventory = require('./models/BranchInventory');
const SalesRepInventory = require('./models/SalesRepInventory');
const DistributorInventory = require('./models/DistributorInventory');

const fixNegativeStocks = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected successfully.');

    // 1. Fix main Warehouse products
    const negativeProducts = await Product.find({ stock: { $lt: 0 } });
    console.log(`Found ${negativeProducts.length} main products with negative stock.`);
    for (const prod of negativeProducts) {
      console.log(`- Updating main product "${prod.name}" stock from ${prod.stock} to 0.`);
      prod.stock = 0;
      await prod.save();
    }

    // 2. Fix Branch inventories
    const negativeBranches = await BranchInventory.find({ currentStock: { $lt: 0 } });
    console.log(`Found ${negativeBranches.length} branch inventory items with negative stock.`);
    for (const bi of negativeBranches) {
      await bi.populate('product', 'name');
      console.log(`- Updating branch inventory for "${bi.product?.name || 'unknown'}" from ${bi.currentStock} to 0.`);
      bi.currentStock = 0;
      await bi.save();
    }

    // 3. Fix Sales Rep inventories
    const negativeSalesReps = await SalesRepInventory.find({ currentStock: { $lt: 0 } });
    console.log(`Found ${negativeSalesReps.length} sales rep inventory items with negative stock.`);
    for (const sri of negativeSalesReps) {
      await sri.populate('product', 'name');
      console.log(`- Updating sales rep inventory for "${sri.product?.name || 'unknown'}" from ${sri.currentStock} to 0.`);
      sri.currentStock = 0;
      await sri.save();
    }

    // 4. Fix Distributor inventories
    const negativeDistributors = await DistributorInventory.find({ currentStock: { $lt: 0 } });
    console.log(`Found ${negativeDistributors.length} distributor inventory items with negative stock.`);
    for (const di of negativeDistributors) {
      await di.populate('product', 'name');
      console.log(`- Updating distributor inventory for "${di.product?.name || 'unknown'}" from ${di.currentStock} to 0.`);
      di.currentStock = 0;
      await di.save();
    }

    console.log('Stock correction completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error correcting negative stocks:', error);
    process.exit(1);
  }
};

fixNegativeStocks();
