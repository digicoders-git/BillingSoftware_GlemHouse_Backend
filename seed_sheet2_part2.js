const mongoose = require('mongoose');

const uri = "mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/GlemHouse_Billing?retryWrites=true&w=majority";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, unique: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String },
  minLevel: { type: Number, default: 5 },
  description: { type: String },
  image: { type: String },
  hsn: { type: String },
  batch: { type: String },
  packSize: { type: String },
  cartenSize: { type: String }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const sheet2Part2 = [
  { name: "White Consuntrate", packSize: "5 Lt", cartenSize: "5 Lt.*2", price: 1524.58, category: "Consuntrate" },
  { name: "Liquid Detergent", packSize: "500 ml", cartenSize: "500 ml*24", price: 109.32, category: "Detergent" },
  { name: "Liquid Detergent", packSize: "1 Lt", cartenSize: "1 Lt.*12", price: 177.97, category: "Detergent" },
  { name: "Liquid Detergent", packSize: "5 Lt.", cartenSize: "5 Lt.*2", price: 720.34, category: "Detergent" },
  { name: "Detergent Cake", packSize: "160 gm", cartenSize: "160gm*50", price: 8.47, category: "Detergent" },
  { name: "Detergent Powder", packSize: "80gm", cartenSize: "80 gm*100", price: 8.47, category: "Detergent" },
  { name: "Detergent Powder", packSize: "500 gm", cartenSize: "500 gm*50", price: 38.14, category: "Detergent" },
  { name: "Detergent Powder", packSize: "1 kg", cartenSize: "1 kg*25", price: 72.03, category: "Detergent" },
  { name: "Detergent Powder", packSize: "3 kg", cartenSize: "3 kg*10", price: 233.05, category: "Detergent" },
  { name: "Detergent Powder", packSize: "5 kg", cartenSize: "5 kg*5", price: 397.46, category: "Detergent" }
];

async function seedSheet2Part2() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    let inserted = 0;

    for (let i = 0; i < sheet2Part2.length; i++) {
      const p = sheet2Part2[i];
      p.sku = `PRD-${Date.now()}-${i}-${Math.floor(Math.random()*1000)}`;
      await Product.create(p);
      console.log(`Inserted ${p.name} - ${p.packSize}`);
      inserted++;
    }

    console.log(`Seed complete! Successfully inserted ${inserted} products from sheet 2 part 2.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedSheet2Part2();
