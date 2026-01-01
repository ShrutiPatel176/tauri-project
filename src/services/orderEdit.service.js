export async function recalcOrderTotal(orderId, db) {
  const items = await db.orderItems
    .where("orderId")
    .equals(orderId)
    .toArray();

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  await db.orders.update(orderId, { total });

  return total;
}
