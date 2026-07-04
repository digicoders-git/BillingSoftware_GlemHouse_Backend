const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

// Load env vars
dotenv.config();

const products = [
  { name: 'Floor Cleaner', packSize: '1 Lt', cartenSize: '1 Lt.*12', price: 72.03, stock: 0 },
  { name: 'Floor Cleaner (Pine)', packSize: '1 Lt', cartenSize: '1 Lt.*12', price: 72.03, stock: 0 },
  { name: 'Floor Cleaner', packSize: '5 Lt', cartenSize: '5 Lt.*2', price: 304.24, stock: 0 },
  { name: 'Floor Cleaner (Pine)', packSize: '5 Lt', cartenSize: '5 Lt.*2', price: 304.24, stock: 0 },
  { name: 'Dish Wash Gel', packSize: '250 ml', cartenSize: '250 ml*36', price: 49.15, stock: 0 },
  { name: 'Dish Wash Gel', packSize: '500 ml', cartenSize: '500 ml*24', price: 105.93, stock: 0 },
  { name: 'Dish Wash Gel', packSize: '5 Lt', cartenSize: '5 Lt.*2', price: 576.27, stock: 0 },
  { name: 'Toilet Cleaner', packSize: '250 ml', cartenSize: '250 ml*36', price: 40.68, stock: 0 },
  { name: 'Toilet Cleaner', packSize: '500 ml', cartenSize: '500 ml*24', price: 83.90, stock: 0 },
  { name: 'Toilet Cleaner', packSize: '1 Lt', cartenSize: '1 Lt.*12', price: 168.64, stock: 0 },
  { name: 'Toilet Cleaner', packSize: '5 Lt', cartenSize: '5 Lt.*2', price: 550.85, stock: 0 },
  { name: 'Hand Wash', packSize: '250 ml', cartenSize: '250 ml*36', price: 72.03, stock: 0 },
  { name: 'Hand Wash (Aqua)', packSize: '250 ml', cartenSize: '250 ml*36', price: 72.03, stock: 0 },
  { name: 'Hand Wash', packSize: '500 ml', cartenSize: '500 ml*24', price: 126.27, stock: 0 },
  { name: 'Hand Wash (Aqua)', packSize: '500 ml', cartenSize: '500 ml*24', price: 126.27, stock: 0 },
  { name: 'Hand Wash', packSize: '5 Lt.', cartenSize: '5 Lt.*2', price: 584.75, stock: 0 },
  { name: 'Hand Wash (Aqua)', packSize: '5 Lt', cartenSize: '5 Lt.*2', price: 584.75, stock: 0 },
  { name: 'Green Consuntrate', packSize: '250 ml', cartenSize: '250 ml*36', price: 93.22, stock: 0 },
  { name: 'Green Consuntrate', packSize: '500 ml', cartenSize: '500 ml*24', price: 177.97, stock: 0 },
  { name: 'Green Consuntrate', packSize: '1 Lt', cartenSize: '1 Lt.*12', price: 313.56, stock: 0 },
  { name: 'Green Consuntrate', packSize: '5 Lt', cartenSize: '5Lt.*2', price: 1228.81, stock: 0 },
  { name: 'White Consuntrate', packSize: '250 ml', cartenSize: '250 ml*36', price: 122.88, stock: 0 },
  { name: 'White Consuntrate', packSize: '500 ml', cartenSize: '500 ml*24', price: 224.58, stock: 0 },
  { name: 'White Consuntrate', packSize: '1 Lt', cartenSize: '1 Lt.*12', price: 415.25, stock: 0 },
  { name: 'White Consuntrate', packSize: '5 Lt', cartenSize: '5 Lt.*2', price: 1524.58, stock: 0 },
  { name: 'Liquid Detergent', packSize: '500 ml', cartenSize: '500 ml*24', price: 109.32, stock: 0 },
  { name: 'Liquid Detergent', packSize: '1 Lt', cartenSize: '1 Lt.*12', price: 177.97, stock: 0 },
  { name: 'Liquid Detergent', packSize: '5 Lt.', cartenSize: '5 Lt.*2', price: 720.34, stock: 0 },
  { name: 'Detergent Cake', packSize: '160 gm', cartenSize: '160gm*50', price: 8.47, stock: 0 },
  { name: 'Detergent Powder', packSize: '80gm', cartenSize: '80 gm*100', price: 8.47, stock: 0 },
  { name: 'Detergent Powder', packSize: '500 gm', cartenSize: '500 gm*50', price: 38.14, stock: 0 },
  { name: 'Detergent Powder', packSize: '1 kg', cartenSize: '1 kg*25', price: 72.03, stock: 0 },
  { name: 'Detergent Powder', packSize: '3 kg', cartenSize: '3 kg*10', price: 233.05, stock: 0 },
  { name: 'Detergent Powder', packSize: '5 kg', cartenSize: '5 kg*5', price: 397.46, stock: 0 },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

const productsWithSku = products.map((p, i) => ({ ...p, sku: `IMG-SKU-${Date.now()}-${i}` }));
    await Product.insertMany(productsWithSku);
    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedProducts();
