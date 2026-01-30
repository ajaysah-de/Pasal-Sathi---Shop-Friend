import { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  ShoppingCart,
  Filter,
  ChevronDown,
} from "lucide-react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { formatNPR, formatDate, formatTime } from "../lib/utils";
import { toast } from "sonner";

const API_BASE = process.env.REACT_APP_BACKEND_URL?.replace(/\/$/, "") || "";
const API = `${API_BASE}/api`;

export default function Reports() {
  const { getAuthHeader, token } = useAuth();

  const [activeTab, setActiveTab] = useState("sales");
  const [sales, setSales] = useState([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (activeTab === "sales") {
      fetchSales();
    }
  }, [activeTab, dateFrom, dateTo]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);

      const res = await axios.get(`${API}/sales`, {
        ...getAuthHeader(),
        params: {
          date_from: fromDate.toISOString(),
          date_to: toDate.toISOString(),
        },
      });
      setSales(res.data);
    } catch (err) {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const cashSales = sales
    .filter((s) => s.payment_type === "cash")
    .reduce((sum, s) => sum + s.total, 0);
  const creditSales = sales
    .filter((s) => s.payment_type === "credit")
    .reduce((sum, s) => sum + s.total, 0);

  // Group sales by user
  const salesByUser = sales.reduce((acc, sale) => {
    const userName = sale.user_name || "Unknown";
    if (!acc[userName]) {
      acc[userName] = { count: 0, total: 0, cash: 0, credit: 0 };
    }
    acc[userName].count += 1;
    acc[userName].total += sale.total;
    if (sale.payment_type === "cash") {
      acc[userName].cash += sale.total;
    } else {
      acc[userName].credit += sale.total;
    }
    return acc;
  }, {});

  const handleExport = async (type, format) => {
    setExporting(true);
    try {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);

      let url = "";
      let filename = "";

      if (type === "sales") {
        url = `${API}/reports/sales/${format}?date_from=${fromDate.toISOString()}&date_to=${toDate.toISOString()}`;
        filename = `sales_report_${dateFrom}_${dateTo}.${format === "excel" ? "xlsx" : "pdf"}`;
      } else {
        url = `${API}/reports/inventory/${format}`;
        filename = `inventory_report.${format === "excel" ? "xlsx" : "pdf"}`;
      }

      const res = await axios.get(url, {
        ...getAuthHeader(),
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Report downloaded! / रिपोर्ट डाउनलोड भयो!");
      setShowExportModal(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 animate-fadeIn" data-testid="reports-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Reports / रिपोर्ट</h1>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#8B0000] text-white rounded-xl font-medium"
            data-testid="export-btn"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("sales")}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "sales" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            data-testid="tab-sales"
          >
            <ShoppingCart className="w-4 h-4 inline mr-1" />
            Sales
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "inventory" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            data-testid="tab-inventory"
          >
            <Package className="w-4 h-4 inline mr-1" />
            Inventory
          </button>
        </div>

        {/* Date Filter */}
        {activeTab === "sales" && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">
                From / देखि
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                data-testid="date-from"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">
                To / सम्म
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                data-testid="date-to"
              />
            </div>
          </div>
        )}

        {/* Sales Tab Content */}
        {activeTab === "sales" && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500">Total / जम्मा</p>
                <p className="text-lg font-bold text-[#2D2D2D]">
                  {formatNPR(totalSales)}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-xs text-green-600">Cash / नगद</p>
                <p className="text-lg font-bold text-green-700">
                  {formatNPR(cashSales)}
                </p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <p className="text-xs text-orange-600">Credit / उधारो</p>
                <p className="text-lg font-bold text-orange-700">
                  {formatNPR(creditSales)}
                </p>
              </div>
            </div>

            {/* Sales by User Summary */}
            {Object.keys(salesByUser).length > 1 && (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-sm mb-3 text-gray-700">
                  Sales by User / प्रयोगकर्ता अनुसार बिक्री
                </h3>
                <div className="space-y-2">
                  {Object.entries(salesByUser).map(([userName, data]) => (
                    <div
                      key={userName}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#8B0000] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{userName}</p>
                          <p className="text-xs text-gray-500">
                            {data.count} transactions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#8B0000]">
                          {formatNPR(data.total)}
                        </p>
                        <div className="flex gap-1 text-xs">
                          <span className="text-green-600">
                            Cash: {formatNPR(data.cash)}
                          </span>
                          {data.credit > 0 && (
                            <span className="text-orange-600">
                              Credit: {formatNPR(data.credit)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sales List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="loader"></div>
              </div>
            ) : sales.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  {sales.length} transactions
                </p>
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-white rounded-xl p-3 border border-gray-100"
                    data-testid={`sale-row-${sale.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-[#2D2D2D]">
                          {sale.items
                            .map((i) => `${i.product_name} ×${i.quantity}`)
                            .join(", ")
                            .slice(0, 40)}
                          {sale.items
                            .map((i) => `${i.product_name} ×${i.quantity}`)
                            .join(", ").length > 40
                            ? "..."
                            : ""}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(sale.created_at)} at{" "}
                          {formatTime(sale.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#8B0000]">
                          {formatNPR(sale.total)}
                        </p>
                        <span
                          className={
                            sale.payment_type === "cash"
                              ? "cash-badge"
                              : "credit-badge"
                          }
                        >
                          {sale.payment_type}
                        </span>
                      </div>
                    </div>
                    {sale.customer_name && (
                      <p className="text-xs text-gray-500">
                        Customer: {sale.customer_name}
                      </p>
                    )}
                    {sale.user_name && (
                      <p className="text-xs text-gray-400">
                        Sold by: {sale.user_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No sales in this period</p>
              </div>
            )}
          </>
        )}

        {/* Inventory Tab Content */}
        {activeTab === "inventory" && (
          <div className="space-y-3">
            <div
              className="report-card"
              onClick={() => handleExport("inventory", "excel")}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Package className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h3 className="font-semibold">Full Inventory Report</h3>
                  <p className="text-sm text-gray-500">
                    Download complete stock list
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        <Modal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Export Report"
          titleNp="रिपोर्ट निकाल्नु"
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
              Choose report type and format:
            </p>

            <div className="space-y-2">
              <h4 className="font-medium">Sales Report / बिक्री रिपोर्ट</h4>
              <p className="text-xs text-gray-400">
                {dateFrom} to {dateTo}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExport("sales", "excel")}
                  disabled={exporting}
                  className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium"
                  data-testid="export-sales-excel"
                >
                  📊 Excel
                </button>
                <button
                  onClick={() => handleExport("sales", "pdf")}
                  disabled={exporting}
                  className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium"
                  data-testid="export-sales-pdf"
                >
                  📄 PDF
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-medium">Inventory Report / सामान रिपोर्ट</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExport("inventory", "excel")}
                  disabled={exporting}
                  className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium"
                  data-testid="export-inventory-excel"
                >
                  📊 Excel
                </button>
              </div>
            </div>

            {exporting && (
              <div className="flex items-center justify-center py-4">
                <div className="loader"></div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
