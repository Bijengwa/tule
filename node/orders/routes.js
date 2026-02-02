const express = require("express");
const router = express.Router();
const controller = require("./controller");
const authMiddleware = require("../middleware/authMiddleware");


router.post("/", authMiddleware, controller.createOrder);
router.get("/", authMiddleware, controller.getRestaurantOrders);
router.put("/:id", authMiddleware, controller.updateOrderStatus);
router.get("/user", authMiddleware, controller.getUserOrders);


module.exports = router;
