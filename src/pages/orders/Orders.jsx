import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/db";
import Navbar from "@/components/common/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  PackageCheck,
  Calendar,
  IndianRupee,
  Plus,
  Minus,
  Trash2,
  Pencil,
  X,
} from "lucide-react";

export default function Orders() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [activeOrder, setActiveOrder] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const orders =
    useLiveQuery(() => {
      if (!user) return [];
      return db.orders
        .where("userId")
        .equals(user.id)
        .reverse()
        .toArray();
    }, [user?.id]) || [];



  /* ================= HANDLE EDIT ORDER ================= */
  const handleEditOrder = (order) => {
    // Store order data in localStorage for Products page to use
    localStorage.setItem('editingOrder', JSON.stringify(order));
    // Navigate to Products page with edit mode
    navigate(`/products?editOrderId=${order.id}`);

  };
  /* ================= RECALCULATE TOTAL ================= */
  const recalcTotal = async (orderId) => {
    if (!orderId) return;
    const items = await db.orderItems
      .where("orderId")
      .equals(orderId)
      .toArray();

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    await db.orders.update(orderId, { total });
  };

  const plants = useLiveQuery(() => db.plants.toArray(), []) || [];

  const editItems =
    useLiveQuery(
      () =>
        activeOrder
          ? db.orderItems
              .where("orderId")
              .equals(activeOrder.id)
              .toArray()
          : [],
      [activeOrder]
    ) || [];


  // compute edit-mode total live from items
  const editTotal = editItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const addProduct = async (plant) => {
    const orderId = activeOrder?.id;
    if (!orderId) return;
    const freshPlant = await db.plants.get(plant.id);
    if (!freshPlant || freshPlant.quantity <= 0) {
      toast({
        title: "Out of stock",
        description: `${plant.name} is out of stock.`,
        variant: "destructive",
      });
      return;
    }

    const exists = await db.orderItems
      .where({ orderId, productId: plant.id })
      .first();

    if (exists) {
      await db.orderItems.update(exists.id, {
        qty: exists.qty + 1,
      });
    } else {
      await db.orderItems.add({
        orderId,
        productId: plant.id,
        name: plant.name,
        qty: 1,
        price: plant.price,
      });
    }

    await db.plants.update(plant.id, {
      quantity: Math.max(freshPlant.quantity - 1, 0),
    });

    recalcTotal(orderId);
    toast({
      title: "Product added",
      description: `${plant.name} added to the order.`,
      variant: "default",
    });
  };

  /* ================= QTY HANDLERS ================= */
  const increaseQty = async (item) => {
    const plant = await db.plants.get(item.productId);
    if (!plant) {
      toast({
        title: "Product not found",
        description: `${item.name} not found`,
        variant: "destructive",
      });
      return;
    }
    if (plant.quantity <= 0) {
      toast({
        title: "Out of stock",
        description: `${item.name} has no stock left`,
        variant: "destructive",
      });
      return;
    }

    // await db.orderItems.update(item.id, { qty: item.qty + 1 });
    await db.orderItems.update(item.id,{qty:item.qty+1});
    await db.plants.update(item.productId, { quantity: Math.max(plant.quantity - 1, 0) });
    recalcTotal(activeOrder?.id || item.orderId);

    toast({
      title: "Quantity increased",
      description: `${item.name} quantity increased.`,
      variant: "default",
    });
  };

  const decreaseQty = async (item) => {
    const plant = await db.plants.get(item.productId);

    if (item.qty === 1) {
      await db.orderItems.delete(item.id);
      if (plant)
        await db.plants.update(item.productId, {
          quantity: plant.quantity + 1,
        });
    } else {
      await db.orderItems.update(item.id, { qty: item.qty - 1 });
      if (plant)
        await db.plants.update(item.productId, {
          quantity: plant.quantity + 1,
        });
    }

    recalcTotal(activeOrder?.id || item.orderId);
    toast({
      title: "Quantity decreased",
      description: `${item.name} quantity decreased.`,
      variant: "default",
    });
  };

  return (
    <div className="relative min-h-screen">
      <Navbar />

      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-50 via-white to-emerald-50" />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-2 text-4xl text-center font-bold text-green-800">
          📦 My Orders
        </h1>
        <p className="mt-2 mh-2 mb-10 text-center text-gray-500">
            Thank you for our plants 🌱
          </p>

        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow">
            <p className="text-xl font-semibold">🪴 No orders yet</p>
            <p className="mt-2 text-gray-500">
              Start shopping & grow happiness 🌱
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              return (
                <Card
                  key={order.id}
                  className="rounded-3xl bg-white/80 backdrop-blur shadow transition hover:shadow-xl"
                >
                  <CardContent className="p-6">
                    {/* HEADER */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm text-gray-500">
                          <PackageCheck className="h-4 w-4 text-green-600" />
                          Order #{order.id}
                        </p>

                        <p className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.date).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                          ✅ Paid
                        </span>

                        <div className="flex items-center text-xl font-bold text-green-700">
                          <IndianRupee className="h-5 w-5" />
                          {order.total}
                        </div>

                        <Button size="icon" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditOrder(order); }}>
                          <Pencil className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>


                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* EDIT MODAL */}
        {activeOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Edit Order #{activeOrder.id}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    <Calendar className="inline h-4 w-4 mr-1" />{" "}
                    {new Date(activeOrder.date).toLocaleString()}
                  </p>
                </div>

                <Button size="icon" variant="ghost" onClick={() => setActiveOrder(null)}>
                  <X />
                </Button>
              </div>

              {/* ITEMS */}
              <div className="space-y-4">
                {editItems.map((item) => {
                  const plant = plants.find((p) => p.id === item.productId) || {};
                  const outOfStock = (plant.quantity ?? 0) <= 0;

                  return (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border p-4">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-gray-500">Price: ₹{item.price}</p>

                        <div className="mt-2 flex items-center gap-2">
                          <Button size="icon" variant="outline" onClick={() => decreaseQty(item)}>
                            <Minus />
                          </Button>

                          <span className="w-8 text-center font-medium">{item.qty}</span>

                          <Button size="icon" variant="outline" onClick={() => increaseQty(item)} disabled={outOfStock}>
                            <Plus />
                          </Button>

                          <span className="ml-3 text-xs text-gray-400">Available: {plant.quantity ?? 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold">₹{item.price * item.qty}</p>
                          <p className="text-xs text-gray-400">₹{item.price} × {item.qty}</p>
                        </div>

                        <Button size="icon" variant="destructive" onClick={() => decreaseQty({ ...item, qty: 1 })}>
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* SUMMARY */}
                <div className="mt-4 flex justify-end border-t pt-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-2xl font-bold text-green-800">₹{editTotal}</p>
                  </div>
                </div>
              </div>

              {/* ADD PRODUCT */}
              <div className="mt-6">
                <h3 className="mb-2 font-semibold">Add Product</h3>

                <div className="grid grid-cols-2 gap-3">
                  {plants.map((p) => (
                    <Button key={p.id} variant="outline" onClick={() => addProduct(p)} disabled={(p.quantity ?? 0) <= 0}>
                      {p.name} – ₹{p.price}
                      {(p.quantity ?? 0) <= 0 && (
                        <span className="ml-2 text-xs text-red-500">Out of stock</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
