import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  IndianRupee,
  ShoppingBag,
  Leaf,
} from "lucide-react";

/* ===============================
   ADMIN DASHBOARD (MOBILE UI)
================================ */
export default function AdminDashboard() {
  /* ---------------- DATA ---------------- */
  const orders = useLiveQuery(() => db.orders.toArray(), []) || [];
  const orderItems =
    useLiveQuery(() => db.orderItems.toArray(), []) || [];

  /* ---------------- KPIs ---------------- */
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const totalPlantsSold = orderItems.reduce(
    (sum, i) => sum + i.qty,
    0
  );

  /* ---------------- SALES BY DATE ---------------- */
  const salesByDate = Object.values(
    orders.reduce((acc, o) => {
      const date = new Date(o.date).toLocaleDateString();
      acc[date] = acc[date] || { date, revenue: 0 };
      acc[date].revenue += o.total;
      return acc;
    }, {})
  );

  /* ---------------- TOP SELLING PLANTS ---------------- */
  const topPlants = Object.values(
    orderItems.reduce((acc, item) => {
      acc[item.name] = acc[item.name] || {
        name: item.name,
        qty: 0,
      };
      acc[item.name].qty += item.qty;
      return acc;
    }, {})
  )
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-6 px-3 pb-6 sm:px-6">
      {/* ================= HEADER ================= */}
      <div className="rounded-2xl bg-green-500 p-5 text-white shadow-md sm:p-8">
        <h1 className="text-2xl font-bold sm:text-4xl">
          🌿 Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-green-100 sm:text-base">
          Sales, revenue & plant performance
        </p>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Revenue"
          value={`₹${totalRevenue}`}
          icon={<IndianRupee className="h-6 w-6" />}
        />

        <StatCard
          title="Orders"
          value={totalOrders}
          icon={<ShoppingBag className="h-6 w-6" />}
        />

        <StatCard
          title="Plants Sold"
          value={totalPlantsSold}
          icon={<Leaf className="h-6 w-6" />}
        />
      </div>

      {/* ================= REVENUE AREA CHART ================= */}
      <ChartCard title="📈 Revenue">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={salesByDate}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#16a34a"
              fill="url(#rev)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ================= TOP PLANTS ================= */}
      <ChartCard title="🌱 Top Plants">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topPlants}>
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="qty"
              fill="#22c55e"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ================= ORDER TREND ================= */}
      <ChartCard title="🧾 Order Trend">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={salesByDate}>
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#15803d"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

/* ===============================
   MOBILE FRIENDLY COMPONENTS
================================ */

function StatCard({ title, value, icon }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
        {icon}
      </div>

      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <h2 className="text-xl font-bold text-green-800">
          {value}
        </h2>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        {title}
      </h2>
      {children}
    </div>
  );
}
