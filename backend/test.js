import mongoose from "mongoose";

const uri =
  "mongodb+srv://indigomart:ahironsharma@indigomart.dsztwrf.mongodb.net/indigomart?retryWrites=true&w=majority&appName=IndigoMart";

try {
  await mongoose.connect(uri);
  console.log("Connected!");
} catch (e) {
  console.error(e);
}