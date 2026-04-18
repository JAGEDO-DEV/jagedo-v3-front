import { useMemo, useState } from "react";
import { Briefcase, Download, FileText, Gavel, PlayCircle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DateRangeControls from "@/components/admin/DateRangeControls";
import { exportCSV, formatDateTime, inDateRange } from "@/pages/dashboard/admin/reports-snapshot-utils";

const normalizeToken = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .trim();

const hasAssignedProvider = (item) => {
  const assignedProviders = Array.isArray(item?.assignedServiceProviders) ? item.assignedServiceProviders : [];
  const assignedProvider = item?.assignedServiceProvider;
  const assignedProviderId = Number(
    item?.assignedServiceProviderId ?? item?.assigned_service_provider_id ?? item?.assignedProviderId ?? 0
  );

  return (
    assignedProviders.length > 0 ||
    Boolean(assignedProvider) ||
    (Number.isFinite(assignedProviderId) && assignedProviderId > 0)
  );
};

const isActiveLifecycle = (item) => {
  const statusToken = normalizeToken(item?.status);
  const stageToken = normalizeToken(item?.stage);
  return (
    statusToken === "active" ||
    statusToken === "assigned" ||
    statusToken === "inprogress" ||
    stageToken === "inprogress" ||
    stageToken === "in_progress"
  );
};

const isPastLifecycle = (item) => {
  const statusToken = normalizeToken(item?.status);
  const stageToken = normalizeToken(item?.stage);
  return (
    statusToken === "complete" ||
    statusToken === "completed" ||
    statusToken === "past" ||
    statusToken === "closed" ||
    stageToken === "complete" ||
    stageToken === "completed" ||
    stageToken === "past" ||
    stageToken === "closed"
  );
};

const isBidLifecycle = (item) => {
  const statusToken = normalizeToken(item?.status);
  const stageToken = normalizeToken(item?.stage);
  const isMobilizationLike =
    statusToken === "mobilization" ||
    statusToken === "mobilisation" ||
    stageToken === "mobilization" ||
    stageToken === "mobilisation";
  if (isMobilizationLike) return true;

  if (isActiveLifecycle(item) || isPastLifecycle(item)) return false;

  return (
    statusToken === "bid" ||
    statusToken === "bidding" ||
    statusToken === "bid_awarded" ||
    statusToken === "payment_approval" ||
    statusToken === "bid_invited" ||
    statusToken === "bidinvited" ||
    stageToken === "bid_awarded" ||
    stageToken === "payment_approval" ||
    stageToken === "bid_invited" ||
    stageToken === "bidinvited" ||
    (hasAssignedProvider(item) && !isActiveLifecycle(item) && !isPastLifecycle(item))
  );
};

const isNewLifecycle = (item) => {
  if (hasAssignedProvider(item)) return false;
  const statusToken = normalizeToken(item?.status);
  return ["new", "unreviewed", "underreview", "submitted"].includes(statusToken);
};

const isDraftLifecycle = (item) => normalizeToken(item?.status) === "draft";

const toJobTypeKey = (value) => String(value || "").trim().toUpperCase();

const jobTypeLabel = (value) => {
  const key = toJobTypeKey(value);
  if (key === "FUNDI") return "Fundi";
  if (key === "PROFESSIONAL") return "Professional";
  if (key === "CONTRACTOR") return "Contractor";
  if (key === "HARDWARE") return "Hardware";
  return key || "N/A";
};

const toManagedByKey = (value) => String(value || "").trim().toUpperCase();

const managedByLabel = (value) => {
  const key = toManagedByKey(value);
  if (key === "JAGEDO") return "JaGedo";
  if (key === "SELF") return "Self";
  if (key === "BUILDER") return "Builder";
  return key || "N/A";
};

export default function JobsSnapshotSection({ jobRequests = [], dateRange, setDateRange }) {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(null);
  const [jobTypeFilter, setJobTypeFilter] = useState("ALL");
  const [managedByFilter, setManagedByFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const rows = useMemo(() => {
    const raw = Array.isArray(jobRequests) ? jobRequests : [];
    return raw
      .map((job) => {
        const createdAt = job?.createdAt || job?.created_at || null;
        const updatedAt = job?.updatedAt || job?.updated_at || createdAt;
        const jobTypeKey = toJobTypeKey(job?.jobType || job?.job_type || job?.category);
        const managedByKey = toManagedByKey(job?.managedBy || job?.managed_by || job?.orderType || job?.type);
        const status = String(job?.status || "N/A");
        const stage = String(job?.stage || "N/A");

        return {
          id: job?.id,
          jobId: job?.jobId || job?.job_id || job?.id,
          jobTypeKey,
          jobType: jobTypeLabel(jobTypeKey),
          managedByKey,
          managedBy: managedByLabel(managedByKey),
          skill: job?.skill || "N/A",
          location: job?.location || "N/A",
          status,
          stage,
          requesterId: job?.requesterId ?? job?.requester_id ?? null,
          createdAt,
          updatedAt,
          _raw: job,
        };
      })
      .filter((row) => inDateRange(row.createdAt || row.updatedAt, dateRange.start, dateRange.end));
  }, [dateRange.end, dateRange.start, jobRequests]);

  const totals = useMemo(() => {
    const base = { total: rows.length, new: 0, draft: 0, bid: 0, active: 0, past: 0 };
    rows.forEach((row) => {
      if (isDraftLifecycle(row._raw)) base.draft += 1;
      else if (isBidLifecycle(row._raw)) base.bid += 1;
      else if (isActiveLifecycle(row._raw)) base.active += 1;
      else if (isPastLifecycle(row._raw)) base.past += 1;
      else if (isNewLifecycle(row._raw)) base.new += 1;
      else base.new += 1;
    });
    return base;
  }, [rows]);

  const byJobType = useMemo(() => {
    const map = { FUNDI: 0, PROFESSIONAL: 0, CONTRACTOR: 0, HARDWARE: 0, OTHER: 0 };
    rows.forEach((row) => {
      if (row.jobTypeKey in map) map[row.jobTypeKey] += 1;
      else map.OTHER += 1;
    });
    return map;
  }, [rows]);

  const byManagedBy = useMemo(() => {
    const map = { JAGEDO: 0, SELF: 0, BUILDER: 0, OTHER: 0 };
    rows.forEach((row) => {
      if (row.managedByKey in map) map[row.managedByKey] += 1;
      else map.OTHER += 1;
    });
    return map;
  }, [rows]);

  const cards = [
    { key: "JOBS_TOTAL", title: "Total Jobs", value: totals.total, icon: Briefcase },
    { key: "JOBS_NEW", title: "New", value: totals.new, icon: FileText },
    { key: "JOBS_DRAFT", title: "Drafts", value: totals.draft, icon: ShieldCheck },
    { key: "JOBS_BID", title: "Bids", value: totals.bid, icon: Gavel },
    { key: "JOBS_ACTIVE", title: "Active", value: totals.active, icon: PlayCircle },
    { key: "JOBS_PAST", title: "Past", value: totals.past, icon: Briefcase },
  ];

  const filteredRows = useMemo(() => {
    let filtered = rows;

    if (jobTypeFilter !== "ALL") {
      filtered = filtered.filter((row) => row.jobTypeKey === jobTypeFilter);
    }
    if (managedByFilter !== "ALL") {
      filtered = filtered.filter((row) => row.managedByKey === managedByFilter);
    }

    if (activeCard === "JOBS_NEW") filtered = filtered.filter((row) => isNewLifecycle(row._raw) && !isDraftLifecycle(row._raw) && !isBidLifecycle(row._raw) && !isActiveLifecycle(row._raw) && !isPastLifecycle(row._raw));
    if (activeCard === "JOBS_DRAFT") filtered = filtered.filter((row) => isDraftLifecycle(row._raw));
    if (activeCard === "JOBS_BID") filtered = filtered.filter((row) => isBidLifecycle(row._raw));
    if (activeCard === "JOBS_ACTIVE") filtered = filtered.filter((row) => isActiveLifecycle(row._raw));
    if (activeCard === "JOBS_PAST") filtered = filtered.filter((row) => isPastLifecycle(row._raw));

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((row) => {
        return (
          String(row.jobId || "").toLowerCase().includes(q) ||
          String(row.skill || "").toLowerCase().includes(q) ||
          String(row.location || "").toLowerCase().includes(q) ||
          String(row.jobType || "").toLowerCase().includes(q) ||
          String(row.managedBy || "").toLowerCase().includes(q) ||
          String(row.status || "").toLowerCase().includes(q) ||
          String(row.stage || "").toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  }, [activeCard, jobTypeFilter, managedByFilter, rows, searchQuery]);

  const exportable = useMemo(() => {
    if (!activeCard) return null;
    const exported = filteredRows.map((row) => ({
      jobId: row.jobId || row.id,
      jobType: row.jobType,
      managedBy: row.managedBy,
      skill: row.skill,
      location: row.location,
      status: row.status,
      stage: row.stage,
      requesterId: row.requesterId ?? "N/A",
      createdAt: formatDateTime(row.createdAt),
      updatedAt: formatDateTime(row.updatedAt),
    }));
    return {
      filename: "jobs_register_snapshot.csv",
      rows: exported,
    };
  }, [activeCard, filteredRows]);

  const onExport = () => {
    if (!exportable) return;
    exportCSV(exportable.rows, exportable.filename);
  };

  const onRowClick = (row) => {
    const id = row?.id;
    if (!id) return;
    navigate(`/dashboard/admin/jobs/${id}`, {
      state: {
        returnTo: "/dashboard/admin/reports?section=jobs",
        returnLabel: "Back to Jobs Snapshot Register",
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
          <h2 className="text-lg font-semibold text-indigo-700">Jobs Register Snapshot</h2>
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

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
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
            Select any card to view job register details.
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
                <p className="text-xs text-gray-500 mb-1">Job Types (in range)</p>
                <p className="text-sm text-gray-700">
                  Fundi: <span className="font-semibold">{byJobType.FUNDI}</span> | Professional:{" "}
                  <span className="font-semibold">{byJobType.PROFESSIONAL}</span> | Contractor:{" "}
                  <span className="font-semibold">{byJobType.CONTRACTOR}</span> | Hardware:{" "}
                  <span className="font-semibold">{byJobType.HARDWARE}</span>
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Managed By (in range)</p>
                <p className="text-sm text-gray-700">
                  JaGedo: <span className="font-semibold">{byManagedBy.JAGEDO}</span> | Self:{" "}
                  <span className="font-semibold">{byManagedBy.SELF}</span>
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Search</p>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search jobId, skill, location..."
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={jobTypeFilter}
                onChange={(event) => setJobTypeFilter(event.target.value)}
                className="border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="ALL">All Job Types</option>
                <option value="FUNDI">Fundi</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="CONTRACTOR">Contractor</option>
                <option value="HARDWARE">Hardware</option>
              </select>

              <select
                value={managedByFilter}
                onChange={(event) => setManagedByFilter(event.target.value)}
                className="border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="ALL">All Managed By</option>
                <option value="JAGEDO">JaGedo</option>
                <option value="SELF">Self</option>
                <option value="BUILDER">Builder</option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">#</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Job ID</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Job Type</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Skill</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Location</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Managed By</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Stage</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500">
                        No jobs match current filters.
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
                        <td className="px-3 py-3">{row.jobId || row.id}</td>
                        <td className="px-3 py-3">{row.jobType}</td>
                        <td className="px-3 py-3">{row.skill}</td>
                        <td className="px-3 py-3">{row.location}</td>
                        <td className="px-3 py-3">{row.managedBy}</td>
                        <td className="px-3 py-3">{row.status}</td>
                        <td className="px-3 py-3">{row.stage}</td>
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
