import Dexie from "dexie";

export const db = new Dexie("ecommerceDB");

db.version(7).stores({
  users: "++id, email, username, password, country, role",
  cart: "++id, userId, productId, name, price, qty, [userId+productId]",
  likes: "++id, userId, productId, [userId+productId]",
  orders: "++id, userId, date, total",

  // ✅ NEW ADMIN TABLE
  plants: "++id, name, price, country, discount, img,quantity,createdByAdminId",
  orderItems:
  "++id, orderId, productId, name, qty, price, [orderId+productId]"
});