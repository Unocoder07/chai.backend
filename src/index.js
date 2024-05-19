// require('dotenv').config()
import dotenv from "dotenv";
import connectDB from "./db/index1.js";
dotenv.config({
  path: "./env",
});
connectDB();
// const app = express();~
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("error", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`app is listnign on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log("erroe", error);
//     throw err;
//   }
// })();
