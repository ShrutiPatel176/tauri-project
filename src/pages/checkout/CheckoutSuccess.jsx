import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ShoppingBag, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccess() {
  const navigate = useNavigate();

  // ⏳ Auto redirect
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/products");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4 text-center">
      {/* ✅ ICON */}
      <CheckCircle className="h-20 w-20 sm:h-24 sm:w-24 text-green-600 animate-bounce" />

      {/* ✅ TITLE */}
      <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-green-700">
        Order Placed Successfully 🎉
      </h1>

      {/* ✅ MESSAGE */}
      <p className="mt-2 max-w-md text-sm sm:text-base text-gray-600">
        Thank you for shopping with us 🌱  
        Your plants will reach you soon!
      </p>

      {/* ✅ ACTION BUTTONS */}
      <div className="mt-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => navigate("/orders")}
        >
          <Receipt className="h-4 w-4" />
          View Orders
        </Button>

        <Button
          variant="outline"
          className="flex items-center justify-center gap-2"
          onClick={() => navigate("/products")}
        >
          <ShoppingBag className="h-4 w-4" />
          Continue Shopping
        </Button>
      </div>

      {/* ✅ AUTO REDIRECT INFO */}
      <p className="mt-4 text-xs sm:text-sm text-gray-500">
        Redirecting to products in 5 seconds...
      </p>
    </div>
  );
}
