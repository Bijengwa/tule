const knex = require("../database/knex");

// USER places order
exports.createOrder = async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Only users can place orders" });
  }

  const { meal_id } = req.body;

  try {
    if (!meal_id) {
      return res.status(400).json({ message: "Meal ID is required" });
    }

    const meal = await knex("meals")
      .where("id", meal_id)
      .first();

    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    await knex("orders").insert({
      meal_id,
      restaurant_id: meal.restaurant_id,
      user_id: req.user.id,
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully"
    });

  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ message: "Order failed" });
  }
};


// RESTAURANT sees all orders
exports.getRestaurantOrders = async (req, res) => {
  if (req.user.role !== "restaurant") {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  try {
    const orders = await knex("orders")
      .join("meals", "orders.meal_id", "meals.id")
      .join("accounts", "orders.user_id", "accounts.id")
      .where("orders.restaurant_id", req.user.id)
      .select(
        "orders.id",
        "orders.status",
        "orders.created_at",
        "meals.name as meal_name",
        "meals.price as meal_price",
        "accounts.name as customer_name",
        "accounts.phone as customer_phone"
      )
      .orderBy("orders.created_at", "desc");

    const formattedOrders = orders.map(order => ({
      id: order.id,
      status: order.status,
      total_price: order.meal_price,
      created_at: order.created_at,
      meal: {
        name: order.meal_name
      },
      customer: {
        name: order.customer_name,
        phone: order.customer_phone
      }
    }));

    res.json({
      success: true,
      orders: formattedOrders
    });

  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


// RESTAURANT updates order status
exports.updateOrderStatus = async (req, res) => {
  if (req.user.role !== "restaurant") {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  const { status } = req.body;
  const { id } = req.params;

  // Validate order ID
  if (!id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  // Validate status
  const validStatuses = ["pending", "processing", "ready", "completed", "cancelled"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
    });
  }

  try {
    // Check if order exists and belongs to this restaurant
    const order = await knex("orders")
      .where("id", id)
      .where("restaurant_id", req.user.id)
      .first();

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found or you don't have permission to update it"
      });
    }

    // Prevent updating completed or cancelled orders
    if (["completed", "cancelled"].includes(order.status)) {
      return res.status(400).json({ 
        message: `Cannot update an order that is already ${order.status}`
      });
    }

    // Update order status
    const updated = await knex("orders")
      .where("id", id)
      .update({ 
        status, 
        updated_at: knex.fn.now()
      });

    if (!updated) {
      return res.status(500).json({ message: "Failed to update order status" });
    }

    res.json({ 
      success: true,
      message: `Order status updated to ${status}`,
      order_id: id,
      new_status: status
    });

  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ 
      message: "Failed to update order status",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};

// USER sees their own orders
exports.getUserOrders = async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  try {
    const orders = await knex("orders")
      .join("meals", "orders.meal_id", "meals.id")
      .join("accounts", "orders.restaurant_id", "accounts.id")
      .where("orders.user_id", req.user.id)
      .select(
        "orders.id",
        "orders.status",
        "orders.created_at",
        "meals.name as meal_name",
        "meals.price as meal_price",
        "accounts.name as restaurant_name",
        "accounts.phone as restaurant_phone"
      )
      .orderBy("orders.created_at", "desc");

    const formattedOrders = orders.map(order => ({
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      meal: {
        name: order.meal_name,
        price: order.meal_price
      },
      restaurant: {
        name: order.restaurant_name,
        phone: order.restaurant_phone
      }
    }));

    res.json({
      success: true,
      orders: formattedOrders
    });

  } catch (err) {
    console.error("Fetch user orders error:", err);
    res.status(500).json({ message: "Failed to fetch your orders" });
  }
};



// Get single order details (for both user and restaurant)
exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await knex("orders")
      .join("meals", "orders.meal_id", "meals.id")
      .leftJoin("accounts as customer", "orders.user_id", "customer.id")
      .leftJoin("accounts as restaurant", "orders.restaurant_id", "restaurant.id")
      .where("orders.id", id)
      .select(
        "orders.*",
        "meals.name as meal_name",
        "meals.description as meal_description",
        "meals.image_url as meal_image",
        "meals.price as unit_price",
        "customer.name as customer_name",
        "customer.phone as customer_phone",
        "customer.email as customer_email",
        "restaurant.name as restaurant_name",
        "restaurant.phone as restaurant_phone",
        "restaurant.address as restaurant_address"
      )
      .first();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check permissions
    if (req.user.role === "user" && order.user_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "restaurant" && order.restaurant_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Format the response
    const formattedOrder = {
      id: order.id,
      status: order.status,
      quantity: order.quantity,
      total_price: parseFloat(order.total_price),
      unit_price: parseFloat(order.unit_price),
      special_instructions: order.special_instructions,
      created_at: order.created_at,
      updated_at: order.updated_at,
      meal: {
        id: order.meal_id,
        name: order.meal_name,
        description: order.meal_description,
        image_url: order.meal_image,
        unit_price: parseFloat(order.unit_price)
      },
      customer: req.user.role === "restaurant" ? {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email
      } : undefined,
      restaurant: req.user.role === "user" ? {
        name: order.restaurant_name,
        phone: order.restaurant_phone,
        address: order.restaurant_address
      } : undefined
    };

    res.json({
      success: true,
      order: formattedOrder
    });

  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ 
      message: "Failed to fetch order details",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};

// Get orders by status (for restaurant dashboard)
exports.getOrdersByStatus = async (req, res) => {
  if (req.user.role !== "restaurant") {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  const { status } = req.params;

  // Validate status
  const validStatuses = ["pending", "processing", "ready", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
    });
  }

  try {
    const orders = await knex("orders")
      .join("meals", "orders.meal_id", "meals.id")
      .join("accounts", "orders.user_id", "accounts.id")
      .where("orders.restaurant_id", req.user.id)
      .where("orders.status", status)
      .select(
        "orders.id",
        "orders.quantity",
        "orders.total_price",
        "orders.special_instructions",
        "orders.created_at",
        "meals.name as meal_name",
        "meals.image_url as meal_image",
        "accounts.name as customer_name",
        "accounts.phone as customer_phone"
      )
      .orderBy("orders.created_at", "asc");

    res.json({
      success: true,
      status: status,
      count: orders.length,
      orders: orders.map(order => ({
        ...order,
        total_price: parseFloat(order.total_price)
      }))
    });

  } catch (err) {
    console.error("Get orders by status error:", err);
    res.status(500).json({ 
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};

// Cancel order (user only)
exports.cancelOrder = async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Only users can cancel their orders" });
  }

  const { id } = req.params;

  try {
    // Check if order exists and belongs to user
    const order = await knex("orders")
      .where("id", id)
      .where("user_id", req.user.id)
      .first();

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found or you don't have permission to cancel it"
      });
    }

    // Only allow cancellation if order is still pending
    if (order.status !== "pending") {
      return res.status(400).json({ 
        message: `Cannot cancel order. Current status is: ${order.status}`
      });
    }

    // Update order status to cancelled
    const updated = await knex("orders")
      .where("id", id)
      .update({ 
        status: "cancelled",
        updated_at: knex.fn.now()
      });

    if (!updated) {
      return res.status(500).json({ message: "Failed to cancel order" });
    }

    res.json({ 
      success: true,
      message: "Order cancelled successfully",
      order_id: id
    });

  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ 
      message: "Failed to cancel order",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};

exports.getUserOrders = async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  try {
    const orders = await knex("orders")
      .join("meals", "orders.meal_id", "meals.id")
      .join("accounts", "orders.restaurant_id", "accounts.id")
      .where("orders.user_id", req.user.id)
      .select(
        "orders.id",
        "orders.status",
        "orders.created_at",
        "meals.name as meal_name",
        "meals.price as meal_price",
        "accounts.name as restaurant_name",
        "accounts.phone as restaurant_phone"
      )
      .orderBy("orders.created_at", "desc");

    const formattedOrders = orders.map(order => ({
      id: order.id,
      status: order.status,
      price: order.meal_price,
      created_at: order.created_at,
      meal: {
        name: order.meal_name
      },
      restaurant: {
        name: order.restaurant_name,
        phone: order.restaurant_phone
      }
    }));

    res.json({
      success: true,
      orders: formattedOrders
    });

  } catch (err) {
    console.error("Fetch user orders error:", err);
    res.status(500).json({ message: "Failed to fetch your orders" });
  }
};
