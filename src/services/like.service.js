import { db } from "@/db";

/* ❤️ Check if product is liked */
export async function isLiked(userId, productId) {
  const like = await db.likes
    .where("[userId+productId]")
    .equals([userId, productId])
    .first();

  return !!like;
}

/* ❤️ Toggle like (SAVE FULL PRODUCT DATA) */
export async function toggleLike(userId, product) {
  const existing = await db.likes
    .where("[userId+productId]")
    .equals([userId, product.id])
    .first();

  if (existing) {
    await db.likes.delete(existing.id);
    return false;
  }

  await db.likes.add({
    userId,
    productId: product.id,
    name: product.name,
    price: product.price,
    img: product.img, // ✅ FIXED (img, NOT image)
  });

  return true;
}

/* ❤️ Get like count */
export async function getLikeCount(userId) {
  return db.likes.where("userId").equals(userId).count();
}
