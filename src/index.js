// require('dotenv').config()
import dotenv from "dotenv";
import connectDB from "./db/index1.js";
dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.listen(proces.env.port || 8000, () => {
      console.log(`server is running at port: ${process.env.port}`);
    });
  })
  .catch((err) => {
    console.log("Mongodb connection failed!!!!", err);
  });
