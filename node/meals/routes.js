const express = require("express");
const router = express.Router();
const controller = require("./controller");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, controller.getMeals);
router.post("/", authMiddleware, controller.addMeal);
router.get("/public", controller.getAllMeals);


module.exports = router;
