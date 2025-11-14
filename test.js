require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    console.log("MONGO_URI =", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected Successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
