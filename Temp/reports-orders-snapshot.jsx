import { useMemo, useState } from "react";
import { Download, ShoppingCart, Truck, CheckCircle2, XCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DateRangeControls from "@/components/admin/DateRangeControls";
import { exportCSV, formatDateTime, formatKes, inDateRange } from "@/pages/dashboard/admin/reports-snapshot-utils";

const toStatusKey = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const statusLabel = (value) => {
  const key = toStatusKey(value);
  if (key === "PLACED") return "Placed";
  if (key === "PROCESSING") return "Processing";
  if (key === "COMPLETE") return "Complete";
  if (key === "CANCELLED") return "Cancelled";
  return key || "N/A";
};

export default function OrdersSnapshotSection({ cartOrders = [], dateRange, setDateRange }) {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const rows = useMemo(() => {
    const raw = Array.isArray(cartOrders) ? cartOrders : [];
    return raw
      .map((order) => {
        const createdAt = order?.createdAt || order?.created_at || null;
        const updatedAt = order?.updatedAt || order?.updated_at || createdAt;
        const statusKey = toStatusKey(order?.status);
        const total = Number(order?.total ?? order?.totalAmount ?? 0);
        const subtotal = Number(order?.subtotal ?? order?.subTotal ?? 0);
        const deliveryFee = Number(order?.deliveryFee ?? order?.delivery_fee ?? 0);

        const customerEmail =
          order?.customerEmail ||
          order?.customer?.email ||
          order?.contactInfo?.email ||
          order?.contact_info?.email ||
          "";

        const customerName =
          order?.customerName ||
          order?.customer?.username ||
          order?.contactInfo?.name ||
          order?.contact_info?.name ||
          "";

        const deliveryAddress =
          order?.deliveryAddress ||
          order?.delivery_address ||
          order?.deliveryAddressText ||
          order?.details?.location ||
          "";

        const items = Array.isArray(order?.items) ? order.items : [];

        return {
          id: order?.id,
          orderNumber: order?.orderNumber || order?.order_number || order?.orderId || "",
          statusKey,
          status: statusLabel(statusKey),
          itemsCount: items.length,
          subtotal,
          deliveryFee,
          total,
          customerName: customerName || customerEmail || "N/A",
          customerEmail: customerEmail || "N/A",
          deliveryAddress: deliveryAddress || "N/A",
          createdAt,
          updatedAt,
          _raw: order,
        };
      })
      .filter((row) => inDateRange(row.createdAt || row.updatedAt, dateRange.start, dateRange.end));
  }, [cartOrders, dateRange.end, dateRange.start]);

  const totals = useMemo(() => {
    const base = { total: rows.length, placed: 0, processing: 0, complete: 0, cancelled: 0 };
    rows.forEach((row) => {
      if (row.statusKey === "PLACED") base.placed += 1;
      else if (row.statusKey === "PROCESSING") base.processing += 1;
      else if (row.statusKey === "COMPLETE") base.complete += 1;
      else if (row.statusKey === "CANCELLED") base.cancelled += 1;
    });
    return base;
  }, [rows]);

  const amountTotals = useMemo(() => {
    const safeTotal = (value) => (Number.isFinite(value) && value > 0 ? value : 0);
    return rows.reduce(
      (acc, row) => {
        acc.subtotal += safeTotal(row.subtotal);
        acc.deliveryFee += safeTotal(row.deliveryFee);
        acc.total += safeTotal(row.total);
        return acc;
      },
      { subtotal: 0, deliveryFee: 0, total: 0 }
    );
  }, [rows]);

  const cards = [
    { key: "ORDERS_TOTAL", title: "Total Orders", value: totals.total, icon: ShoppingCart },
    { key: "ORDERS_PLACED", title: "Placed", value: totals.placed, icon: FileText },
    { key: "ORDERS_PROCESSING", title: "Processing", value: totals.processing, icon: Truck },
    { key: "ORDERS_COMPLETE", title: "Complete", value: totals.complete, icon: CheckCircle2 },
    { key: "ORDERS_CANCELLED", title: "Cancelled", value: totals.cancelled, icon: XCircle },
  ];

  const filteredRows = useMemo(() => {
    let filtered = rows;

    if (activeCard === "ORDERS_PLACED") filtered = filtered.filter((row) => row.statusKey === "PLACED");
    else if (activeCard === "ORDERS_PROCESSING") filtered = filtered.filter((row) => row.statusKey === "PROCESSING");
    else if (activeCard === "ORDERS_COMPLETE") filtered = filtered.filter((row) => row.statusKey === "COMPLETE");
    else if (activeCard === "ORDERS_CANCELLED") filtered = filtered.filter((row) => row.statusKey === "CANCELLED");

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((row) => row.statusKey === statusFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((row) => {
        return (
          String(row.orderNumber || row.id || "").toLowerCase().includes(q) ||
          String(row.customerName || "").toLowerCase().includes(q) ||
          String(row.customerEmail || "").toLowerCase().includes(q) ||
          String(row.deliveryAddress || "").toLowerCase().includes(q) ||
          String(row.status || "").toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  }, [activeCard, rows, searchQuery, statusFilter]);

  const exportable = useMemo(() => {
    if (!activeCard) return null;
    const exported = filteredRows.map((row) => ({
      orderNumber: row.orderNumber || row.id,
      status: row.status,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      deliveryAddress: row.deliveryAddress,
      items: row.itemsCount,
      subtotal: formatKes(row.subtotal),
      deliveryFee: formatKes(row.deliveryFee),
      total: formatKes(row.total),
      createdAt: formatDateTime(row.createdAt),
    }));
    return { filename: "orders_register_snapshot.csv", rows: exported };
  }, [activeCard, filteredRows]);

  const onExport = () => {
    if (!exportable) return;
    exportCSV(exportable.rows, exportable.filename);
  };

  const onRowClick = (row) => {
    const id = row?.id;
    if (!id) return;
    navigate(`/dashboard/admin/orders/${id}`, {
      state: {
        returnTo: "/dashboard/admin/reports?section=orders",
        returnLabel: "Back to Orders Snapshot Register",
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-indigo-100 p-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-lg font-semibold text-indigo-700">Date Range</h2>
          {dateRange.compare && (
            <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1">
              Comparison enabled
            </span>
          )}
        </div>
        <DateRangeControls value={dateRange} onChange={setDateRange} />
      </div>

      <div className="bg-white rounded-xl border border-indigo-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-indigo-700">Orders Register Snapshot</h2>
          {activeCard && exportable && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              <Download size={16} />
              Export Register CSV
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          {cards.map((card) => (
            <button
              type="button"
              key={card.key}
              onClick={() => setActiveCard(card.key)}
              className={`bg-white border rounded-xl shadow-sm p-5 text-left transition ${
                activeCard === card.key ? "border-indigo-600 ring-2 ring-indigo-200" : "hover:shadow"
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-indigo-700">{card.value}</p>
                </div>
                <card.icon className="text-indigo-600" />
              </div>
            </button>
          ))}
        </div>

        {!activeCard ? (
          <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-4 text-sm text-indigo-700">
            Select any card to view orders register details.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm font-medium text-gray-700">
                Viewing: {cards.find((card) => card.key === activeCard)?.title || "Register"}
              </p>
              <button
                type="button"
                onClick={() => setActiveCard(null)}
                className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close Register
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Revenue (in range)</p>
                <p className="text-sm text-gray-700">
                  Subtotal: <span className="font-semibold">{formatKes(amountTotals.subtotal)}</span> | Delivery:{" "}
                  <span className="font-semibold">{formatKes(amountTotals.deliveryFee)}</span> | Total:{" "}
                  <span className="font-semibold">{formatKes(amountTotals.total)}</span>
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Status Filter</p>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PLACED">Placed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETE">Complete</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Search</p>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search order #, customer, address..."
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">#</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Order #</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Customer</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Items</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Total</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Delivery Address</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        No orders match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr
                        key={`${row.id}-${idx}`}
                        className="hover:bg-blue-50 cursor-pointer"
                        onClick={() => onRowClick(row)}
                      >
                        <td className="px-3 py-3">{idx + 1}</td>
                        <td className="px-3 py-3">{row.orderNumber || row.id}</td>
                        <td className="px-3 py-3">
                          <div>{row.customerName}</div>
                          <div className="text-xs text-gray-500">{row.customerEmail}</div>
                        </td>
                        <td className="px-3 py-3">{row.status}</td>
                        <td className="px-3 py-3">{row.itemsCount}</td>
                        <td className="px-3 py-3">{formatKes(row.total)}</td>
                        <td className="px-3 py-3">{row.deliveryAddress}</td>
                        <td className="px-3 py-3">{formatDateTime(row.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
