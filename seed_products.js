require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const sampleProducts = [
    { name: 'iPhone 15 Pro', sku: 'APL-IP15-P', price: 999, stock: 100, category: 'Electronics' },
    { name: 'MacBook Air M2', sku: 'APL-MBA-M2', price: 1299, stock: 50, category: 'Electronics' },
    { name: 'AirPods Pro 2', sku: 'APL-APP-2', price: 249, stock: 200, category: 'Accessories' },
    { name: 'Samsung Galaxy S24', sku: 'SAM-S24', price: 899, stock: 80, category: 'Electronics' },
    { name: 'Sony WH-1000XM5', sku: 'SNY-XM5', price: 349, stock: 60, category: 'Accessories' },
  ];

  await Product.deleteMany({});
  await Product.insertMany(sampleProducts);
  console.log('Products seeded successfully');
  process.exit();
};

seed();

