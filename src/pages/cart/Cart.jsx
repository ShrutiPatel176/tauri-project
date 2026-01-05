import { useNavigate } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import { Button } from "@/components/ui/button";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import {
  increaseQty,
  decreaseQty,
  clearUserCart,
} from "@/services/cart.service";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";

export default function Cart() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-lg">
        Please login to view cart 🪴
      </div>
    );
  }

  /* ---------------- FETCH CART ITEMS ---------------- */
  const items =
    useLiveQuery(
      () => db.cart.where("userId").equals(userId).toArray(),
      [userId]
    ) || [];

  /* ---------------- FETCH PLANTS (FOR STOCK) ---------------- */
  const plants =
    useLiveQuery(() => db.plants.toArray(), []) || [];

  /* ---------------- TOTALS ---------------- */
  const totalMRP = items.reduce((sum, item) => {
    const original = item.originalPrice ?? item.price;
    return sum + original * item.qty;
  }, 0);

  const totalPayable = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const totalSaved = totalMRP - totalPayable;

  /* ---------------- CHECKOUT ---------------- */
  const handleCheckout = async () => {
    const cartItems = await db.cart
      .where("userId")
      .equals(userId)
      .toArray();

    if (cartItems.length === 0) return;

    const total = cartItems.reduce(
      (sum, i) => sum + i.price * i.qty,
      0
    );

    const orderId = await db.orders.add({
      userId,
      total,
      date: Date.now(),
    });

    for (const item of cartItems) {
      const plant = await db.plants.get(item.productId);
      if (!plant) continue;

      // Calculate original quantity (for existing plants that might not have it set)
      const originalQuantity = plant.originalQuantity || (plant.quantity + (plant.sellingQuantity || 0));
      
      await db.plants.update(item.productId, {
        quantity: Math.max(plant.quantity - item.qty, 0),
        sellingQuantity: (plant.sellingQuantity || 0) + item.qty,
        originalQuantity: originalQuantity,
      });

      await db.orderItems.add({
        orderId,
        productId: item.productId,
        name: item.name,
        qty: item.qty,
        price: item.price,
      });
    }

    await db.cart.where("userId").equals(userId).delete();
    navigate("/checkout-success");
  };

  return (
    <div className="relative min-h-screen">
      <Navbar />

      {/* 🌿 BACKGROUND */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-50 via-white to-emerald-50" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        {/* HEADER */}
        <div className="flex flex-col items-center gap-2 sm:gap-6">
          <h1 className="flex items-center gap-3 text-2xl sm:text-4xl font-bold text-green-800">
            <ShoppingCart className="h-7 w-7 sm:h-9 sm:w-9" />
            My Cart
          </h1>

          <p className="text-center text-gray-500 mb-4">
            Plants you love & want to grow 🌱
          </p>
        </div>

        <div className="mb-6 flex justify-end">
          {items.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => clearUserCart(userId)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Clear Cart
            </Button>
          )}
        </div>

        {/* EMPTY CART */}
        {items.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl bg-white p-8 sm:p-10 text-center shadow-lg">
            <ShoppingCart className="mx-auto mb-4 h-14 w-14 text-green-600" />
            <h2 className="text-xl font-semibold">
              Your cart is empty
            </h2>
            <p className="mt-2 text-gray-500">
              Add plants & grow your space 🌱
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* CART ITEMS */}
            <div className="space-y-4 sm:space-y-6 lg:col-span-2">
              {items.map((item) => {
                const original =
                  item.originalPrice ?? item.price;

                const plant = plants.find(
                  (p) => p.id === item.productId
                );

                const stockLimitReached =
                  plant && item.qty >= plant.quantity;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white/80 p-4 sm:p-5 shadow-md backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* LEFT */}
                    <div>
                      <h2 className="text-lg font-semibold">
                        {item.name}
                      </h2>

                      {original !== item.price ? (
                        <div className="text-sm">
                          <span className="font-bold text-green-600">
                            ₹{item.price}
                          </span>
                          <span className="ml-2 text-gray-400 line-through">
                            ₹{original}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          ₹{item.price}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-gray-500">
                        Available: {plant?.quantity ?? 0}
                      </p>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          decreaseQty(item.id, item.qty)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <span className="w-6 text-center font-semibold">
                        {item.qty}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        disabled={stockLimitReached}
                        onClick={() =>
                          increaseQty(item.id, item.qty)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BILL SUMMARY */}
            <div className="h-fit rounded-3xl bg-white p-6 shadow-lg lg:sticky lg:top-24">
              <h2 className="mb-4 text-xl font-semibold">
                🧾 Bill Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Total MRP</span>
                  <span>₹{totalMRP}</span>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>You Saved</span>
                  <span>-₹{totalSaved}</span>
                </div>

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>Payable</span>
                  <span>₹{totalPayable}</span>
                </div>
              </div>

              <Button
                className="mt-6 w-full bg-green-600 hover:bg-green-700"
                onClick={handleCheckout}
              >
                Pay & Place Order 🌿
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
