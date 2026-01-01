import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "@/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Leaf,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const LOW_STOCK_LIMIT = 5;

export default function AdminPlants() {
  // const plants =
  //   useLiveQuery(() => db.plants.toArray(), []) || [];
  const admin = JSON.parse(localStorage.getItem("user"));
    if (!admin || admin.role !== "admin") {
    return <p className="p-6">Access denied</p>;
  }
  const plants =useLiveQuery(() => {
  return db.plants
    .filter(
      p =>
        p.createdByAdminId === admin.id ||
        !p.createdByAdminId
    )
    .toArray();
}, [admin.id]) || [];


  const [form, setForm] = useState({
    name: "",
    price: "",
    country: "",
    discount: "",
    img: "",
    quantity: "",
  });

  const [editingId, setEditingId] = useState(null);

  /* ================= IMAGE UPLOAD ================= */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, img: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  /* ================= SAVE ================= */
  const savePlant = async () => {
    if (!form.name || !form.price || !form.country) {
      alert("Name, price & country are required");
      return;
    }

    const payload = {
      name: form.name,
      price: Number(form.price),
      country: form.country.toLowerCase(),
      discount: Number(form.discount || 0),
      img: form.img || "/img/default.jpg",
      quantity: Number(form.quantity || 0),
    };

    if (editingId) {
      await db.plants.update(editingId, payload);
      setEditingId(null);
    } else {
      await db.plants.add({
  ...payload,
  createdByAdminId: admin.id,
});

    }

    setForm({
      name: "",
      price: "",
      country: "",
      discount: "",
      img: "",
      quantity: "",
    });
  };

  /* ================= EDIT ================= */
  const editPlant = (plant) => {
    setEditingId(plant.id);
    setForm({
      name: plant.name,
      price: plant.price,
      country: plant.country,
      discount: plant.discount,
      img: plant.img,
      quantity: plant.quantity,
    });
  };

  /* ================= DELETE ================= */
  const deletePlant = async (id) => {
    if (confirm("Delete this plant?")) {
      await db.plants.delete(id);
    }
  };

  const hasLowStock = plants.some(
    (p) => p.quantity <= LOW_STOCK_LIMIT
  );

  return (
    <div className="min-h-screen bg-green-50 p-6">
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-4xl font-bold text-green-900">
          <Leaf className="h-8 w-8" />
          Manage Plants
        </h1>
      </div>

      {/* LOW STOCK ALERT */}
      {hasLowStock && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          Some plants are low on stock. Please restock!
        </div>
      )}

      {/* ADD / EDIT FORM */}
      <Card className="mb-10 rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            {editingId ? (
              <>
                <Pencil className="h-5 w-5" /> Edit Plant
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" /> Add New Plant
              </>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Plant Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <Input
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value })
            }
          />

          <Input
            placeholder="Country (india, usa...)"
            value={form.country}
            onChange={(e) =>
              setForm({ ...form, country: e.target.value })
            }
          />

          <Input
            placeholder="Discount (%)"
            type="number"
            value={form.discount}
            onChange={(e) =>
              setForm({ ...form, discount: e.target.value })
            }
          />

          <Input
            placeholder="Quantity"
            type="number"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: e.target.value })
            }
          />

          {/* IMAGE UPLOAD */}
          <div className="space-y-2 md:col-span-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />

            {form.img && (
              <img
                src={form.img}
                alt="Preview"
                className="h-40 w-full rounded-xl object-cover border"
              />
            )}
          </div>

          <Button
            onClick={savePlant}
            className="md:col-span-2 bg-green-600 hover:bg-green-700"
          >
            {editingId ? "Update Plant" : "Add Plant"}
          </Button>
        </CardContent>
      </Card>

      {/* PLANTS GRID */}
      <div className="grid gap-6 md:grid-cols-3">
        {plants.map((p) => {
          const isOut = p.quantity === 0;
          const isLow = p.quantity <= LOW_STOCK_LIMIT && !isOut;

          return (
            <Card
              key={p.id}
              className="rounded-3xl shadow-md hover:shadow-xl transition"
            >
              <CardContent className="space-y-3 p-4">
                <img
                  src={p.img}
                  alt={p.name}
                  className="h-44 w-full rounded-xl object-cover"
                />

                <h2 className="text-lg font-semibold">
                  {p.name}
                </h2>

                <p className="text-green-700 font-bold">
                  ₹{p.price}
                </p>

                <p className="text-sm text-gray-500">
                  {p.country}
                </p>

                <p className="text-sm">
                  Quantity:{" "}
                  <span className="font-semibold">
                    {p.quantity}
                  </span>
                </p>

                {/* STATUS BADGE */}
                {isOut ? (
                  <span className="inline-block rounded-full bg-gray-700 px-3 py-1 text-xs text-white">
                    Out of Stock
                  </span>
                ) : isLow ? (
                  <span className="inline-block rounded-full bg-red-600 px-3 py-1 text-xs text-white">
                    Low Stock
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-green-600 px-3 py-1 text-xs text-white">
                    In Stock
                  </span>
                )}

                <div className="flex gap-2 pt-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => editPlant(p)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => deletePlant(p.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
