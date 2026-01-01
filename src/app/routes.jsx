import { HashRouter, Routes, Route } from "react-router-dom";

import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Products from "@/pages/products/Products";
import Cart from "@/pages/cart/Cart";
import Profile from "@/pages/profile/Profile";
import Wishlist from "@/pages/wishlist/Wishlist";
import Orders from "@/pages/orders/Orders";
import CheckoutSuccess from "@/pages/checkout/CheckoutSuccess";

import ProtectedRoute from "@/components/common/ProtectedRoute";
import AdminRoute from "@/components/common/AdminRoute";

/* 🔐 ADMIN */
import AdminLayout from "@/pages/admin/layout/AdminLayout";
import AdminDashboard from "@/pages/admin/layout/AdminDashboard";
import AdminPlants from "@/pages/admin/layout/AdminPlants";
import AdminOrders from "@/pages/admin/layout/AdminOrders";

export default function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        {/* ---------- AUTH ---------- */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ---------- USER ---------- */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout-success"
          element={
            <ProtectedRoute>
              <CheckoutSuccess />
            </ProtectedRoute>
          }
        />

        {/* ---------- ADMIN (NESTED) ---------- */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {/* DEFAULT ADMIN PAGE */}
          <Route index element={<AdminDashboard />} />

          <Route path="plants" element={<AdminPlants />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>

        {/* ---------- FALLBACK ---------- */}
        <Route path="*" element={<Login />} />
      </Routes>
    </HashRouter>
  );
}
