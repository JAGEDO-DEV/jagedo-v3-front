import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getAllCustomers, getAllProviders } from "@/api/provider.api";
import { getSmsHistory, sendBulkSms, BulkSmsRequest, SmsHistoryEntry } from "@/api/bulk-sms.api";
import { toast } from "sonner";

interface BulkSmsContextType {
  // Data
  customers: any[];
  builders: any[];
  smsHistory: SmsHistoryEntry[];
  loading: boolean;
  error: string | null;
  
  // Filters
  builderTypeFilter: string;
  setBuilderTypeFilter: (value: string) => void;
  builderCountyFilter: string;
  setBuilderCountyFilter: (value: string) => void;
  builderSearch: string;
  setBuilderSearch: (value: string) => void;
  customerTypeFilter: string;
  setCustomerTypeFilter: (value: string) => void;
  customerCountyFilter: string;
  setCustomerCountyFilter: (value: string) => void;
  customerSearch: string;
  setCustomerSearch: (value: string) => void;
  
  // Selections
  selectedBuilders: number[];
  setSelectedBuilders: React.Dispatch<React.SetStateAction<number[]>>;
  selectedCustomers: number[];
  setSelectedCustomers: React.Dispatch<React.SetStateAction<number[]>>;
  manualPhoneNumbers: string[];
  setManualPhoneNumbers: React.Dispatch<React.SetStateAction<string[]>>;
  
  // Actions
  refreshHistory: () => Promise<void>;
  sendSms: (message: string) => Promise<void>;
  clearAllFilters: () => void;
  retryFetchData: () => Promise<void>;
  
  // Derived data
  filteredBuilders: any[];
  filteredCustomers: any[];
  builderTypes: string[];
  builderCounties: string[];
  customerCounties: string[];
  totalSelectedRecipients: number;
}

const BulkSmsContext = createContext<BulkSmsContextType | undefined>(undefined);

const serverUrl = import.meta.env.VITE_SERVER_URL;
if (!serverUrl) {
  throw new Error("Server URL configuration is missing");
}

export const BulkSmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const axiosInstance = useAxiosWithAuth(serverUrl);

  // Data states
  const [customers, setCustomers] = useState<any[]>([]);
  const [builders, setBuilders] = useState<any[]>([]);
  const [smsHistory, setSmsHistory] = useState<SmsHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [builderTypeFilter, setBuilderTypeFilter] = useState("all");
  const [builderCountyFilter, setBuilderCountyFilter] = useState("all");
  const [builderSearch, setBuilderSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [customerCountyFilter, setCustomerCountyFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");

  // Selection states
  const [selectedBuilders, setSelectedBuilders] = useState<number[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [manualPhoneNumbers, setManualPhoneNumbers] = useState<string[]>([]);

  // Fetch data on mount
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [customersResponse, buildersResponse, historyResponse] = await Promise.all([
          getAllCustomers(axiosInstance).catch(() => ({ hashSet: [] })),
          getAllProviders(axiosInstance).catch(() => ({ hashSet: [] })),
          getSmsHistory(axiosInstance).catch(() => [])
        ]);

        if (!isMounted) return;

        setCustomers(customersResponse?.hashSet || []);
        setBuilders(buildersResponse?.hashSet || []);
        setSmsHistory(historyResponse || []);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Failed to fetch data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Derived data
  const builderTypes = useMemo(() => {
    return [...new Set(builders.map(b => b.userType).filter(Boolean))]
      .filter(type => type?.toUpperCase() !== 'ADMIN');
  }, [builders]);

  const builderCounties = useMemo(() => {
    return [...new Set(builders.map(b => b.county).filter(Boolean))];
  }, [builders]);

  const customerCounties = useMemo(() => {
    return [...new Set(customers.map(c => c.county).filter(Boolean))];
  }, [customers]);

  const filteredBuilders = useMemo(() => {
    return builders.filter(builder => {
      if (!builder || builder.userType?.toUpperCase() === 'ADMIN') return false;

      const matchesType = builderTypeFilter === "all" || builder.userType === builderTypeFilter;
      const matchesCounty = builderCountyFilter === "all" || builder.county === builderCountyFilter;
      const matchesSearch = builderSearch === "" || 
        getBuilderName(builder).toLowerCase().includes(builderSearch.toLowerCase()) ||
        builder.email?.toLowerCase().includes(builderSearch.toLowerCase());

      return matchesType && matchesCounty && matchesSearch;
    });
  }, [builders, builderTypeFilter, builderCountyFilter, builderSearch]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      if (!customer) return false;

      const matchesType = customerTypeFilter === "all" || customer.accountType === customerTypeFilter;
      const matchesCounty = customerCountyFilter === "all" || customer.county === customerCountyFilter;
      const matchesSearch = customerSearch === "" || 
        getCustomerName(customer).toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.email?.toLowerCase().includes(customerSearch.toLowerCase());

      return matchesType && matchesCounty && matchesSearch;
    });
  }, [customers, customerTypeFilter, customerCountyFilter, customerSearch]);

  const totalSelectedRecipients = selectedBuilders.length + selectedCustomers.length + manualPhoneNumbers.length;

  // Actions
  const refreshHistory = async () => {
    try {
      const updatedHistory = await getSmsHistory(axiosInstance);
      setSmsHistory(updatedHistory);
    } catch (err) {
      console.error("Error refreshing SMS history:", err);
    }
  };

  const sendSms = async (message: string) => {
    if (!message.trim()) {
      toast.error("Please enter a message before sending");
      return;
    }

    if (totalSelectedRecipients === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    try {
      const request: BulkSmsRequest = {
        message,
        recipientIds: {
          builderIds: selectedBuilders,
          customerIds: selectedCustomers,
        },
        phoneNumbers: manualPhoneNumbers.length > 0 ? manualPhoneNumbers : undefined,
      };

      const response = await sendBulkSms(axiosInstance, request);

      if (response.success) {
        toast.success(`SMS sent successfully to ${response.totalRecipients} recipients!`);
        await refreshHistory();
      } else {
        toast.error(response.message || "Failed to send SMS");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred while sending SMS");
    }
  };

  const clearAllFilters = () => {
    setBuilderTypeFilter("all");
    setBuilderCountyFilter("all");
    setBuilderSearch("");
    setCustomerTypeFilter("all");
    setCustomerCountyFilter("all");
    setCustomerSearch("");
  };

  const retryFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [customersResponse, buildersResponse, historyResponse] = await Promise.all([
        getAllCustomers(axiosInstance),
        getAllProviders(axiosInstance),
        getSmsHistory(axiosInstance)
      ]);

      setCustomers(customersResponse?.hashSet || []);
      setBuilders(buildersResponse?.hashSet || []);
      setSmsHistory(historyResponse || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    customers,
    builders,
    smsHistory,
    loading,
    error,
    builderTypeFilter,
    setBuilderTypeFilter,
    builderCountyFilter,
    setBuilderCountyFilter,
    builderSearch,
    setBuilderSearch,
    customerTypeFilter,
    setCustomerTypeFilter,
    customerCountyFilter,
    setCustomerCountyFilter,
    customerSearch,
    setCustomerSearch,
    selectedBuilders,
    setSelectedBuilders,
    selectedCustomers,
    setSelectedCustomers,
    manualPhoneNumbers,
    setManualPhoneNumbers,
    refreshHistory,
    sendSms,
    clearAllFilters,
    retryFetchData,
    filteredBuilders,
    filteredCustomers,
    builderTypes,
    builderCounties,
    customerCounties,
    totalSelectedRecipients,
  };

  return <BulkSmsContext.Provider value={value}>{children}</BulkSmsContext.Provider>;
};

export const useBulkSms = () => {
  const context = useContext(BulkSmsContext);
  if (!context) {
    throw new Error("useBulkSms must be used within BulkSmsProvider");
  }
  return context;
};

// Helper functions
export const getBuilderName = (builder: any) => {
  if (!builder) return "Unknown";
  if (builder.accountType === "INDIVIDUAL") {
    return `${builder.firstName || ""} ${builder.lastName || ""}`.trim() || builder.email || "Unknown Builder";
  }
  return builder.organizationName || builder.email || "Unknown Builder";
};

export const getCustomerName = (customer: any) => {
  if (!customer) return "Unknown";
  if (customer.accountType === "INDIVIDUAL") {
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email || "Unknown Customer";
  }
  return customer.organizationName || customer.email || "Unknown Customer";
};