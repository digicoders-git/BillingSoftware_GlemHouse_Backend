const mongoose = require('mongoose');

const uri = "mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/GlemHouse_Billing?retryWrites=true&w=majority";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  packSize: { type: String },
  cartenSize: { type: String }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const updates = [
  { oldName: "Floor Cleaner (Lemon)", oldPack: "1 Lt", newName: "Floor Cleaner", newCarten: "1 Lt.*12" },
  { oldName: "Floor Cleaner (Pine)", oldPack: "1 Lt", newName: "Foor Cleaner (Pine)", newCarten: "1 Lt.*12" },
  { oldName: "Floor Cleaner (Lemon)", oldPack: "5 Lt", newName: "Floor Cleaner", newCarten: "5 Lt.*2" },
  { oldName: "Floor Cleaner (Pine)", oldPack: "5 Lt", newName: "Floor Cleaner (Pine)", newCarten: "5 Lt.*2" },
  { oldName: "Dish Wash Gel", oldPack: "250 ml", newName: "Dish Wash Gel", newCarten: "250 ml*36" },
  { oldName: "Dish Wash Gel", oldPack: "500 ml", newName: "Dish Wash Gel", newCarten: "500 ml*24" },
  { oldName: "Dish Wash Gel", oldPack: "5 Lt", newName: "Dish Wash Gel", newCarten: "5 Lt.*2" },
  { oldName: "Toilet Cleaner", oldPack: "250 ml", newName: "Toilet Cleaner", newCarten: "250 ml*36" },
  { oldName: "Toilet Cleaner", oldPack: "500 ml", newName: "Toilet Cleaner", newCarten: "500 ml*24" },
  { oldName: "Toilet Cleaner", oldPack: "1 Lt", newName: "Toilet Cleaner", newCarten: "1 Lt.*12" },
  { oldName: "Toilet Cleaner", oldPack: "5 Lt", newName: "Toilet Cleaner", newCarten: "5 Lt.*2" },
  { oldName: "Hand Wash (Natural)", oldPack: "250 ml", newName: "Hand Wash", newCarten: "250 ml*36" },
  { oldName: "Hand Wash (Aqua)", oldPack: "250 ml", newName: "Hand Wash (Aqua)", newCarten: "250 ml*36" },
  { oldName: "Hand Wash (Natural)", oldPack: "500 ml", newName: "Hand Wash", newCarten: "500 ml*24" },
  { oldName: "Hand Wash (Aqua)", oldPack: "500 ml", newName: "Hand Wash (Aqua)", newCarten: "500 ml*24" },
  { oldName: "Hand Wash (Natural)", oldPack: "5 Lt", newName: "Hand Wash", newCarten: "5 Lt.*2" },
  { oldName: "Hand Wash (Aqua)", oldPack: "5 Lt", newName: "Hand Wash (Aqua)", newCarten: "5 Lt.*2" },
  { oldName: "Green Consuntrate", oldPack: "250 ml", newName: "Green Consuntrate", newCarten: "250 ml*36" },
  { oldName: "Green Consuntrate", oldPack: "500 ml", newName: "Green Consuntrate", newCarten: "500 ml*24" },
  { oldName: "Green Consuntrate", oldPack: "1 Lt", newName: "Green Consuntrate", newCarten: "1 Lt.*12" },
  { oldName: "Green Consuntrate", oldPack: "5 Lt", newName: "Green Consuntrate", newCarten: "5Lt.*2" },
  { oldName: "White Consuntrate", oldPack: "250 ml", newName: "White Consuntrate", newCarten: "250 ml*36" },
  { oldName: "White Consuntrate", oldPack: "500 ml", newName: "White Consuntrate", newCarten: "500 ml*24" },
  { oldName: "White Consuntrate", oldPack: "1 Lt", newName: "White Consuntrate", newCarten: "1 Lt.*12" },
  // And the remaining products from before need to have their CartenSize dots checked
  { oldName: "White Consuntrate", oldPack: "5 Lt", newName: "White Consuntrate", newCarten: "5 Lt.*2" },
  { oldName: "Liquid Detergent", oldPack: "500 ml", newName: "Liquid Detergent", newCarten: "500 ml*24" },
  { oldName: "Liquid Detergent", oldPack: "1 Lt", newName: "Liquid Detergent", newCarten: "1 Lt.*12" },
  { oldName: "Liquid Detergent", oldPack: "5 Lt", newName: "Liquid Detergent", newCarten: "5 Lt.*2" },
];

async function update() {
  await mongoose.connect(uri);
  
  let count = 0;
  for (const u of updates) {
    const res = await Product.updateOne(
      { name: u.oldName, packSize: u.oldPack },
      { $set: { name: u.newName, cartenSize: u.newCarten } }
    );
    if (res.modifiedCount > 0) {
      console.log(`Updated ${u.oldName} -> ${u.newName}`);
      count++;
    }
  }

  // Also update Detergent Cake and Detergent Powders from the first image that had dots.
  // Actually, I'll just leave the Detergents as is because they didn't have dots or typo issues.
  
  console.log(`Updated ${count} products.`);
  process.exit(0);
}

update();
