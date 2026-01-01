import { Link } from "react-router-dom";
import { Heart, ShoppingCart, User, History } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { getLikeCount } from "@/services/like.service";

export default function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  // ❤️ Wishlist count
  const likeCount = useLiveQuery(
    async () => {
      if (!user) return 0;
      return getLikeCount(user.id);
    },
    [user],
    0
  );

  // 🛒 Cart count
  const cartCount = useLiveQuery(
    async () => {
      if (!user) return 0;
      const items = await db.cart
        .where("userId")
        .equals(user.id)
        .toArray();
      return items.reduce((sum, i) => sum + i.qty, 0);
    },
    [user],
    0
  );

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-4 shadow">
      {user?.role === "admin" && (
  <Link to="/admin">
    <Shield className="h-6 w-6" />
  </Link>
)}

      <Link to="/products" className="text-xl font-bold">
        🌿 Plant Store
      </Link>

      <div className="flex items-center gap-6">
        {/* ❤️ Wishlist */}
        <Link to="/wishlist" className="relative">
          <Heart className="h-6 w-6" />
          {likeCount > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 text-xs text-white">
              {likeCount}
            </span>
          )}
        </Link>

        {/* 🛒 Cart */}
        <Link to="/cart" className="relative">
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-green-600 px-2 text-xs text-white">
              {cartCount}
            </span>
          )}
        </Link>

        {/* 📦 Orders */}
        <Link to="/orders">
          <History className="h-6 w-6" />
        </Link>

        {/* 👤 Profile */}
        <Link to="/profile">
          <User className="h-6 w-6" />
        </Link>
      </div>
    </nav>
  );
}
