import { Download } from "lucide-react";
import DateRangeControls from "@/components/admin/DateRangeControls";
import {
  formatDateTime,
  lifecycleLabel,
  sourceLabel,
} from "@/pages/dashboard/admin/reports-snapshot-utils";

export default function SystemSnapshotView({
  dateRange,
  setDateRange,
  activeCard,
  setActiveCard,
  cards,
  onExportUsers,
  adminsCount,
  buildersCount,
  buildersByType,
  customersCount,
  customersByType,
  roleFilter,
  onRoleFilterChange,
  searchQuery,
  setSearchQuery,
  locationFilter,
  setLocationFilter,
  locationOptions,
  lifecycleFilter,
  setLifecycleFilter,
  sourceFilter,
  setSourceFilter,
  detailRows,
  onRowClick,
  onGoToUserManagement,
  lifecycleDashboard,
  onExportLifecycle,
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
          <h2 className="text-lg font-semibold text-indigo-700">System Register Snapshot</h2>
          {activeCard && (
            <button
              onClick={onExportUsers}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              <Download size={16} />
              Export Users CSV
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
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
            Select any card to view the register details.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-sm font-medium text-gray-700">
                Viewing: {cards.find((item) => item.key === activeCard)?.title || "Register"}
              </p>
              <button
                type="button"
                onClick={() => setActiveCard(null)}
                className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close Register
              </button>
            </div>

            {activeCard === "TOTAL_ADMINS" ? (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
                <p className="text-sm text-indigo-800">
                  Total admins in selected date range: <span className="font-semibold">{adminsCount}</span>
                </p>
                <p className="text-sm text-indigo-700 mt-1">
                  Open User Management to view and manage admin accounts.
                </p>
                <button
                  type="button"
                  onClick={onGoToUserManagement}
                  className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Go to User Management
                </button>
              </div>
            ) : (
              <>
                {activeCard === "BUILDERS" && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { key: "ALL_BUILDERS", label: "All Builders", count: buildersCount },
                      { key: "FUNDI", label: "Fundis", count: buildersByType.FUNDI },
                      { key: "PROFESSIONAL", label: "Professionals", count: buildersByType.PROFESSIONAL },
                      { key: "CONTRACTOR", label: "Contractors", count: buildersByType.CONTRACTOR },
                      { key: "HARDWARE", label: "Hardware", count: buildersByType.HARDWARE },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onRoleFilterChange(item.key)}
                        className={`px-3 py-2 rounded border text-sm ${
                          roleFilter === item.key
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                            : "bg-white border-gray-200 text-gray-700"
                        }`}
                      >
                        {item.label} ({item.count})
                      </button>
                    ))}
                  </div>
                )}

                {activeCard === "CUSTOMERS" && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { key: "ALL_CUSTOMERS", label: "All Customers", count: customersCount },
                      { key: "CUSTOMER_INDIVIDUAL", label: "Individual Customers", count: customersByType.INDIVIDUAL },
                      { key: "CUSTOMER_ORGANIZATION", label: "Organization Customers", count: customersByType.ORGANIZATION },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onRoleFilterChange(item.key)}
                        className={`px-3 py-2 rounded border text-sm ${
                          roleFilter === item.key
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                            : "bg-white border-gray-200 text-gray-700"
                        }`}
                      >
                        {item.label} ({item.count})
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search customers/builders..."
                    className="border rounded px-3 py-2 text-sm bg-white min-w-[220px]"
                  />

                  <select
                    value={roleFilter}
                    onChange={(event) => onRoleFilterChange(event.target.value)}
                    className="border rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="ALL_CUSTOMERS">All Customers</option>
                    <option value="CUSTOMER_INDIVIDUAL">Individual Customers</option>
                    <option value="CUSTOMER_ORGANIZATION">Organization Customers</option>
                    <option value="ALL_BUILDERS">All Builders</option>
                    <option value="FUNDI">Fundi</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="HARDWARE">Hardware</option>
                  </select>

                  <select
                    value={locationFilter}
                    onChange={(event) => setLocationFilter(event.target.value)}
                    className="border rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="ALL">All Locations</option>
                    {locationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={lifecycleFilter}
                    onChange={(event) => setLifecycleFilter(event.target.value)}
                    className="border rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="ALL">All Lifecycle</option>
                    <option value="signed_up">Signed Up</option>
                    <option value="incomplete">Incomplete</option>
                    <option value="complete">Complete</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="verified">Verified</option>
                    <option value="suspended">Suspended</option>
                    <option value="returned">Returned</option>
                    <option value="deleted">Deleted</option>
                  </select>

                  <select
                    value={sourceFilter}
                    onChange={(event) => setSourceFilter(event.target.value)}
                    className="border rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="ALL">All Sources</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="ADVERTISEMENT">Advertisement</option>
                    <option value="DIRECT_REFERRAL">Direct Referral</option>
                    <option value="WORD_OF_MOUTH">Word of Mouth</option>
                    <option value="UNKNOWN">Not Specified</option>
                  </select>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full bg-white text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">#</th>
                        <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Name</th>
                        <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Email</th>
                        <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Role</th>
                        <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Location</th>
                        <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Lifecycle</th>
                        <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Signup Source</th>
                        <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detailRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-500">
                            No users match current filters.
                          </td>
                        </tr>
                      ) : (
                        detailRows.map((row, idx) => (
                          <tr
                            key={`${row.id}-${idx}`}
                            className="hover:bg-blue-50 cursor-pointer"
                            onClick={() => onRowClick(row)}
                          >
                            <td className="px-3 py-3">{idx + 1}</td>
                            <td className="px-3 py-3">{row.name}</td>
                            <td className="px-3 py-3">{row.email}</td>
                            <td className="px-3 py-3">{row.userType || "N/A"}</td>
                            <td className="px-3 py-3">{row.county || "N/A"}{row.subCounty ? ` / ${row.subCounty}` : ""}</td>
                            <td className="px-3 py-3">{lifecycleLabel(row.lifecycle)}</td>
                            <td className="px-3 py-3">{sourceLabel[row.signupSource] || sourceLabel.UNKNOWN}</td>
                            <td className="px-3 py-3">{formatDateTime(row.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-indigo-100 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-indigo-700">Lifecycle Dashboard</h2>
            <p className="text-sm text-gray-500">
              Date-filtered lifecycle counts, lifecycle status reports, aging, and verification performance.
            </p>
          </div>
          <button
            onClick={onExportLifecycle}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 inline-flex items-center gap-2"
          >
            <Download size={16} />
            Export Lifecycle CSV
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(lifecycleDashboard?.totals || {}).map(([key, value]) => (
            <div key={key} className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500">{lifecycleLabel(key)}</p>
              <p className="text-2xl font-bold text-indigo-700">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Lifecycle Change Report</h3>
            {lifecycleDashboard?.comparison?.deltas && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Vs Previous Period (Counts)</p>
                <div className="space-y-2 text-sm">
                  {["signed_up", "complete", "pending_verification", "verified", "suspended", "returned", "deleted"].map((key) => {
                    const row = lifecycleDashboard.comparison.deltas[key];
                    if (!row) return null;
                    return (
                      <div key={key} className="flex items-center justify-between border rounded p-2">
                        <span className="text-gray-700">{lifecycleLabel(key)}</span>
                        <span className={`${row.delta >= 0 ? "text-green-700" : "text-red-700"} font-semibold`}>
                          {row.delta >= 0 ? "+" : ""}
                          {row.delta}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!lifecycleDashboard?.comparison?.deltas && (
              <div className="rounded border p-3 bg-gray-50 text-sm text-gray-600">
                Enable date comparison to view lifecycle deltas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
