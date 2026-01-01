import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Leaf,
  Package,
  LogOut,
} from "lucide-react";

export default function AdminSidebar() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  const linkBase =
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition";

  const active = "bg-green-600 text-white shadow";
  const inactive =
    "text-gray-600 hover:bg-green-50 hover:text-green-700";

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden w-64 border-r bg-white p-5 sm:block">
        <h2 className="mb-8 text-2xl font-bold text-green-700">
          🌿 Admin Panel
        </h2>

        <nav className="space-y-2">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : inactive}`
            }
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/plants"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : inactive}`
            }
          >
            <Leaf className="h-5 w-5" />
            Manage Plants
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? active : inactive}`
            }
          >
            <Package className="h-5 w-5" />
            Orders
          </NavLink>

          <button
            onClick={logout}
            className="mt-8 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </nav>
      </aside>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t bg-white py-2 shadow sm:hidden">
        <MobileLink to="/admin" end icon={<LayoutDashboard />} />
        <MobileLink to="/admin/plants" icon={<Leaf />} />
        <MobileLink to="/admin/orders" icon={<Package />} />
        <button
          onClick={logout}
          className="flex flex-col items-center text-red-600"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs">Logout</span>
        </button>
      </nav>
    </>
  );
}

/* ================= MOBILE LINK ================= */

function MobileLink({ to, icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center ${
          isActive ? "text-green-600" : "text-gray-500"
        }`
      }
    >
      <div className="h-5 w-5">{icon}</div>
      <span className="text-xs mt-1">
        {to.includes("plants")
          ? "Plants"
          : to.includes("orders")
          ? "Orders"
          : "Home"}
      </span>
    </NavLink>
  );
}
