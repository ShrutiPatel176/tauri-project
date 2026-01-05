import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "@/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  User,
  Clock,
  Plus,
  Minus,
  Trash2,
  Pencil,
  X,
  Eye,
} from "lucide-react";

export default function AdminOrders() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [previewOrder, setPreviewOrder] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 4;
  const { toast } = useToast();

  /* ================= ORDERS ================= */
  const orders =
    useLiveQuery(async () => {
      const allOrders = await db.orders.toArray();
      return Promise.all(
        allOrders.map(async (o) => {
          const user = await db.users.get(o.userId);
          return {
            ...o,
            userEmail: user?.email || "Unknown",
            userName: user?.name || user?.username || "N/A",
          };
        })
      );
    }, []) || [];

  const totalPages = Math.ceil(orders.length / pageSize);

  const paginatedOrders = orders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* ================= PLANTS ================= */
  const plants =
    useLiveQuery(() => db.plants.toArray(), []) || [];

  /* ================= ORDER ITEMS ================= */
  const orderItems =
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

  const previewItems =
    useLiveQuery(
      () =>
        previewOrder
          ? db.orderItems
              .where("orderId")
              .equals(previewOrder.id)
              .toArray()
          : [],
      [previewOrder]
    ) || [];

  /* ================= TOTAL ================= */
  const recalcTotal = async () => {
    if (!activeOrder) return;

    const items = await db.orderItems
      .where("orderId")
      .equals(activeOrder.id)
      .toArray();

    const total = items.reduce(
      (sum, i) => sum + i.price * i.qty,
      0
    );

    await db.orders.update(activeOrder.id, { total });
  };

  /* ================= QTY ================= */
  const increaseQty = async (item) => {
    const plant = await db.plants.get(item.productId);
    if (!plant || plant.quantity <= 0) return;

    await db.orderItems.update(item.id, { qty: item.qty + 1 });
    await db.plants.update(item.productId, {
      quantity: Math.max(plant.quantity - 1, 0),
    });
    recalcTotal();
  };

  const decreaseQty = async (item) => {
    const plant = await db.plants.get(item.productId);
    if (item.qty === 1) {
      await db.orderItems.delete(item.id);
      if (plant) {
        await db.plants.update(item.productId, {
          quantity: plant.quantity + 1,
          sellingQuantity: Math.max((plant.sellingQuantity || 0) - 1, 0),
        });
      }
    } else {
      await db.orderItems.update(item.id, { qty: item.qty - 1 });
      if (plant) {
        await db.plants.update(item.productId, {
          quantity: plant.quantity + 1,
          sellingQuantity: Math.max((plant.sellingQuantity || 0) - 1, 0),
        });
      }
    }
    recalcTotal();
  };

  const updatePrice = async (item, price) => {
    await db.orderItems.update(item.id, {
      price: Number(price),
    });
    recalcTotal();
  };

  const addProduct = async (plant) => {
    const freshPlant = await db.plants.get(plant.id);
    if (!freshPlant || freshPlant.quantity <= 0) return;

    const exists = await db.orderItems
      .where({
        orderId: activeOrder.id,
        productId: plant.id,
      })
      .first();

    if (exists) {
      await db.orderItems.update(exists.id, {
        qty: exists.qty + 1,
      });
    } else {
      await db.orderItems.add({
        orderId: activeOrder.id,
        productId: plant.id,
        name: plant.name,
        qty: 1,
        price: plant.price,
      });
    }

    await db.plants.update(plant.id, {
      quantity: Math.max(freshPlant.quantity - 1, 0),
      sellingQuantity: (freshPlant.sellingQuantity || 0) + 1,
    });

    recalcTotal();
    toast({
      title: "Product added",
      description: `${plant.name} added to the order.`,
      variant: "default",
    });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <h1 className="mb-8 flex items-center gap-3 text-4xl font-bold text-green-900">
        <Package className="h-8 w-8" />
        Orders Dashboard
      </h1>

      {/* ================= ORDERS LIST ================= */}
      <div className="space-y-6">
        {paginatedOrders.map((order) => (
          <Card key={order.id} className="rounded-3xl shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">
                  Order #{order.id}
                </p>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  {new Date(order.date).toLocaleString()}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  {order.userEmail}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-xl font-bold text-green-800">
                  ₹{order.total}
                </p>

                {/* PREVIEW */}
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setPreviewOrder(order)}
                >
                  <Eye className="h-4 w-4" />
                </Button>

                {/* EDIT */}
                <Button
                  size="icon"
                  onClick={() => setActiveOrder(order)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "outline"}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* ================= PREVIEW MODAL (PRINT STYLE) ================= */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl">
            {/* HEADER */}
            <div className="mb-6 border-b pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-green-800">
                  🌿 Order Invoice
                </h2>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setPreviewOrder(null)}
                >
                  <X />
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                <p>
                  <strong>Order ID:</strong> #{previewOrder.id}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(previewOrder.date).toLocaleString()}
                </p>
                <p>
                  <strong>User:</strong>{" "}
                  {previewOrder.userName}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {previewOrder.userEmail}
                </p>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 border-b pb-2 text-sm font-semibold text-gray-600">
                <span>Product</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Price</span>
                <span className="text-right">Total</span>
              </div>

              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-4 text-sm"
                >
                  <span>{item.name}</span>
                  <span className="text-center">{item.qty}</span>
                  <span className="text-right">
                    ₹{item.price}
                  </span>
                  <span className="text-right font-semibold">
                    ₹{item.qty * item.price}
                  </span>
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div className="mt-6 flex justify-end border-t pt-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Grand Total
                </p>
                <p className="text-2xl font-bold text-green-800">
                  ₹{previewOrder.total}
                </p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-6 text-center text-xs text-gray-500">
              This is a system generated invoice 🌱
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {activeOrder && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 sm:p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Edit Order #{activeOrder.id}
              </h2>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setActiveOrder(null)}
              >
                <X />
              </Button>
            </div>

            {/* ITEMS */}
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => decreaseQty(item)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-6 text-center">
                        {item.qty}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => increaseQty(item)}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      className="w-24"
                      value={item.price}
                      onChange={(e) =>
                        updatePrice(item, e.target.value)
                      }
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() =>
                        decreaseQty({ ...item, qty: 1 })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* ADD PRODUCT */}
            <div className="mt-6">
              <h3 className="mb-2 font-semibold">
                Add Product
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {plants.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    onClick={() => addProduct(p)}
                  >
                    {p.name} – ₹{p.price}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
