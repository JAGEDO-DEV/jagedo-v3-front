import { Download } from "lucide-react";
import DateRangeControls from "@/components/admin/DateRangeControls";
import {
  formatDateTime,
  formatKes,
  lifecycleLabel,
  yesNo,
} from "@/pages/dashboard/admin/reports-snapshot-utils";

export default function ProductSnapshotView({
  dateRange,
  setDateRange,
  activeProductCard,
  setActiveProductCard,
  activeProductExport,
  onExportActiveRegister,
  productTypeCards,
  productLifecycleCards,
  productSetupCards,
  activeProductRegister,
  productDetailRows,
  productAttributeRegisterRows,
  productRegionRegisterRows,
  productStatusReport,
}) {
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
          <h2 className="text-lg font-semibold text-indigo-700">Product Register Snapshot</h2>
          {activeProductCard && activeProductExport && (
            <button
              onClick={onExportActiveRegister}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              <Download size={16} />
              Export Register CSV
            </button>
          )}
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-3">Product Register</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          {productTypeCards.map((card) => (
            <button
              type="button"
              key={card.key}
              onClick={() => setActiveProductCard(card.key)}
              className={`bg-white border rounded-xl shadow-sm p-5 text-left transition ${
                activeProductCard === card.key ? "border-indigo-600 ring-2 ring-indigo-200" : "hover:shadow"
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

        <p className="text-sm font-semibold text-gray-700 mb-3">Product Lifecycle</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {productLifecycleCards.map((card) => (
            <button
              type="button"
              key={card.key}
              onClick={() => setActiveProductCard(card.key)}
              className={`bg-white border rounded-xl shadow-sm p-5 text-left transition ${
                activeProductCard === card.key ? "border-indigo-600 ring-2 ring-indigo-200" : "hover:shadow"
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

        <p className="text-sm font-semibold text-gray-700 mb-3">Setup Registers</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {productSetupCards.map((card) => (
            <button
              type="button"
              key={card.key}
              onClick={() => setActiveProductCard(card.key)}
              className={`border rounded-lg p-4 text-left bg-gray-50 transition ${
                activeProductCard === card.key ? "border-indigo-600 ring-2 ring-indigo-200" : "hover:shadow"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-indigo-700">{card.value}</p>
                </div>
                <card.icon className="text-indigo-600 mt-0.5" />
              </div>
              {card.description && <p className="text-xs text-gray-600 mt-1">{card.description}</p>}
              {card.subDescription && <p className="text-xs text-gray-600">{card.subDescription}</p>}
            </button>
          ))}
        </div>

        {!activeProductCard ? (
          <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-4 text-sm text-indigo-700">
            Select any product, lifecycle, or setup card to view register details.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm font-medium text-gray-700">Viewing: {activeProductRegister.title}</p>
              <button
                type="button"
                onClick={() => setActiveProductCard(null)}
                className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close Register
              </button>
            </div>

            {activeProductRegister.kind === "products" && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">#</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Product</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">SKU / BID</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Type</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Group</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Active</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Prices</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Updated At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productDetailRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-gray-500">No products match current filters.</td>
                      </tr>
                    ) : (
                      productDetailRows.map((row, idx) => (
                        <tr key={`${row.id}-${idx}`} className="hover:bg-blue-50">
                          <td className="px-3 py-3">{idx + 1}</td>
                          <td className="px-3 py-3">{row.name}</td>
                          <td className="px-3 py-3">{row.sku}</td>
                          <td className="px-3 py-3">{row.productType}</td>
                          <td className="px-3 py-3">
                            <div>{row.groupName}</div>
                            <div className="text-xs text-gray-500">{row.subgroupName}</div>
                          </td>
                          <td className="px-3 py-3">{row.submissionLabel}</td>
                          <td className="px-3 py-3">{row.isActive ? "Yes" : "No"}</td>
                          <td className="px-3 py-3">
                            {row.hasPricing
                              ? `${row.pricePoints} pts (${formatKes(row.minPrice)} - ${formatKes(row.maxPrice)})`
                              : "No pricing"}
                          </td>
                          <td className="px-3 py-3">{formatDateTime(row.updatedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeProductRegister.kind === "attributes" && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">#</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Attribute</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Type</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Group</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Subgroup</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Required</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Customer Visible</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Updated At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productAttributeRegisterRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-gray-500">No attributes found.</td>
                      </tr>
                    ) : (
                      productAttributeRegisterRows.map((row, idx) => (
                        <tr key={`${row.id}-${idx}`} className="hover:bg-blue-50">
                          <td className="px-3 py-3">{idx + 1}</td>
                          <td className="px-3 py-3">{row.name}</td>
                          <td className="px-3 py-3">{row.type}</td>
                          <td className="px-3 py-3">{row.groupName}</td>
                          <td className="px-3 py-3">{row.subgroupName}</td>
                          <td className="px-3 py-3">{yesNo(row.required)}</td>
                          <td className="px-3 py-3">{yesNo(row.customerVisible)}</td>
                          <td className="px-3 py-3">{lifecycleLabel(row.status)}</td>
                          <td className="px-3 py-3">{formatDateTime(row.updatedAt || row.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeProductRegister.kind === "regions" && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">#</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Region</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Active</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Customer View</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Filterable</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Updated At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productRegionRegisterRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">No regions found.</td>
                      </tr>
                    ) : (
                      productRegionRegisterRows.map((row, idx) => (
                        <tr key={`${row.id}-${idx}`} className="hover:bg-blue-50">
                          <td className="px-3 py-3">{idx + 1}</td>
                          <td className="px-3 py-3">{row.name}</td>
                          <td className="px-3 py-3">{yesNo(row.active)}</td>
                          <td className="px-3 py-3">{yesNo(row.customerView)}</td>
                          <td className="px-3 py-3">{yesNo(row.filterable)}</td>
                          <td className="px-3 py-3">{formatDateTime(row.updatedAt || row.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-indigo-100 p-6">
        <h2 className="text-lg font-semibold text-indigo-700 mb-4">Product Status Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded border p-3 bg-gray-50 flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Registered</span>
            <span className="font-semibold text-indigo-700">{productStatusReport?.total || 0}</span>
          </div>
          <div className="rounded border p-3 bg-gray-50 flex items-center justify-between text-sm">
            <span className="text-gray-600">Draft</span>
            <span className="font-semibold text-indigo-700">{productStatusReport?.draft || 0}</span>
          </div>
          <div className="rounded border p-3 bg-gray-50 flex items-center justify-between text-sm">
            <span className="text-gray-600">Submitted</span>
            <span className="font-semibold text-indigo-700">{productStatusReport?.submitted || 0}</span>
          </div>
          <div className="rounded border p-3 bg-gray-50 flex items-center justify-between text-sm">
            <span className="text-gray-600">Approved</span>
            <span className="font-semibold text-indigo-700">{productStatusReport?.approved || 0}</span>
          </div>
          <div className="rounded border p-3 bg-gray-50 flex items-center justify-between text-sm">
            <span className="text-gray-600">Rejected</span>
            <span className="font-semibold text-indigo-700">{productStatusReport?.rejected || 0}</span>
          </div>
          <div className="rounded border p-3 bg-gray-50 text-sm">
            <p className="text-gray-600 mb-1">By Product Type</p>
            <p className="text-gray-700">
              Hardware: <span className="font-semibold">{productStatusReport?.hardware || 0}</span>, Custom:{" "}
              <span className="font-semibold">{productStatusReport?.custom || 0}</span>, Design:{" "}
              <span className="font-semibold">{productStatusReport?.design || 0}</span>, Machinery:{" "}
              <span className="font-semibold">{productStatusReport?.machinery || 0}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
