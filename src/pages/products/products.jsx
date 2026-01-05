import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "@/db";
import Navbar from "@/components/common/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Package,
  CheckCircle,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import { addToCart, removeFromCartByProduct } from "@/services/cart.service";
import { toggleLike } from "@/services/like.service";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const user = JSON.parse(localStorage.getItem("user"));
  const { toast } = useToast();

  const [likedIds, setLikedIds] = useState(new Set());
  const [search, setSearch] = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  /* ---------------- EDIT MODE ---------------- */
  const editOrderId = searchParams.get("editOrderId");
  const isEditMode = Boolean(editOrderId);

  const [editingOrder, setEditingOrder] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editTotal, setEditTotal] = useState(0);

  /* ---------------- GUARD ---------------- */
  if (!user) {
    return <p className="p-6">Please login</p>;
  }

  /* ---------------- PLANTS ---------------- */
  const plants =
    useLiveQuery(() => {
      return db.plants
        .where("country")
        .equals(user.country.toLowerCase())
        .toArray();
    }, [user.country]) || [];

  const filteredPlants = plants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ---------------- LIKES ---------------- */
  useEffect(() => {
    async function loadLikes() {
      const likes = await db.likes
        .where("userId")
        .equals(user.id)
        .toArray();

      setLikedIds(new Set(likes.map((l) => l.productId)));
    }

    loadLikes();
  }, [user.id]);

  /* ---------------- LOAD ORDER (EDIT MODE) ---------------- */
  useEffect(() => {
    
    if (!editOrderId) return;

    async function loadOrder() {
      const order = await db.orders.get(Number(editOrderId));
      if (!order) return;

      setEditingOrder(order);

      const items = await db.orderItems
        .where("orderId")
        .equals(order.id)
        .toArray();

      setEditItems(items);
      setEditTotal(items.reduce((s, i) => s + i.price * i.qty, 0));
    }

    loadOrder();
  }, [editOrderId]);

  /* ---------------- HELPERS ---------------- */
  const handleExitEditMode = () => {
    setEditingOrder(null);
    setEditItems([]);
    setEditTotal(0);
    navigate("/products");
  };

  const handleLike = async (plant) => {
    const isNowLiked = await toggleLike(user.id, plant);
    setLikedIds((prev) => {
      const next = new Set(prev);
      isNowLiked ? next.add(plant.id) : next.delete(plant.id);
      return next;
    });
  };

  /* ---------------- EDIT ORDER ACTIONS ---------------- */
  const handleAddToOrder = async (plant) => {
    if (!editingOrder) return;
  
    const fresh = await db.plants.get(plant.id);
    if (!fresh || fresh.quantity <= 0) {
      toast({ title: "Out of stock", variant: "destructive" });
      return;
    }

    let updated;
    const exists = editItems.find((i) => i.productId === plant.id);

    if (exists) {
      updated = editItems.map((i) =>
        i.productId === plant.id ? { ...i, qty: i.qty + 1 } : i
      );
    } else {
      updated = [
        ...editItems,
        {
          id: Date.now(),
          orderId: editingOrder.id,
          productId: plant.id,
          name: plant.name,
          qty: 1,
          price: plant.price,
        },
      ];
    }

    await db.plants.update(plant.id, { quantity: fresh.quantity - 1 });

    setEditItems(updated);
    setEditTotal(updated.reduce((s, i) => s + i.price * i.qty, 0));
  };

  const handleIncreaseQuantity = async (item) => {
    const plant = await db.plants.get(item.productId);
    if (!plant || plant.quantity <= 0) return;

    const updated = editItems.map((i) =>
      i.id === item.id ? { ...i, qty: i.qty + 1 } : i
    );

    await db.plants.update(item.productId, {
      quantity: plant.quantity - 1,
    });

    setEditItems(updated);
    setEditTotal(updated.reduce((s, i) => s + i.price * i.qty, 0));
  };

  const handleDecreaseQuantity = async (item) => {
    if (item.qty === 1) {
      handleRemoveFromOrder(item);
      return;
    }

    const updated = editItems.map((i) =>
      i.id === item.id ? { ...i, qty: i.qty - 1 } : i
    );

    const plant = await db.plants.get(item.productId);
    if (plant) {
      await db.plants.update(item.productId, {
        quantity: plant.quantity + 1,
      });
    }

    setEditItems(updated);
    setEditTotal(updated.reduce((s, i) => s + i.price * i.qty, 0));
  };

  const handleRemoveFromOrder = async (item) => {
    const updated = editItems.filter((i) => i.id !== item.id);

    const plant = await db.plants.get(item.productId);
    if (plant) {
      await db.plants.update(item.productId, {
        quantity: plant.quantity + item.qty,
      });
    }

    setEditItems(updated);
    setEditTotal(updated.reduce((s, i) => s + i.price * i.qty, 0));
  };

  const handleSaveOrder = async () => {
    if (!editingOrder) return;

    // Get original order items to calculate quantity differences
    const originalItems = await db.orderItems
      .where("orderId")
      .equals(editingOrder.id)
      .toArray();

    // Delete original order items
    await db.orderItems
      .where("orderId")
      .equals(editingOrder.id)
      .delete();

    // Create a map of original quantities by product ID
    const originalQuantities = {};
    originalItems.forEach(item => {
      originalQuantities[item.productId] = item.qty;
    });

    // Add new order items and update selling quantities
    for (const item of editItems) {
      await db.orderItems.add({
        orderId: editingOrder.id,
        productId: item.productId,
        name: item.name,
        qty: item.qty,
        price: item.price,
      });

      // Calculate the difference in quantity
      const originalQty = originalQuantities[item.productId] || 0;
      const qtyDifference = item.qty - originalQty;

      // Update selling quantity if there's an increase
      if (qtyDifference > 0) {
        const plant = await db.plants.get(item.productId);
        if (plant) {
          await db.plants.update(item.productId, {
            sellingQuantity: (plant.sellingQuantity || 0) + qtyDifference,
          });
        }
      }
    }

    await db.orders.update(editingOrder.id, { total: editTotal });

    toast({ title: "Order updated successfully" });
    handleExitEditMode();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* HEADER + SEARCH */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold capitalize text-green-800">
              🌿 Plants in {user.country}
            </h1>
            
            {/* EDIT MODE INDICATOR */}
            {isEditMode && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">
                  Editing Order #{editingOrder?.id}
                </span>
                <div className="flex items-center gap-1 ml-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">{editItems.length} items</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="🔍 Search plants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 rounded-xl border px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            
            {isEditMode && (
              <Button variant="outline" onClick={handleExitEditMode} className="border-red-200 text-red-600 hover:bg-red-50">
                <X className="h-4 w-4 mr-2" />
                Exit Edit
              </Button>
            )}
          </div>
        </div>

        {/* SPLIT SCREEN LAYOUT FOR EDIT MODE */}
        {isEditMode ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* LEFT SIDE - PRODUCTS */}
            <div className="lg:col-span-2">
              {/* EMPTY STATE */}
              {filteredPlants.length === 0 ? (
                <p className="text-gray-500">No plants found 🌱</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredPlants.map((plant) => {
                    const discountedPrice =
                      plant.discount > 0
                        ? Math.round(
                            plant.price - (plant.price * plant.discount) / 100
                          )
                        : plant.price;

                    const outOfStock = plant.quantity === 0;

                    return (
                      <Card
                        key={plant.id}
                        className="relative rounded-2xl bg-white shadow transition hover:-translate-y-1"
                      >
                        <CardContent className="space-y-3 p-4">
                          {/* IMAGE */}
                          <div className="relative">
                            <img
                              src={plant.img}
                              alt={plant.name}
                              className="h-48 w-full rounded-lg object-cover"
                            />

                            {plant.discount > 0 && (
                              <span className="absolute right-2 top-2 rounded-full bg-red-600 px-3 py-1 text-xs text-white">
                                {plant.discount}% OFF
                              </span>
                            )}

                            {outOfStock && (
                              <span className="absolute left-2 top-2 rounded bg-gray-800 px-2 py-1 text-xs text-white">
                                Out of Stock
                              </span>
                            )}
                          </div>

                          {/* TITLE + LIKE */}
                          <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                              {plant.name}
                            </h2>

                            <button onClick={() => handleLike(plant)}>
                              <Heart
                                className={`h-6 w-6 transition ${
                                  likedIds.has(plant.id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-300 hover:text-red-400"
                                }`}
                              />
                            </button>
                          </div>

                          {/* PRICE */}
                          <div>
                            {plant.discount > 0 ? (
                              <div className="flex gap-2">
                                <span className="font-bold text-green-600">
                                  ₹{discountedPrice}
                                </span>
                                <span className="line-through text-gray-400">
                                  ₹{plant.price}
                                </span>
                              </div>
                            ) : (
                              <p className="font-bold">₹{plant.price}</p>
                            )}
                          </div>

                          {/* STOCK */}
                          <p className="text-xs text-gray-500">
                            Available: {plant.quantity}
                          </p>

                          {/* ADD TO ORDER BUTTON */}
                          <Button
                            disabled={outOfStock}
                            className={`w-full ${
                              outOfStock
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                            onClick={() => handleAddToOrder(plant)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {outOfStock ? "Out of Stock" : "Add to Order"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SIDE - EDIT PANEL */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">
                {/* ORDER SUMMARY CARD */}
                <Card className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-blue-800">Order Summary</h3>
                      </div>
                      <Button onClick={handleSaveOrder} className="bg-green-600 hover:bg-green-700 shadow-md">
                        <Save className="h-4 w-4 mr-2" />
                        Save Order
                      </Button>
                    </div>
                    
                    {editItems.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <ShoppingCart className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm mb-2">No items in order</p>
                        <p className="text-xs text-gray-400">Add plants from the left side</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {editItems.map((item) => {
                          const plant = plants.find(p => p.id === item.productId);
                          const availableStock = plant?.quantity || 0;
                          const canIncrease = availableStock > 0;
                          
                          return (
                            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm text-gray-800">{item.name}</h4>
                                  <p className="text-xs text-gray-500">₹{item.price} each</p>
                                </div>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => handleRemoveFromOrder(item)}
                                  className="h-6 w-6 text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              {/* QUANTITY CONTROLS */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => handleDecreaseQuantity(item)}
                                    className="h-7 w-7 rounded-lg border-gray-300 hover:bg-gray-50"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  
                                  <span className="w-8 text-center font-semibold text-sm">{item.qty}</span>
                                  
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => handleIncreaseQuantity(item)}
                                    disabled={!canIncrease}
                                    className={`h-7 w-7 rounded-lg ${
                                      canIncrease 
                                        ? 'border-green-300 hover:bg-green-50' 
                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                    }`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <div className="text-right">
                                  <p className="font-bold text-sm text-green-700">₹{item.price * item.qty}</p>
                                  <div className="flex items-center gap-1">
                                    {canIncrease ? (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <AlertCircle className="h-3 w-3 text-orange-500" />
                                    )}
                                    <span className={`text-xs ${canIncrease ? 'text-green-600' : 'text-orange-600'}`}>
                                      {availableStock} left
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* TOTAL CARD */}
                {editItems.length > 0 && (
                  <Card className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Order Total</p>
                          <p className="text-2xl font-bold text-green-700">₹{editTotal}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{editItems.length} items</p>
                          <p className="text-xs text-green-600 font-medium">Ready to save</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* NORMAL MODE - FULL WIDTH PRODUCTS */
          <>
            {/* EMPTY STATE */}
            {filteredPlants.length === 0 ? (
              <p className="text-gray-500">No plants found 🌱</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPlants.map((plant) => {
                  const discountedPrice =
                    plant.discount > 0
                      ? Math.round(
                          plant.price - (plant.price * plant.discount) / 100
                        )
                      : plant.price;

                  const outOfStock = plant.quantity === 0;

                  return (
                    <Card
                      key={plant.id}
                      className="relative rounded-2xl bg-white shadow transition hover:-translate-y-1"
                    >
                      <CardContent className="space-y-3 p-4">
                        {/* IMAGE */}
                        <div className="relative">
                          <img
                            src={plant.img}
                            alt={plant.name}
                            className="h-48 w-full rounded-lg object-cover"
                          />

                          {plant.discount > 0 && (
                            <span className="absolute right-2 top-2 rounded-full bg-red-600 px-3 py-1 text-xs text-white">
                              {plant.discount}% OFF
                            </span>
                          )}

                          {outOfStock && (
                            <span className="absolute left-2 top-2 rounded bg-gray-800 px-2 py-1 text-xs text-white">
                              Out of Stock
                            </span>
                          )}
                        </div>

                        {/* TITLE + LIKE */}
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">
                            {plant.name}
                          </h2>

                          <button onClick={() => handleLike(plant)}>
                            <Heart
                              className={`h-6 w-6 transition ${
                                likedIds.has(plant.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-gray-300 hover:text-red-400"
                              }`}
                            />
                          </button>
                        </div>

                        {/* PRICE */}
                        <div>
                          {plant.discount > 0 ? (
                            <div className="flex gap-2">
                              <span className="font-bold text-green-600">
                                ₹{discountedPrice}
                              </span>
                              <span className="line-through text-gray-400">
                                ₹{plant.price}
                              </span>
                            </div>
                          ) : (
                            <p className="font-bold">₹{plant.price}</p>
                          )}
                        </div>

                        {/* STOCK */}
                        <p className="text-xs text-gray-500">
                          Available: {plant.quantity}
                        </p>

                        {/* ADD TO CART BUTTON */}
                        <Button
                          disabled={outOfStock}
                          className={`w-full ${
                            outOfStock
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                          onClick={async () => {
                            if (outOfStock) return;

                            await addToCart(user.id, {
                              ...plant,
                              price: discountedPrice,
                              originalPrice: plant.price,
                            });

                            toast({
                              title: "Added to cart 🛒",
                              description: `${plant.name} added successfully`,
                              action: (
                                <button
                                  className="text-red-600 hover:underline"
                                  onClick={async () =>
                                    removeFromCartByProduct(user.id, plant.id)
                                  }
                                >
                                  Undo
                                </button>
                              ),
                            });
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {outOfStock ? "Out of Stock" : "Add to Cart"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


