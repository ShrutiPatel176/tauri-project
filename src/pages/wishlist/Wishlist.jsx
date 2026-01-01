import Navbar from "@/components/common/Navbar";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { addToCart } from "@/services/cart.service";
import { useToast } from "@/hooks/use-toast";

export default function Wishlist() {
  const user = JSON.parse(localStorage.getItem("user"));
  // const { toast } = useToast();

  /* ---------------- FETCH WISHLIST ---------------- */
  const likes =
    useLiveQuery(
      async () => {
        if (!user) return [];
        return db.likes.where("userId").equals(user.id).toArray();
      },
      [user?.id]
    ) || [];

  /* ---------------- FETCH PLANTS (FOR STOCK) ---------------- */
  const plants =
    useLiveQuery(() => db.plants.toArray(), []) || [];

  /* ---------------- HELPER: GET STOCK ---------------- */
  const getStock = (productId) => {
    const plant = plants.find((p) => p.id === productId);
    return plant?.quantity ?? 0;
  };

  return (
    <div className="relative min-h-screen">
      <Navbar />

      {/* 🌿 BACKGROUND */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-pink-50 via-white to-green-50" />

      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* HEADER */}
        <div className="mb-10 text-center">
          <h1 className="flex items-center justify-center gap-2 text-4xl font-bold text-green-800">
            <Heart className="h-8 w-8 fill-red-500 text-red-500" />
            My Wishlist
          </h1>
          <p className="mt-2 text-gray-500">
            Plants you love & want to grow 🌱
          </p>
        </div>

        {/* EMPTY STATE */}
        {likes.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-pink-100">
              <Heart className="h-10 w-10 text-pink-500" />
            </div>

            <h2 className="text-xl font-semibold">
              Your wishlist is empty
            </h2>
            <p className="mt-2 text-gray-500">
              Like plants you adore & find them here 🌸
            </p>
          </div>
        ) : (
          /* GRID */
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {likes.map((item) => {
              const productId = item.productId ?? item.id;
              const stock = getStock(productId);
              const isOutOfStock = stock <= 0;

              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* IMAGE */}
                  <div className="relative">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="h-48 w-full object-cover"
                    />

                    {/* ❤️ BADGE */}
                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-500 shadow">
                      ❤️ Loved
                    </span>

                    {/* OUT OF STOCK OVERLAY */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-semibold text-white">
                        OUT OF STOCK
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="space-y-3 p-5">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {item.name}
                    </h3>

                    <p className="text-xl font-bold text-green-700">
                      ₹{item.price}
                    </p>

                    {/* ACTIONS */}
                    <div className="flex gap-2 pt-2">
                      

                      <Button
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => db.likes.delete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* HOVER GLOW */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-t from-green-100/20 to-transparent" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
