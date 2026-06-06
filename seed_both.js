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

const sheet1 = [
  { name: "Floor Cleaner (Lemon)", packSize: "1 Lt", cartenSize: "1 Lt*12", price: 72.03, category: "Floor Cleaner" },
  { name: "Floor Cleaner (Pine)", packSize: "1 Lt", cartenSize: "1 Lt*12", price: 72.03, category: "Floor Cleaner" },
  { name: "Floor Cleaner (Lemon)", packSize: "5 Lt", cartenSize: "5 Lt*2", price: 304.24, category: "Floor Cleaner" },
  { name: "Floor Cleaner (Pine)", packSize: "5 Lt", cartenSize: "5 Lt*2", price: 304.24, category: "Floor Cleaner" },
  { name: "Dish Wash Gel", packSize: "250 ml", cartenSize: "250 ml*36", price: 49.15, category: "Dish Wash" },
  { name: "Dish Wash Gel", packSize: "500 ml", cartenSize: "500 ml*24", price: 105.93, category: "Dish Wash" },
  { name: "Dish Wash Gel", packSize: "5 Lt", cartenSize: "5 Lt*2", price: 576.27, category: "Dish Wash" },
  { name: "Toilet Cleaner", packSize: "250 ml", cartenSize: "250 ml*36", price: 40.68, category: "Toilet Cleaner" },
  { name: "Toilet Cleaner", packSize: "500 ml", cartenSize: "500 ml*24", price: 83.90, category: "Toilet Cleaner" },
  { name: "Toilet Cleaner", packSize: "1 Lt", cartenSize: "1 Lt*12", price: 168.64, category: "Toilet Cleaner" },
  { name: "Toilet Cleaner", packSize: "5 Lt", cartenSize: "5 Lt*2", price: 550.85, category: "Toilet Cleaner" },
  { name: "Hand Wash (Natural)", packSize: "250 ml", cartenSize: "250 ml*36", price: 72.03, category: "Hand Wash" },
  { name: "Hand Wash (Aqua)", packSize: "250 ml", cartenSize: "250 ml*36", price: 72.03, category: "Hand Wash" },
  { name: "Hand Wash (Natural)", packSize: "500 ml", cartenSize: "500 ml*24", price: 126.27, category: "Hand Wash" },
  { name: "Hand Wash (Aqua)", packSize: "500 ml", cartenSize: "500 ml*24", price: 126.27, category: "Hand Wash" },
  { name: "Hand Wash (Natural)", packSize: "5 Lt", cartenSize: "5 Lt*2", price: 584.75, category: "Hand Wash" },
  { name: "Hand Wash (Aqua)", packSize: "5 Lt", cartenSize: "5 Lt*2", price: 584.75, category: "Hand Wash" },
  { name: "Green Consuntrate", packSize: "250 ml", cartenSize: "250 ml*36", price: 93.22, category: "Consuntrate" },
  { name: "Green Consuntrate", packSize: "500 ml", cartenSize: "500 ml*24", price: 177.97, category: "Consuntrate" },
  { name: "Green Consuntrate", packSize: "1 Lt", cartenSize: "1 Lt*12", price: 313.56, category: "Consuntrate" },
  { name: "Green Consuntrate", packSize: "5 Lt", cartenSize: "5 Lt*2", price: 1228.81, category: "Consuntrate" },
  { name: "White Consuntrate", packSize: "250 ml", cartenSize: "250 ml*36", price: 122.88, category: "Consuntrate" },
  { name: "White Consuntrate", packSize: "500 ml", cartenSize: "500 ml*24", price: 224.58, category: "Consuntrate" },
  { name: "White Consuntrate", packSize: "1 Lt", cartenSize: "1 Lt*12", price: 413.25, category: "Consuntrate" },
  { name: "White Consuntrate", packSize: "5 Lt", cartenSize: "5 Lt*2", price: 1524.58, category: "Consuntrate" },
  { name: "Liquid Detergent", packSize: "500 ml", cartenSize: "500 ml*24", price: 109.32, category: "Detergent" },
  { name: "Liquid Detergent", packSize: "1 Lt", cartenSize: "1 Lt*12", price: 177.97, category: "Detergent" },
  { name: "Liquid Detergent", packSize: "5 Lt", cartenSize: "5 Lt*2", price: 720.34, category: "Detergent" },
  { name: "Detergent Cake", packSize: "160 gm", cartenSize: "160 gm*50", price: 8.47, category: "Detergent" },
  { name: "Detergent Powder", packSize: "80 gm", cartenSize: "80 gm*100", price: 8.47, category: "Detergent" },
  { name: "Detergent Powder", packSize: "500 gm", cartenSize: "500 gm*50", price: 38.14, category: "Detergent" },
  { name: "Detergent Powder", packSize: "1 kg", cartenSize: "1 kg*25", price: 72.03, category: "Detergent" },
  { name: "Detergent Powder", packSize: "3 kg", cartenSize: "3 kg*10", price: 233.05, category: "Detergent" },
  { name: "Detergent Powder", packSize: "5 kg", cartenSize: "5 kg*5", price: 397.46, category: "Detergent" }
];

const sheet2 = [
  { name: "Floor Cleaner", packSize: "1 Lt", cartenSize: "1 Lt.*12", price: 72.03, category: "Floor Cleaner" },
  { name: "Foor Cleaner (Pine)", packSize: "1 Lt", cartenSize: "1 Lt.*12", price: 72.03, category: "Floor Cleaner" },
  { name: "Floor Cleaner", packSize: "5 Lt", cartenSize: "5 Lt.*2", price: 304.24, category: "Floor Cleaner" },
  { name: "Floor Cleaner (Pine)", packSize: "5 Lt", cartenSize: "5 Lt.*2", price: 304.24, category: "Floor Cleaner" },
  { name: "Dish Wash Gel", packSize: "250 ml", cartenSize: "250 ml*36", price: 49.15, category: "Dish Wash" },
  { name: "Dish Wash Gel", packSize: "500 ml", cartenSize: "500 ml*24", price: 105.93, category: "Dish Wash" },
  { name: "Dish Wash Gel", packSize: "5 Lt", cartenSize: "5 Lt.*2", price: 576.27, category: "Dish Wash" },
  { name: "Toilet Cleaner", packSize: "250 ml", cartenSize: "250 ml*36", price: 40.68, category: "Toilet Cleaner" },
  { name: "Toilet Cleaner", packSize: "500 ml", cartenSize: "500 ml*24", price: 83.90, category: "Toilet Cleaner" },
  { name: "Toilet Cleaner", packSize: "1 Lt", cartenSize: "1 Lt.*12", price: 168.64, category: "Toilet Cleaner" },
  { name: "Toilet Cleaner", packSize: "5 Lt", cartenSize: "5 Lt.*2", price: 550.85, category: "Toilet Cleaner" },
  { name: "Hand Wash", packSize: "250 ml", cartenSize: "250 ml*36", price: 72.03, category: "Hand Wash" },
  { name: "Hand Wash (Aqua)", packSize: "250 ml", cartenSize: "250 ml*36", price: 72.03, category: "Hand Wash" },
  { name: "Hand Wash", packSize: "500 ml", cartenSize: "500 ml*24", price: 126.27, category: "Hand Wash" },
  { name: "Hand Wash (Aqua)", packSize: "500 ml", cartenSize: "500 ml*24", price: 126.27, category: "Hand Wash" },
  { name: "Hand Wash", packSize: "5 Lt", cartenSize: "5 Lt.*2", price: 584.75, category: "Hand Wash" },
  { name: "Hand Wash (Aqua)", packSize: "5 Lt", cartenSize: "5 Lt.*2", price: 584.75, category: "Hand Wash" },
  { name: "Green Consuntrate", packSize: "250 ml", cartenSize: "250 ml*36", price: 93.22, category: "Consuntrate" },
  { name: "Green Consuntrate", packSize: "500 ml", cartenSize: "500 ml*24", price: 177.97, category: "Consuntrate" },
  { name: "Green Consuntrate", packSize: "1 Lt", cartenSize: "1 Lt.*12", price: 313.56, category: "Consuntrate" },
  { name: "Green Consuntrate", packSize: "5 Lt", cartenSize: "5Lt.*2", price: 1228.81, category: "Consuntrate" },
  { name: "White Consuntrate", packSize: "250 ml", cartenSize: "250 ml*36", price: 122.88, category: "Consuntrate" },
  { name: "White Consuntrate", packSize: "500 ml", cartenSize: "500 ml*24", price: 224.58, category: "Consuntrate" },
  { name: "White Consuntrate", packSize: "1 Lt", cartenSize: "1 Lt.*12", price: 413.25, category: "Consuntrate" }
];

async function seedBoth() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    // Clear existing products to avoid duplicates
    await Product.deleteMany({});
    console.log("Cleared existing products");

    const allProducts = [...sheet1, ...sheet2];
    let inserted = 0;

    for (let i = 0; i < allProducts.length; i++) {
      const p = allProducts[i];
      // Generate a unique SKU using index to ensure uniqueness even if names are similar
      p.sku = `PRD-${Date.now()}-${i}-${Math.floor(Math.random()*1000)}`;
      await Product.create(p);
      console.log(`Inserted ${p.name} - ${p.packSize}`);
      inserted++;
    }

    console.log(`Seed complete! Successfully inserted ${inserted} products (34 from sheet 1 + 24 from sheet 2).`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedBoth();
