const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./auth/authRoutes");
const mealRoutes = require("./meals/routes");
const orderRoutes = require("./orders/routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/orders", orderRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
