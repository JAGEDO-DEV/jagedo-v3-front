export const builderTypes = ["FUNDI", "PROFESSIONAL", "CONTRACTOR", "HARDWARE"];

const adminRegisterRoleKeys = new Set(["ADMIN", "SUPER_ADMIN", "ASSOCIATE", "MEMBER", "AGENT"]);

export const sourceLabel = {
  SOCIAL_MEDIA: "Social Media",
  ADVERTISEMENT: "Advertisement",
  DIRECT_REFERRAL: "Direct Referral",
  WORD_OF_MOUTH: "Word of Mouth",
  UNKNOWN: "Not Specified",
};

export const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.hashSet)) return payload.hashSet;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const normalizeSource = (raw) => {
  const value = String(raw || "").trim().toUpperCase();
  if (value === "SOCIAL_MEDIA") return "SOCIAL_MEDIA";
  if (value === "ADVERTISEMENT" || value === "ADVERT") return "ADVERTISEMENT";
  if (value === "DIRECT_REFERRAL") return "DIRECT_REFERRAL";
  if (value === "WORD_OF_MOUTH") return "WORD_OF_MOUTH";
  return "UNKNOWN";
};

export const toLifecycleKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

export const normalizeCustomerAccountType = (raw, organizationName) => {
  const value = String(raw || "").trim().toUpperCase();
  if (value === "ORGANIZATION" || value === "INDIVIDUAL") return value;
  return String(organizationName || "").trim() ? "ORGANIZATION" : "INDIVIDUAL";
};

export const isOrganizationCustomer = (row) =>
  row?.userType === "CUSTOMER" && normalizeCustomerAccountType(row?.accountType, row?.organizationName) === "ORGANIZATION";

export const isIndividualCustomer = (row) => row?.userType === "CUSTOMER" && !isOrganizationCustomer(row);

export const isAdminRegisterUser = (row) => adminRegisterRoleKeys.has(String(row?.userType || "").toUpperCase());

export const builderStatusToLifecycleKey = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "SIGNED_UP") return "signed_up";
  if (normalized === "INCOMPLETE") return "incomplete";
  if (normalized === "COMPLETED") return "complete";
  if (normalized === "PENDING") return "pending_verification";
  if (normalized === "VERIFIED" || normalized === "PARTIALLY_VERIFIED") return "verified";
  if (normalized === "RETURNED") return "returned";
  if (normalized === "SUSPENDED" || normalized === "BLACKLISTED") return "suspended";
  return "incomplete";
};

export const lifecycleLabel = (raw) =>
  String(raw || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const inDateRange = (value, start, end) => {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.toISOString().slice(0, 10);
  return day >= start && day <= end;
};

export const previousPeriodRange = (start, end) => {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { start, end };
  }
  const spanDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
  const previousEnd = new Date(startDate);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - (spanDays - 1));
  return {
    start: previousStart.toISOString().slice(0, 10),
    end: previousEnd.toISOString().slice(0, 10),
  };
};

export const exportCSV = (records, filename) => {
  if (!records || !records.length) return;
  const escapeCell = (value) => {
    const safe = String(value ?? "");
    if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  };
  const headers = Object.keys(records[0]).map(escapeCell).join(",");
  const rows = records.map((r) => Object.values(r).map(escapeCell).join(","));
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const toProductTypeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const productTypeLabel = (value) => {
  const key = toProductTypeKey(value);
  if (key === "hardware") return "Hardware";
  if (key === "custom") return "Custom Product";
  if (key === "design") return "Design";
  if (key === "machinery") return "Machinery / Equipment";
  return "Other";
};

export const toProductSubmissionKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const productSubmissionLabel = (value) => {
  const key = toProductSubmissionKey(value);
  if (key === "submitted") return "Pending Approval";
  if (key === "approved") return "Approved";
  if (key === "rejected") return "Rejected";
  return "Draft";
};

export const isActiveStatus = (value) => String(value || "").trim().toLowerCase() === "active";

export const yesNo = (value) => (value ? "Yes" : "No");

export const formatKes = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "N/A";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
};
