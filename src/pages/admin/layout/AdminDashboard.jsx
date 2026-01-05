import * as XLSX from "xlsx";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { getPlantById } from "@/services/plant.service";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, Package } from "lucide-react";

export default function AdminDashboard() {
  // const [orderTable, setOrderTable] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [plantStats, setPlantStats] = useState([]);
  
  const orderItems = useLiveQuery(() => db.orderItems.toArray(), []) || [];
  const orders = useLiveQuery(() => db.orders.toArray(), []) || [];

  useEffect(() => {
    async function buildPlantStats() {
    const plantMap = new Map();

    
      for (const item of orderItems) {
        // const order = orders.find((o) => o.id === item.orderId);
        // if (!order) continue;
        const order=await orders.find(((o)=>o.id===item.orderId));
        if(!order) continue;
        if (startDate || endDate) {
          const orderDate = new Date(order.date);
          const start = startDate ? new Date(startDate) : null;
          const end=endDate? new Date(endDate):null;
          if (end) {
            end.setHours(23, 59, 59, 999);
          }
          
          if (start && orderDate < start) continue;
          if (end && orderDate > end) continue;
        }

        const plant = await getPlantById(item.productId);
        if (!plant) continue;
        

        const existing = plantMap.get(item.productId) || {
          productId: item.productId,
          plantName: plant.name,
          country: plant.country,
          originalQuantity: plant.originalQuantity || 0,
          currentQuantity: plant.quantity,
          soldQuantity: plant.sellingQuantity || 0,
          price: plant.price,
          discount: plant.discount,
          totalSold: 0,
          totalRevenue: 0,
          orders: [],
        };

        existing.totalSold += item.qty;
        existing.totalRevenue += item.price * item.qty;
        existing.orders.push({
          orderId: order.id,
          date: order.date,
          userId: order.userId,
          quantity: item.qty,
          price: item.price,
        });

        plantMap.set(item.productId, existing);
      }

    
      const stats = Array.from(plantMap.values()).map((plant) => {
        const originalPrice = plant.price;
        const discountedPrice = originalPrice * (1 - plant.discount / 100);
        const actualRevenue = plant.totalRevenue;
        const potentialRevenue = plant.totalSold * originalPrice;
        const discountLoss = potentialRevenue - actualRevenue;

        
        const costPerPlant = originalPrice * 0.7;
        const totalCost = plant.totalSold * costPerPlant;
        
        return {
          ...plant,
          actualRevenue,
          potentialRevenue,
          discountLoss,
          totalCost,
        };
      });

      
      stats.sort((a, b) => b.actualRevenue - a.actualRevenue);
      setPlantStats(stats);
    }

    buildPlantStats();
  }, [orderItems, orders, startDate, endDate]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const getDateRangeText = () => {
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    } else if (startDate) {
      return `From ${new Date(startDate).toLocaleDateString()}`;
    } else if (endDate) {
      return `Until ${new Date(endDate).toLocaleDateString()}`;
    }
    return "";
  };

const exportToExcel = () => {
  console.log("Export clicked"); 
  if (!plantStats.length) {
    alert("No data to export");
    return;
  }

  const excelData = plantStats.map((row) => ({
    "Product Id": row.productId || "-",
    "Country": row.country || "-",
    "Plant Name": row.plantName || "-",
    "Add Qty": row.originalQuantity || "-",
    "Current Stock": row.currentQuantity || "-",
    "Sold qty": row.soldQuantity   || "-",
    "Price": row.price || "-",
    "Discount": row.discount || "              0",
    "Revenue": row.actualRevenue || "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders Report");

  XLSX.writeFile(workbook, "orders-report.xlsx");

  alert("✅ Excel file generated successfully!");
};



  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Calendar className="h-5 w-5 text-green-600" />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">From:</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">To:</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="mb-4 flex justify-end">
  <button
    onClick={exportToExcel}
    className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700"
  >
    Export to Excel
  </button>
</div>

            {(startDate || endDate) && (
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plant Sales Statistics */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="h-6 w-6 text-green-600" />
            Plant Sales Analysis
            {(startDate || endDate) && (
              <span className="text-sm text-gray-500">
                (Filtered: {getDateRangeText()})
              </span>
            )}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-green-100">
                <tr>
                  <th className="border p-2 text-left">Product ID</th>
                  <th className="border p-2 text-left">Plant Name</th>
                  <th className="border p-2 text-left">Country</th>
                  <th className="border p-2 text-center">Added Qty</th>
                  <th className="border p-2 text-center">Current Stock</th>
                  <th className="border p-2 text-center">Sold Qty</th>
                  <th className="border p-2 text-right">Price</th>
                  <th className="border p-2 text-right">Discount</th>
                  <th className="border p-2 text-right">Revenue</th>
                  {/* <th className="border p-2 text-right">Cost</th> */}
                  {/* <th className="border p-2 text-right">Profit/Loss</th>
                  <th className="border p-2 text-right">Margin %</th> */}
                </tr>
              </thead>
              <tbody>
                {plantStats.map((plant) => (
                  <tr key={plant.productId} className="hover:bg-gray-50">
                    <td className="border p-2 font-mono text-xs">{plant.productId}</td>
                    <td className="border p-2 font-medium">{plant.plantName}</td>
                    <td className="border p-2 capitalize">{plant.country}</td>
                    <td className="border p-2 text-center">{plant.originalQuantity}</td>
                    <td className="border p-2 text-center">{plant.currentQuantity}</td>
                    <td className="border p-2 text-center font-semibold text-orange-600">
                      {plant.soldQuantity}
                    </td>
                    <td className="border p-2 text-right">₹{plant.price}</td>
                    <td className="border p-2 text-center">{plant.discount}%</td>
                    <td className="border p-2 text-right font-semibold">₹{plant.actualRevenue.toFixed(2)}</td>
                    {/* <td className="border p-2 text-right">₹{plant.totalCost.toFixed(2)}</td> */}
                    {/* <td className={`border p-2 text-right font-semibold ${plant.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {plant.profit >= 0 ? '+' : ''}₹{plant.profit.toFixed(2)}
                      {plant.profit >= 0 ? (
                        <TrendingUp className="inline h-3 w-3 ml-1" />
                      ) : (
                        <TrendingDown className="inline h-3 w-3 ml-1" />
                      )}
                    </td> */}
                    {/* <td className={`border p-2 text-right ${plant.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {plant.profitMargin}%
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>

            {plantStats.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {(startDate || endDate) ? 'No sales found for selected date range' : 'No sales data available'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Plants Summary */}
      {plantStats.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Top Selling Plants</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plantStats.slice(0, 3).map((plant, index) => (
                <div key={plant.productId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-green-600">#{index + 1}</span>
                    {/* <span className={`px-2 py-1 rounded text-xs font-semibold ${plant.profit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {plant.profit >= 0 ? 'Profit' : 'Loss'}
                    </span> */}
                  </div>
                  <h4 className="font-semibold">{plant.plantName}</h4>
                  <p className="text-sm text-gray-600">Sold: {plant.soldQuantity} units</p>
                  <p className="text-sm font-semibold">Revenue: ₹{plant.actualRevenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
