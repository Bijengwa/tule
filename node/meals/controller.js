const knex = require("../database/knex");

// GET all meals (for logged-in restaurant)
exports.getMeals = async (req, res) => {
  try {
    const meals = await knex("meals")
      .where("restaurant_id", req.user.id)
      .select("id", "name", "price");

    res.json(meals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch meals" });
  }
};

// ADD meal (restaurant only)
exports.addMeal = async (req, res) => {
  const { name, price } = req.body;

  if (req.user.role !== "restaurant") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    await knex("meals").insert({
      restaurant_id: req.user.id,
      name,
      price
    });

    res.json({ message: "Meal added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add meal" });
  }
};

// PUBLIC - get all meals with restaurant name
exports.getAllMeals = async (req, res) => {
  try {
    const meals = await knex("meals")
      .join("accounts", "meals.restaurant_id", "accounts.id")
      .select(
        "meals.id",
        "meals.name",
        "meals.price",
        "accounts.name as restaurant_name"
      );

    res.json(meals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch meals" });
  }
};
