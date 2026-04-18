import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FileText, Shield, UserCheck, Users } from "lucide-react";
import { resolveLifecycleStatus } from "@/utils/lifecycleStatus";
import { resolveBuilderRegisterStatus } from "@/pages/dashboard/admin/registers/builders";
import SystemSnapshotView from "@/pages/dashboard/admin/reports-system-snapshot-view";
import {
  builderStatusToLifecycleKey,
  builderTypes,
  exportCSV,
  formatDateTime,
  inDateRange,
  isAdminRegisterUser,
  isIndividualCustomer,
  isOrganizationCustomer,
  normalizeCustomerAccountType,
  normalizeSource,
  previousPeriodRange,
  sourceLabel,
  toLifecycleKey,
} from "@/pages/dashboard/admin/reports-snapshot-utils";

export default function SystemSnapshotSection({
  users = [],
  profiles = [],
  lifecycleReport = null,
  dateRange,
  setDateRange,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const initialParams = new URLSearchParams(location.search);
  const [activeCard, setActiveCard] = useState(() => initialParams.get("systemCard") || null);
  const [roleFilter, setRoleFilter] = useState(
    () => initialParams.get("systemCategory") || initialParams.get("systemRole") || "ALL"
  );
  const [lifecycleFilter, setLifecycleFilter] = useState(() => initialParams.get("systemLifecycle") || "ALL");
  const [sourceFilter, setSourceFilter] = useState(() => initialParams.get("systemSource") || "ALL");
  const [locationFilter, setLocationFilter] = useState(() => initialParams.get("systemLocation") || "ALL");
  const [searchQuery, setSearchQuery] = useState(() => initialParams.get("systemSearch") || "");

  const resetSecondaryFilters = () => {
    setLifecycleFilter("ALL");
    setSourceFilter("ALL");
  };

  const handleRoleFilterChange = (nextRole) => {
    setRoleFilter(nextRole);
    if (nextRole === "ALL") resetSecondaryFilters();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (activeCard) params.set("systemCard", activeCard);
    else params.delete("systemCard");

    if (roleFilter !== "ALL") params.set("systemCategory", roleFilter);
    else params.delete("systemCategory");
    params.delete("systemRole");

    if (lifecycleFilter !== "ALL") params.set("systemLifecycle", lifecycleFilter);
    else params.delete("systemLifecycle");

    if (sourceFilter !== "ALL") params.set("systemSource", sourceFilter);
    else params.delete("systemSource");

    if (locationFilter !== "ALL") params.set("systemLocation", locationFilter);
    else params.delete("systemLocation");

    if (searchQuery.trim()) params.set("systemSearch", searchQuery.trim());
    else params.delete("systemSearch");

    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith("?") ? location.search.slice(1) : location.search;
    if (nextSearch !== currentSearch) {
      navigate({ pathname: location.pathname, search: nextSearch }, { replace: true });
    }
  }, [activeCard, roleFilter, lifecycleFilter, sourceFilter, locationFilter, searchQuery, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (activeCard === "CUSTOMERS") {
      setRoleFilter("ALL_CUSTOMERS");
      resetSecondaryFilters();
      return;
    }
    if (activeCard === "BUILDERS") {
      setRoleFilter("ALL_BUILDERS");
      resetSecondaryFilters();
      return;
    }
    setRoleFilter("ALL");
    resetSecondaryFilters();
  }, [activeCard]);

  const snapshots = useMemo(() => {
    const rows = profiles.map((profile) => {
      const idKey = String(profile?.userId ?? "");
      const emailKey = String(profile?.email || "").trim().toLowerCase();
      const user =
        (idKey ? users.find((u) => String(u?.id ?? "") === idKey) : undefined)
        || (emailKey ? users.find((u) => String(u?.email || "").trim().toLowerCase() === emailKey) : undefined)
        || {};

      const userType = String(profile?.role || user?.userType || user?.role || "").toUpperCase();
      const isBuilder = builderTypes.includes(userType);
      const lifecycle = isBuilder
        ? builderStatusToLifecycleKey(resolveBuilderRegisterStatus(user || {}, profile || {}))
        : toLifecycleKey(resolveLifecycleStatus({
            status: profile?.status || user?.status,
            adminApproved: profile?.adminApproved === true || user?.adminApproved === true,
            profileCompleted: profile?.profileCompleted === true || user?.profileCompleted === true,
            submissionStatus: profile?.submissionStatus || user?.submissionStatus,
            userType: profile?.role || user?.userType || user?.role,
            accountType: profile?.accountType || user?.accountType,
            uploadsData: profile?.uploadsData || user?.uploadsData || {},
          }));

      const marketingPayload =
        profile?.marketingData
        || profile?.marketing_payload
        || user?.marketingData
        || user?.marketing_payload
        || {};
      const signupSource = normalizeSource(marketingPayload?.howDidYouHearAboutUs);
      const fullName = [user?.firstName || profile?.firstName, user?.lastName || profile?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const organizationName = String(profile?.organizationName || user?.organizationName || "").trim();
      const accountType = normalizeCustomerAccountType(profile?.accountType || user?.accountType, organizationName);

      return {
        id: profile?.userId ?? user?.id ?? profile?.id,
        name: fullName || profile?.organizationName || user?.email || profile?.email || "N/A",
        email: user?.email || profile?.email || "N/A",
        phone: user?.phoneNumber || profile?.phone || "N/A",
        county: user?.county || profile?.county || "N/A",
        subCounty: user?.subCounty || profile?.subCounty || marketingPayload?.subCounty || "N/A",
        userType,
        accountType,
        organizationName,
        lifecycle: toLifecycleKey(profile?.deletedAt || profile?.deleted_at ? "deleted" : (profile?.lifecycleStatus || lifecycle)),
        verifiedAt: profile?.verifiedAt || profile?.verified_at || null,
        deletedAt: profile?.deletedAt || profile?.deleted_at || null,
        suspendedAt: profile?.suspendedAt || profile?.suspended_at || null,
        signupSource,
        createdAt: profile?.created_at || profile?.createdAt || user?.createdAt || "",
        updatedAt: profile?.updated_at || profile?.updatedAt || user?.updatedAt || "",
        submissionStatus: String(profile?.submissionStatus || user?.submissionStatus || "").toLowerCase(),
      };
    });

    const existingKeys = new Set(rows.map((row) => String(row.id || "").trim()).filter(Boolean));
    users.forEach((user) => {
      const idKey = String(user?.id ?? "");
      if (idKey && existingKeys.has(idKey)) return;
      const marketingPayload = user?.marketingData || user?.marketing_payload || {};
      const lifecycle = resolveLifecycleStatus({
        status: user?.status,
        adminApproved: user?.adminApproved === true,
        profileCompleted: user?.profileCompleted === true,
        submissionStatus: user?.submissionStatus,
        userType: user?.userType || user?.role,
        accountType: user?.accountType,
        uploadsData: user?.uploadsData || {},
      });
      const userType = String(user?.userType || user?.role || "").toUpperCase();
      const isBuilder = builderTypes.includes(userType);
      const organizationName = String(user?.organizationName || "").trim();
      const accountType = normalizeCustomerAccountType(user?.accountType, organizationName);
      rows.push({
        id: user?.id,
        name: [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.email || "N/A",
        email: user?.email || "N/A",
        phone: user?.phoneNumber || "N/A",
        county: user?.county || marketingPayload?.county || "N/A",
        subCounty: user?.subCounty || marketingPayload?.subCounty || "N/A",
        userType,
        accountType,
        organizationName,
        lifecycle: toLifecycleKey(
          user?.deletedAt ? "deleted" : (
            user?.lifecycleStatus || (
              isBuilder
                ? builderStatusToLifecycleKey(resolveBuilderRegisterStatus(user || {}, null))
                : lifecycle
            )
          )
        ),
        verifiedAt: user?.verifiedAt || null,
        deletedAt: user?.deletedAt || null,
        suspendedAt: user?.suspendedAt || null,
        signupSource: normalizeSource(marketingPayload?.howDidYouHearAboutUs),
        createdAt: user?.createdAt || "",
        updatedAt: user?.updatedAt || "",
        submissionStatus: String(user?.submissionStatus || "").toLowerCase(),
      });
    });

    return rows;
  }, [users, profiles]);

  const buildLifecycleDashboardFromRows = (rows) => {
    const keys = [
      "signed_up",
      "incomplete",
      "complete",
      "pending_verification",
      "verified",
      "suspended",
      "returned",
      "deleted",
    ];
    const totals = Object.fromEntries(keys.map((key) => [key, 0]));
    rows.forEach((row) => {
      const key = toLifecycleKey(row.lifecycle);
      if (key in totals) totals[key] += 1;
    });
    const activeDenominator = keys.filter((key) => key !== "deleted").reduce((acc, key) => acc + totals[key], 0) || 1;
    const distribution = Object.fromEntries(keys.map((key) => [key, Number(((totals[key] / activeDenominator) * 100).toFixed(2))]));
    const activeRows = rows.filter((row) => toLifecycleKey(row.lifecycle) !== "deleted");
    const funnel = {
      signed_up: activeRows.length,
      complete: activeRows.filter((row) => ["complete", "pending_verification", "verified", "suspended", "returned"].includes(toLifecycleKey(row.lifecycle))).length,
      pending_verification: activeRows.filter((row) => ["pending_verification", "verified", "suspended", "returned"].includes(toLifecycleKey(row.lifecycle))).length,
      verified: activeRows.filter((row) => ["verified"].includes(toLifecycleKey(row.lifecycle))).length,
      suspended: totals.suspended,
      returned: totals.returned,
      deleted_count_only: totals.deleted,
    };
    const drop = (start, end) => (start > 0 ? Number((((start - end) / start) * 100).toFixed(2)) : 0);
    const avgVerificationDays = (() => {
      const verifiedRows = activeRows.filter((row) => toLifecycleKey(row.lifecycle) === "verified" && row.verifiedAt && row.createdAt);
      if (!verifiedRows.length) return 0;
      const totalDays = verifiedRows.reduce((acc, row) => {
        const start = new Date(row.createdAt).getTime();
        const end = new Date(row.verifiedAt).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) return acc;
        return acc + (end - start) / (1000 * 60 * 60 * 24);
      }, 0);
      return Number((totalDays / verifiedRows.length).toFixed(2));
    })();
    const pendingOver7 = activeRows.filter((row) => {
      if (toLifecycleKey(row.lifecycle) !== "pending_verification") return false;
      const timestamp = new Date(row.createdAt).getTime();
      if (Number.isNaN(timestamp)) return false;
      return (Date.now() - timestamp) > 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      totals,
      distribution_percentages: distribution,
      funnel: {
        ...funnel,
        drop_off_rates: {
          signed_up_to_complete: drop(funnel.signed_up, funnel.complete),
          complete_to_pending_verification: drop(funnel.complete, funnel.pending_verification),
          pending_verification_to_verified: drop(funnel.pending_verification, funnel.verified),
        },
      },
      aging: { pending_over_7_days: pendingOver7 },
      average_time_to_verification_days: avgVerificationDays,
      comparison: null,
    };
  };

  const lifecycleReportFallback = useMemo(() => {
    const currentRows = snapshots.filter((row) => inDateRange(row.createdAt, dateRange.start, dateRange.end));
    const current = buildLifecycleDashboardFromRows(currentRows);
    if (!dateRange.compare) return current;
    const prev = previousPeriodRange(dateRange.start, dateRange.end);
    const prevRows = snapshots.filter((row) => inDateRange(row.createdAt, prev.start, prev.end));
    const previous = buildLifecycleDashboardFromRows(prevRows);
    current.comparison = {
      deltas: Object.fromEntries(Object.keys(current.totals).map((key) => {
        const curr = current.totals[key] || 0;
        const prevCount = previous.totals[key] || 0;
        return [key, { delta: curr - prevCount, percent: prevCount ? Number((((curr - prevCount) / prevCount) * 100).toFixed(2)) : 0, previous: prevCount }];
      })),
    };
    return current;
  }, [snapshots, dateRange.start, dateRange.end, dateRange.compare]);

  const lifecycleDashboard = useMemo(() => {
    const apiTotals = lifecycleReport?.totals || null;
    const hasApiNumbers = apiTotals && Object.values(apiTotals).some((value) => Number(value) > 0);
    return hasApiNumbers ? lifecycleReport : lifecycleReportFallback;
  }, [lifecycleReport, lifecycleReportFallback]);

  const signupRowsInRange = useMemo(
    () => snapshots.filter((row) => inDateRange(row.createdAt, dateRange.start, dateRange.end)),
    [dateRange.end, dateRange.start, snapshots]
  );

  const customersCount = signupRowsInRange.filter((user) => user.userType === "CUSTOMER").length;
  const buildersCount = signupRowsInRange.filter((user) => builderTypes.includes(user.userType)).length;
  const adminsCount = signupRowsInRange.filter((user) => isAdminRegisterUser(user)).length;

  const cards = [
    { key: "TOTAL_USERS", title: "Total Users", value: signupRowsInRange.length, icon: Users },
    { key: "CUSTOMERS", title: "Customers", value: customersCount, icon: UserCheck },
    { key: "BUILDERS", title: "Builders", value: buildersCount, icon: Shield },
    { key: "TOTAL_ADMINS", title: "Total Admins", value: adminsCount, icon: FileText },
  ];

  const buildersByType = useMemo(
    () => ({
      FUNDI: signupRowsInRange.filter((user) => user.userType === "FUNDI").length,
      PROFESSIONAL: signupRowsInRange.filter((user) => user.userType === "PROFESSIONAL").length,
      CONTRACTOR: signupRowsInRange.filter((user) => user.userType === "CONTRACTOR").length,
      HARDWARE: signupRowsInRange.filter((user) => user.userType === "HARDWARE").length,
    }),
    [signupRowsInRange]
  );

  const customersByType = useMemo(
    () => ({
      INDIVIDUAL: signupRowsInRange.filter((user) => isIndividualCustomer(user)).length,
      ORGANIZATION: signupRowsInRange.filter((user) => isOrganizationCustomer(user)).length,
    }),
    [signupRowsInRange]
  );

  const baseDetailRows = useMemo(() => {
    if (activeCard === "CUSTOMERS") return snapshots.filter((row) => row.userType === "CUSTOMER");
    if (activeCard === "BUILDERS") return snapshots.filter((row) => builderTypes.includes(row.userType));
    if (activeCard === "TOTAL_ADMINS") return snapshots.filter((row) => isAdminRegisterUser(row));
    return snapshots;
  }, [activeCard, snapshots]);

  const detailRows = useMemo(() => {
    let rows = baseDetailRows.filter((row) => inDateRange(row.createdAt, dateRange.start, dateRange.end));
    if (roleFilter === "ALL_BUILDERS") rows = rows.filter((row) => builderTypes.includes(row.userType));
    if (roleFilter === "ALL_CUSTOMERS") rows = rows.filter((row) => row.userType === "CUSTOMER");
    if (roleFilter === "CUSTOMER_INDIVIDUAL") rows = rows.filter((row) => isIndividualCustomer(row));
    if (roleFilter === "CUSTOMER_ORGANIZATION") rows = rows.filter((row) => isOrganizationCustomer(row));
    if (
      roleFilter !== "ALL"
      && roleFilter !== "ALL_BUILDERS"
      && roleFilter !== "ALL_CUSTOMERS"
      && roleFilter !== "CUSTOMER_INDIVIDUAL"
      && roleFilter !== "CUSTOMER_ORGANIZATION"
    ) {
      rows = rows.filter((row) => row.userType === roleFilter);
    }
    if (lifecycleFilter !== "ALL") rows = rows.filter((row) => toLifecycleKey(row.lifecycle) === lifecycleFilter);
    if (sourceFilter !== "ALL") rows = rows.filter((row) => row.signupSource === sourceFilter);
    if (locationFilter !== "ALL") {
      rows = rows.filter((row) => `${row.county || "N/A"}|${row.subCounty || "N/A"}` === locationFilter);
    }
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (normalizedSearch) {
      rows = rows.filter((row) => {
        const haystack = [
          row.name,
          row.email,
          row.phone,
          row.userType,
          row.organizationName,
          row.county,
          row.subCounty,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }
    rows.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    return rows;
  }, [baseDetailRows, dateRange.end, dateRange.start, lifecycleFilter, roleFilter, sourceFilter, locationFilter, searchQuery]);

  const locationOptions = useMemo(() => {
    const keys = new Set();
    baseDetailRows
      .filter((row) => inDateRange(row.createdAt, dateRange.start, dateRange.end))
      .forEach((row) => {
        const county = row.county || "N/A";
        const subCounty = row.subCounty || "N/A";
        keys.add(`${county}|${subCounty}`);
      });
    return Array.from(keys)
      .map((value) => {
        const [county, subCounty] = value.split("|");
        return { value, label: subCounty && subCounty !== "N/A" ? `${county} / ${subCounty}` : county };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [baseDetailRows, dateRange.end, dateRange.start]);

  const exportedRows = detailRows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    county: row.county,
    userType: row.userType,
    lifecycle: row.lifecycle,
    signupSource: sourceLabel[row.signupSource] || sourceLabel.UNKNOWN,
    createdAt: formatDateTime(row.createdAt),
  }));

  const handleExportUsers = () => {
    exportCSV(exportedRows, "system_register_users.csv");
  };

  const handleExportLifecycle = () => {
    exportCSV(
      [{
        start: lifecycleDashboard?.range?.start || dateRange.start,
        end: lifecycleDashboard?.range?.end || dateRange.end,
        ...(lifecycleDashboard?.totals || {}),
        average_time_to_verification_days: lifecycleDashboard?.average_time_to_verification_days ?? 0,
        pending_over_7_days: lifecycleDashboard?.aging?.pending_over_7_days ?? 0,
      }],
      "user_lifecycle.csv"
    );
  };

  return (
    <SystemSnapshotView
      dateRange={dateRange}
      setDateRange={setDateRange}
      activeCard={activeCard}
      setActiveCard={setActiveCard}
      cards={cards}
      onExportUsers={handleExportUsers}
      adminsCount={adminsCount}
      buildersCount={buildersCount}
      buildersByType={buildersByType}
      customersCount={customersCount}
      customersByType={customersByType}
      roleFilter={roleFilter}
      onRoleFilterChange={handleRoleFilterChange}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      locationFilter={locationFilter}
      setLocationFilter={setLocationFilter}
      locationOptions={locationOptions}
      lifecycleFilter={lifecycleFilter}
      setLifecycleFilter={setLifecycleFilter}
      sourceFilter={sourceFilter}
      setSourceFilter={setSourceFilter}
      detailRows={detailRows}
      onRowClick={(row) =>
        navigate(`/dashboard/profile/${row.id}/${row.userType || "CUSTOMER"}`, {
          state: {
            userData: row,
            returnTo: `/dashboard/admin/reports${location.search || "?section=system"}`,
            returnLabel: "Back to Reports Register",
          },
        })}
      onGoToUserManagement={() => navigate("/dashboard/admin/user-management")}
      lifecycleDashboard={lifecycleDashboard}
      onExportLifecycle={handleExportLifecycle}
    />
  );
}
