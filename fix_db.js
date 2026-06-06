const mongoose = require('mongoose');

const uri = "mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/GlemHouse_Billing?retryWrites=true&w=majority";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, unique: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String },
  packSize: { type: String },
  cartenSize: { type: String }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function fix() {
  await mongoose.connect(uri);
  const products = await Product.find({});
  console.log(`Found ${products.length} total products.`);
  
  // Find products inserted by us recently (we can just check for cartenSize existence since we added it)
  const recent = products.filter(p => p.cartenSize && p.cartenSize.includes('*'));
  console.log(`Found ${recent.length} recent products with cartenSize.`);
  
  process.exit(0);
}

fix();
