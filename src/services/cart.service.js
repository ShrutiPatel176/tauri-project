import { db } from "@/db";

/* ===============================
   ADD TO CART (WITH STOCK CHECK)
================================ */
export async function addToCart(userId, product) {
  if (!userId || !product) return;

  const plant = await db.plants.get(product.id);
  if (!plant || plant.quantity <= 0) {
    alert("🚫 Out of stock");
    return;
  }

  const discount = product.onSale ? product.discount : 0;
  const finalPrice = product.onSale
    ? product.price - (product.price * discount) / 100
    : product.price;

  const existing = await db.cart
    .where({ userId, productId: product.id })
    .first();

  if (existing) {
    // 🚫 stock limit
    if (existing.qty >= plant.quantity) {
      alert("🚫 Stock limit reached");
      return;
    }

    await db.cart.update(existing.id, {
      qty: existing.qty + 1,
    });
  } else {
    await db.cart.add({
      userId,
      productId: product.id,
      name: product.name,
      price: Math.round(finalPrice),
      originalPrice: Number(
        product.originalPrice || product.price
      ),
      discount,
      qty: 1,
    });
  }
}

/* ===============================
   INCREASE QUANTITY (STOCK SAFE)
================================ */
export async function increaseQty(cartId, qty) {
  if (!cartId) return;

  const cartItem = await db.cart.get(cartId);
  if (!cartItem) return;

  const plant = await db.plants.get(cartItem.productId);
  if (!plant) return;

  // 🚫 STOP at stock limit
  if (qty >= plant.quantity) {
    alert("🚫 Only limited stock available");
    return;
  }

  await db.cart.update(cartId, {
    qty: qty + 1,
  });
}

/* ===============================
   DECREASE QUANTITY
================================ */
export async function decreaseQty(cartId, qty) {
  if (!cartId) return;

  if (qty <= 1) {
    await db.cart.delete(cartId);
  } else {
    await db.cart.update(cartId, {
      qty: qty - 1,
    });
  }
}

/* ===============================
   CLEAR USER CART
================================ */
export async function clearUserCart(userId) {
  if (!userId) return;

  await db.cart
    .where("userId")
    .equals(userId)
    .delete();
}

export async function removeFromCartByProduct(
  userId,
  productId
) {
  const item = await db.cart
    .where({ userId, productId })
    .first();

  if (item) {
    await db.cart.delete(item.id);
  }
}
