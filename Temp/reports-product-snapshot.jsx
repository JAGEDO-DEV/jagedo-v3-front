import { useMemo, useState } from "react";
import { Check, FileText, Package, Shield, UserCheck, X } from "lucide-react";
import ProductSnapshotView from "@/pages/dashboard/admin/reports-product-snapshot-view";
import {
  exportCSV,
  formatDateTime,
  inDateRange,
  isActiveStatus,
  lifecycleLabel,
  productSubmissionLabel,
  productTypeLabel,
  toArray,
  toProductSubmissionKey,
  toProductTypeKey,
  yesNo,
} from "@/pages/dashboard/admin/reports-snapshot-utils";

export default function ProductSnapshotSection({
  shopProducts = [],
  shopAttributes = [],
  shopRegions = [],
  dateRange,
  setDateRange,
}) {
  const [activeProductCard, setActiveProductCard] = useState(null);
  const isInRangeOrUndated = (value) => !value || inDateRange(value, dateRange.start, dateRange.end);

  const productRows = useMemo(
    () =>
      toArray(shopProducts).map((product) => {
        const prices = Array.isArray(product?.prices) ? product.prices : [];
        const numericPrices = prices
          .map((row) => Number(row?.price))
          .filter((amount) => Number.isFinite(amount) && amount > 0);
        const createdAt = product?.createdAt || product?.created_at || null;
        const updatedAt = product?.updatedAt || product?.updated_at || createdAt;
        const productTypeKey = toProductTypeKey(product?.type || product?.product_type);
        const submissionStatus = toProductSubmissionKey(product?.submissionStatus || product?.submission_status || "draft");

        return {
          id: product?.id,
          name: product?.name || "Untitled",
          sku: product?.sku || product?.bId || "N/A",
          productTypeKey,
          productType: productTypeLabel(productTypeKey),
          submissionStatus,
          submissionLabel: productSubmissionLabel(submissionStatus),
          groupName: product?.groupName || product?.category || "Unassigned",
          subgroupName: product?.subgroupName || "N/A",
          isActive: Boolean(product?.active ?? product?.is_active ?? true),
          hasPricing: numericPrices.length > 0,
          pricePoints: numericPrices.length,
          minPrice: numericPrices.length ? Math.min(...numericPrices) : null,
          maxPrice: numericPrices.length ? Math.max(...numericPrices) : null,
          createdAt,
          updatedAt,
        };
      }),
    [shopProducts]
  );

  const productRowsInRange = useMemo(
    () =>
      productRows.filter((row) => inDateRange(row.createdAt || row.updatedAt, dateRange.start, dateRange.end)),
    [dateRange.end, dateRange.start, productRows]
  );

  const productSubmissionTotals = useMemo(() => {
    const totals = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
    productRowsInRange.forEach((row) => {
      const key = row.submissionStatus in totals ? row.submissionStatus : "draft";
      totals[key] += 1;
    });
    return totals;
  }, [productRowsInRange]);

  const productTypeTotals = useMemo(() => {
    const totals = { hardware: 0, custom: 0, design: 0, machinery: 0, other: 0 };
    productRowsInRange.forEach((row) => {
      if (row.productTypeKey in totals) totals[row.productTypeKey] += 1;
      else totals.other += 1;
    });
    return totals;
  }, [productRowsInRange]);

  const productSetupMetrics = useMemo(() => {
    const attributes = toArray(shopAttributes).filter((attribute) =>
      isInRangeOrUndated(attribute?.createdAt || attribute?.created_at || attribute?.updatedAt || attribute?.updated_at)
    );
    const regions = toArray(shopRegions).filter((region) =>
      isInRangeOrUndated(region?.createdAt || region?.created_at || region?.updatedAt || region?.updated_at)
    );
    const activeAttributes = attributes.filter((attribute) => isActiveStatus(attribute?.status)).length;
    const requiredAttributes = attributes.filter((attribute) => attribute?.isRequired === true).length;
    const customerVisibleAttributes = attributes.filter((attribute) => attribute?.showToCustomers === true).length;
    const activeRegions = regions.filter((region) => region?.active === true || isActiveStatus(region?.status)).length;
    const customerVisibleRegions = regions.filter((region) => region?.customerView === true).length;
    const filterableRegions = regions.filter((region) => region?.filterable === true).length;

    return {
      attributes: attributes.length,
      activeAttributes,
      requiredAttributes,
      customerVisibleAttributes,
      regions: regions.length,
      activeRegions,
      customerVisibleRegions,
      filterableRegions,
    };
  }, [dateRange.end, dateRange.start, shopAttributes, shopRegions]);

  const productStatusReport = useMemo(
    () => ({
      total: productRowsInRange.length,
      draft: productSubmissionTotals.draft,
      submitted: productSubmissionTotals.submitted,
      approved: productSubmissionTotals.approved,
      rejected: productSubmissionTotals.rejected,
      hardware: productTypeTotals.hardware,
      custom: productTypeTotals.custom,
      design: productTypeTotals.design,
      machinery: productTypeTotals.machinery,
    }),
    [productRowsInRange.length, productSubmissionTotals, productTypeTotals]
  );

  const productTypeCards = [
    { key: "PRODUCT_TOTAL", title: "Total Products", value: productRowsInRange.length, icon: Package },
    { key: "PRODUCT_TYPE_HARDWARE", title: "Hardware", value: productTypeTotals.hardware, icon: Package },
    { key: "PRODUCT_TYPE_CUSTOM", title: "Custom Products", value: productTypeTotals.custom, icon: Package },
    { key: "PRODUCT_TYPE_DESIGN", title: "Design", value: productTypeTotals.design, icon: Package },
    { key: "PRODUCT_TYPE_MACHINERY", title: "Machinery & Equipment", value: productTypeTotals.machinery, icon: Package },
  ];

  const productLifecycleCards = [
    { key: "PRODUCT_STATUS_PENDING", title: "Pending Approval", value: productSubmissionTotals.submitted, icon: FileText },
    { key: "PRODUCT_STATUS_APPROVED", title: "Approved", value: productSubmissionTotals.approved, icon: Check },
    { key: "PRODUCT_STATUS_REJECTED", title: "Rejected", value: productSubmissionTotals.rejected, icon: X },
    { key: "PRODUCT_STATUS_DRAFT", title: "Draft", value: productSubmissionTotals.draft, icon: FileText },
  ];

  const productSetupCards = [
    {
      key: "PRODUCT_SETUP_ATTRIBUTES",
      title: "Attributes",
      value: productSetupMetrics.attributes,
      description: `Active: ${productSetupMetrics.activeAttributes} | Required: ${productSetupMetrics.requiredAttributes}`,
      subDescription: `Customer-visible: ${productSetupMetrics.customerVisibleAttributes}`,
      icon: Shield,
    },
    {
      key: "PRODUCT_SETUP_REGIONS",
      title: "Regions",
      value: productSetupMetrics.regions,
      description: `Active: ${productSetupMetrics.activeRegions} | Customer View: ${productSetupMetrics.customerVisibleRegions}`,
      subDescription: `Filterable: ${productSetupMetrics.filterableRegions}`,
      icon: UserCheck,
    },
  ];

  const productCardLookup = useMemo(() => {
    const map = new Map();
    [...productTypeCards, ...productLifecycleCards, ...productSetupCards].forEach((card) => map.set(card.key, card));
    return map;
  }, [productLifecycleCards, productSetupCards, productTypeCards]);

  const productAttributeRegisterRows = useMemo(
    () =>
      toArray(shopAttributes)
        .map((attribute) => ({
          id: attribute?.id,
          name: attribute?.name || "Unnamed Attribute",
          type: attribute?.type || "N/A",
          groupName: attribute?.groupName || "N/A",
          subgroupName: attribute?.subgroupName || "N/A",
          required: attribute?.isRequired === true || attribute?.required === true,
          customerVisible: attribute?.showToCustomers === true || attribute?.customerVisible === true,
          status: String(attribute?.status || "inactive").toLowerCase(),
          createdAt: attribute?.createdAt || attribute?.created_at || null,
          updatedAt: attribute?.updatedAt || attribute?.updated_at || null,
        }))
        .filter((attribute) => isInRangeOrUndated(attribute.createdAt || attribute.updatedAt))
        .sort((left, right) => String(left.name || "").localeCompare(String(right.name || ""))),
    [dateRange.end, dateRange.start, shopAttributes]
  );

  const productRegionRegisterRows = useMemo(
    () =>
      toArray(shopRegions)
        .map((region) => ({
          id: region?.id,
          name: region?.name || region?.regionName || "Unnamed Region",
          active: region?.active === true || isActiveStatus(region?.status),
          customerView: region?.customerView === true,
          filterable: region?.filterable === true,
          createdAt: region?.createdAt || region?.created_at || null,
          updatedAt: region?.updatedAt || region?.updated_at || null,
        }))
        .filter((region) => isInRangeOrUndated(region.createdAt || region.updatedAt))
        .sort((left, right) => String(left.name || "").localeCompare(String(right.name || ""))),
    [dateRange.end, dateRange.start, shopRegions]
  );

  const activeProductRegister = useMemo(() => {
    if (!activeProductCard) return { kind: null, title: "" };
    if (activeProductCard === "PRODUCT_SETUP_ATTRIBUTES") return { kind: "attributes", title: "Attributes Register" };
    if (activeProductCard === "PRODUCT_SETUP_REGIONS") return { kind: "regions", title: "Regions Register" };
    return { kind: "products", title: productCardLookup.get(activeProductCard)?.title || "Products Register" };
  }, [activeProductCard, productCardLookup]);

  const productDetailRows = useMemo(() => {
    let rows = productRows.filter((row) => inDateRange(row.createdAt || row.updatedAt, dateRange.start, dateRange.end));

    if (activeProductCard === "PRODUCT_TYPE_HARDWARE") rows = rows.filter((row) => row.productTypeKey === "hardware");
    else if (activeProductCard === "PRODUCT_TYPE_CUSTOM") rows = rows.filter((row) => row.productTypeKey === "custom");
    else if (activeProductCard === "PRODUCT_TYPE_DESIGN") rows = rows.filter((row) => row.productTypeKey === "design");
    else if (activeProductCard === "PRODUCT_TYPE_MACHINERY") rows = rows.filter((row) => row.productTypeKey === "machinery");
    else if (activeProductCard === "PRODUCT_STATUS_PENDING") rows = rows.filter((row) => row.submissionStatus === "submitted");
    else if (activeProductCard === "PRODUCT_STATUS_APPROVED") rows = rows.filter((row) => row.submissionStatus === "approved");
    else if (activeProductCard === "PRODUCT_STATUS_REJECTED") rows = rows.filter((row) => row.submissionStatus === "rejected");
    else if (activeProductCard === "PRODUCT_STATUS_DRAFT") rows = rows.filter((row) => row.submissionStatus === "draft");

    rows.sort((left, right) => {
      const leftDate = new Date(right.updatedAt || right.createdAt || 0).getTime();
      const rightDate = new Date(left.updatedAt || left.createdAt || 0).getTime();
      return leftDate - rightDate;
    });
    return rows;
  }, [activeProductCard, dateRange.end, dateRange.start, productRows]);

  const exportedProductRows = productDetailRows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    type: row.productType,
    submissionStatus: row.submissionLabel,
    active: row.isActive ? "Yes" : "No",
    group: row.groupName,
    subgroup: row.subgroupName,
    pricePoints: row.pricePoints,
    minPrice: row.minPrice ?? "",
    maxPrice: row.maxPrice ?? "",
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt),
  }));

  const exportedAttributeRows = productAttributeRegisterRows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    groupName: row.groupName,
    subgroupName: row.subgroupName,
    required: yesNo(row.required),
    customerVisible: yesNo(row.customerVisible),
    status: lifecycleLabel(row.status),
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt),
  }));

  const exportedRegionRows = productRegionRegisterRows.map((row) => ({
    id: row.id,
    name: row.name,
    active: yesNo(row.active),
    customerView: yesNo(row.customerView),
    filterable: yesNo(row.filterable),
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt),
  }));

  const activeProductExport = useMemo(() => {
    if (!activeProductCard) return null;
    if (activeProductRegister.kind === "attributes") return { filename: "product_attributes_register.csv", rows: exportedAttributeRows };
    if (activeProductRegister.kind === "regions") return { filename: "product_regions_register.csv", rows: exportedRegionRows };
    return { filename: "product_register_snapshot.csv", rows: exportedProductRows };
  }, [activeProductCard, activeProductRegister.kind, exportedAttributeRows, exportedProductRows, exportedRegionRows]);

  const handleExportActiveRegister = () => {
    if (!activeProductExport) return;
    exportCSV(activeProductExport.rows, activeProductExport.filename);
  };

  return (
    <ProductSnapshotView
      dateRange={dateRange}
      setDateRange={setDateRange}
      activeProductCard={activeProductCard}
      setActiveProductCard={setActiveProductCard}
      activeProductExport={activeProductExport}
      onExportActiveRegister={handleExportActiveRegister}
      productTypeCards={productTypeCards}
      productLifecycleCards={productLifecycleCards}
      productSetupCards={productSetupCards}
      activeProductRegister={activeProductRegister}
      productDetailRows={productDetailRows}
      productAttributeRegisterRows={productAttributeRegisterRows}
      productRegionRegisterRows={productRegionRegisterRows}
      productStatusReport={productStatusReport}
    />
  );
}
