import { db } from "@/db";

export async function createOrder(userId, items, total) {
  await db.orders.add({
    userId,
    items,
    total,
     createdAt: Date.now(), 
  });
}


export async function getOrders(userId) {
  return await db.orders.where("userId").equals(userId).toArray();
}
