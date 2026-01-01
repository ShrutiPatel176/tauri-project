import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CheckoutModal({
  items,
  subtotal,
  discount,
  total,
  onPay,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-md p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

        <div className="space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.name} × {item.qty}</span>
              <span>₹{item.price * item.qty}</span>
            </div>
          ))}
        </div>

        <hr className="my-3" />

        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-₹{discount}</span>
          </div>

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>

          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onPay}
          >
            Pay Now
          </Button>
        </div>
      </Card>
    </div>
  );
}
