"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Briefcase, Package, ShoppingCart, Users } from "lucide-react";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getLifecycleReport } from "@/api/reports.api";
import { getUserRoleUsers } from "@/api/userRoles.api";
import { getAllProducts } from "@/api/products.api";
import { getAllAttributes } from "@/api/attributes.api";
import { getAllRegions } from "@/api/regions.api";
import { getAdminJobRequests } from "@/api/jobRequests.api";
import { getAdminCartOrdersNormalized } from "@/api/cartOrders.api";
import { computePresetRange } from "@/utils/adminDateRange";
import SystemSnapshotSection from "@/pages/dashboard/admin/reports-system-snapshot";
import ProductSnapshotSection from "@/pages/dashboard/admin/reports-product-snapshot";
import JobsSnapshotSection from "@/pages/dashboard/admin/reports-jobs-snapshot";
import OrdersSnapshotSection from "@/pages/dashboard/admin/reports-orders-snapshot";

const SECTIONS = [
  { key: "system", title: "System Register Snapshot", icon: Users },
  { key: "product", title: "Product Register Snapshot", icon: Package },
  { key: "jobs", title: "Jobs Register Snapshot", icon: Briefcase },
  { key: "orders", title: "Orders Register Snapshot", icon: ShoppingCart },
];

const SECTION_KEYS = new Set(SECTIONS.map((section) => section.key));
const DEFAULT_SECTION = "system";

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.hashSet)) return payload.hashSet;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const resolveSectionFromSearch = (search) => {
  const section = new URLSearchParams(search).get("section");
  return SECTION_KEYS.has(section) ? section : DEFAULT_SECTION;
};

function ComingSoonSection({ title }) {
  return (
    <div className="bg-white rounded-xl border border-indigo-100 p-6">
      <h2 className="text-lg font-semibold text-indigo-700 mb-3">{title}</h2>
      <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-4 text-sm text-indigo-700">
        Coming soon.
      </div>
    </div>
  );
}

export default function AdminReports() {
  const location = useLocation();
  const navigate = useNavigate();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [lifecycleReport, setLifecycleReport] = useState(null);
  const [shopProducts, setShopProducts] = useState([]);
  const [shopAttributes, setShopAttributes] = useState([]);
  const [shopRegions, setShopRegions] = useState([]);
  const [jobRequests, setJobRequests] = useState([]);
  const [cartOrders, setCartOrders] = useState([]);

  const [dateRange, setDateRange] = useState(() => ({
    preset: "30d",
    ...computePresetRange("30d"),
    compare: false,
  }));

  const openSection = useMemo(() => resolveSectionFromSearch(location.search), [location.search]);
  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.key === openSection) || SECTIONS[0],
    [openSection]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (SECTION_KEYS.has(params.get("section"))) return;
    params.set("section", DEFAULT_SECTION);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!axiosInstance) return;
    let isMounted = true;

    const loadReports = async () => {
      const [
        usersResult,
        profilesResult,
        lifecycleResult,
        productsResult,
        attributesResult,
        regionsResult,
        jobsResult,
        cartOrdersResult,
      ]
        = await Promise.allSettled([
          getUserRoleUsers(axiosInstance),
          axiosInstance.get("/api/profiles/", { params: { includeDeleted: 1 } }),
          getLifecycleReport(axiosInstance, {
            start: dateRange.start,
            end: dateRange.end,
            compare: dateRange.compare,
          }),
          getAllProducts(axiosInstance),
          getAllAttributes(axiosInstance),
          getAllRegions(axiosInstance),
          getAdminJobRequests(axiosInstance),
          getAdminCartOrdersNormalized(axiosInstance),
        ]);

      if (!isMounted) return;

      setUsers(
        usersResult.status === "fulfilled" && Array.isArray(usersResult.value)
          ? usersResult.value
          : []
      );
      setProfiles(
        profilesResult.status === "fulfilled"
          ? toArray(profilesResult.value?.data)
          : []
      );
      setLifecycleReport(lifecycleResult.status === "fulfilled" ? lifecycleResult.value : null);
      setShopProducts(productsResult.status === "fulfilled" ? toArray(productsResult.value) : []);
      setShopAttributes(attributesResult.status === "fulfilled" ? toArray(attributesResult.value) : []);
      setShopRegions(regionsResult.status === "fulfilled" ? toArray(regionsResult.value) : []);
      setJobRequests(
        jobsResult.status === "fulfilled"
          ? toArray(jobsResult.value?.hashSet ?? jobsResult.value?.data ?? jobsResult.value)
          : []
      );
      setCartOrders(cartOrdersResult.status === "fulfilled" ? toArray(cartOrdersResult.value) : []);
    };

    loadReports();
    const timer = setInterval(loadReports, 30000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [axiosInstance, dateRange.compare, dateRange.end, dateRange.start]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-indigo-800">System Reports</h1>
          <p className="text-sm text-gray-500">Operational + lifecycle reports (auto-refresh every 30 seconds)</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-indigo-100 bg-white p-4">
          <div className="flex items-center gap-2">
            <activeSection.icon size={18} className="text-indigo-700" />
            <h2 className="text-sm font-semibold text-indigo-800">{activeSection.title}</h2>
          </div>
        </div>

        {openSection === "system" && (
          <SystemSnapshotSection
            users={users}
            profiles={profiles}
            lifecycleReport={lifecycleReport}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        )}

        {openSection === "product" && (
          <ProductSnapshotSection
            shopProducts={shopProducts}
            shopAttributes={shopAttributes}
            shopRegions={shopRegions}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        )}

        {openSection === "jobs" && (
          <JobsSnapshotSection
            jobRequests={jobRequests}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        )}

        {openSection === "orders" && (
          <OrdersSnapshotSection
            cartOrders={cartOrders}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        )}
      </div>
    </div>
  );
}
