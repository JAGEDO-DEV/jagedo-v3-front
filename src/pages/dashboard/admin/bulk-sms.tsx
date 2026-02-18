import { useState, useEffect, useMemo } from "react";
import { toast, Toaster } from "sonner";
import {
  Send,
  Users,
  Filter,
  History,
  Search,
  Building,
  User,
  Phone,
  Loader2,
  Eye,
  ChevronDown,
  Upload,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getAllCustomers, getAllProviders } from "@/api/provider.api";
import { sendBulkSms, getSmsHistory, getSmsHistoryById, BulkSmsRequest, SmsHistoryEntry } from "@/api/bulk-sms.api";

const BulkSMS = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  
  if (!serverUrl) {
    console.error("VITE_SERVER_URL is not defined");
    throw new Error("Server URL configuration is missing");
  }
  
  const axiosInstance = useAxiosWithAuth(serverUrl);

  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("compose");
  const [activeRecipientTab, setActiveRecipientTab] = useState("builders");
  const [isSending, setIsSending] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SmsHistoryEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;

  // Manual phone numbers state
  const [manualPhoneNumbers, setManualPhoneNumbers] = useState<string[]>([]);
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);

  // Selected recipients state
  const [selectedBuilders, setSelectedBuilders] = useState<number[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);

  // Filter states for builders
  const [builderTypeFilter, setBuilderTypeFilter] = useState("all");
  const [builderCountyFilter, setBuilderCountyFilter] = useState("all");
  const [builderSearch, setBuilderSearch] = useState("");

  // Filter states for customers
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [customerCountyFilter, setCustomerCountyFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [builders, setBuilders] = useState<any[]>([]);
  const [smsHistory, setSmsHistory] = useState<SmsHistoryEntry[]>([]);

  // Fetch data on component mount - OPTIMIZED VERSION
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        setError(null);
        
        console.log("Starting to fetch data...");
        
        // Fetch both customers, builders, and SMS history in parallel with proper error handling
        const [customersResponse, buildersResponse, historyResponse] = await Promise.all([
          getAllCustomers(axiosInstance)
            .catch(err => {
              console.error("Error fetching customers:", err);
              return { hashSet: [] };
            }),
          getAllProviders(axiosInstance)
            .catch(err => {
              console.error("Error fetching builders:", err);
              return { hashSet: [] };
            }),
          getSmsHistory(axiosInstance)
            .catch(err => {
              console.error("Error fetching SMS history:", err);
              return [];
            })
        ]);

        if (!isMounted) return;

        const customersList = Array.isArray(customersResponse?.hashSet) ? customersResponse.hashSet : [];
        const buildersList = Array.isArray(buildersResponse?.hashSet) ? buildersResponse.hashSet : [];
        const history = Array.isArray(historyResponse) ? historyResponse : [];

        setCustomers(customersList);
        setBuilders(buildersList);
        setSmsHistory(history);
        console.log(history);

      } catch (err: any) {
        if (!isMounted) return;
        
        console.error("Unexpected error in fetchData:", err);
        setError(err?.message || "Failed to fetch data");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    try {
      fetchData();
    } catch (err: any) {
      console.error("Error starting fetch:", err);
      setError(err?.message || "Failed to initialize data fetch");
      setLoading(false);
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - fetch only once on component mount

  // Get unique filter options from dynamic data with safe access
  const builderTypes = useMemo(() => {
    if (!builders || !Array.isArray(builders)) return [];
    return [...new Set(builders.map((b) => b.user_type).filter(Boolean))].filter(
      (type) => type && type.toUpperCase() !== 'ADMIN'
    );
  }, [builders]);

  const builderCounties = useMemo(() => {
    if (!builders || !Array.isArray(builders)) return [];
    return [...new Set(builders.map((b) => b.county).filter(Boolean))];
  }, [builders]);

  const customerCounties = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];
    return [...new Set(customers.map((c) => c.county).filter(Boolean))];
  }, [customers]);

  // Format builder name based on account type
  const getBuilderName = (builder: any) => {
    if (!builder) return "Unknown";
    if (builder.accountType === "INDIVIDUAL") {
      return (
        `${builder.firstName || ""} ${builder.lastName || ""}`.trim() ||
        builder.email ||
        "Unknown Builder"
      );
    } else {
      return builder.organizationName || builder.email || "Unknown Builder";
    }
  };

  // Format customer name based on account type
  const getCustomerName = (customer: any) => {
    if (!customer) return "Unknown";
    if (customer.accountType === "INDIVIDUAL") {
      return (
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
        customer.email ||
        "Unknown Customer"
      );
    } else {
      return customer.organizationName || customer.email || "Unknown Customer";
    }
  };

  // Filtered builders with safe access
  const filteredBuilders = useMemo(() => {
    if (!builders || !Array.isArray(builders)) return [];

    return builders.filter((builder) => {
      if (!builder) return false;

      // Exclude ADMIN users
      if (builder.user_type && builder.user_type.toUpperCase() === 'ADMIN') {
        return false;
      }

      const matchesType =
        builderTypeFilter === "all" || builder.user_type === builderTypeFilter;
      const matchesCounty =
        builderCountyFilter === "all" || builder.county === builderCountyFilter;
      const matchesSearch =
        builderSearch === "" ||
        getBuilderName(builder)
          .toLowerCase()
          .includes(builderSearch.toLowerCase()) ||
        (builder.skills &&
          builder.skills.toLowerCase().includes(builderSearch.toLowerCase())) ||
        (builder.email &&
          builder.email.toLowerCase().includes(builderSearch.toLowerCase()));

      return matchesType && matchesCounty && matchesSearch;
    });
  }, [builders, builderTypeFilter, builderCountyFilter, builderSearch]);

  // Filtered customers with safe access
  const filteredCustomers = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];

    return customers.filter((customer) => {
      if (!customer) return false;

      const matchesType =
        customerTypeFilter === "all" ||
        customer.accountType === customerTypeFilter;
      const matchesCounty =
        customerCountyFilter === "all" ||
        customer.county === customerCountyFilter;
      const matchesSearch =
        customerSearch === "" ||
        getCustomerName(customer)
          .toLowerCase()
          .includes(customerSearch.toLowerCase()) ||
        (customer.email &&
          customer.email.toLowerCase().includes(customerSearch.toLowerCase()));

      return matchesType && matchesCounty && matchesSearch;
    });
  }, [customers, customerTypeFilter, customerCountyFilter, customerSearch]);

  // Toggle selection for builders
  const toggleBuilder = (id: number) => {
    setSelectedBuilders((prev) =>
      prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id]
    );
  };

  // Toggle selection for customers
  const toggleCustomer = (id: number) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  // Select all for current tab
  const selectAll = () => {
    if (activeRecipientTab === "builders") {
      setSelectedBuilders(
        filteredBuilders.map((b) => b.id).filter((id) => id !== undefined)
      );
    } else {
      setSelectedCustomers(
        filteredCustomers.map((c) => c.id).filter((id) => id !== undefined)
      );
    }
  };

  // Deselect all for current tab
  const deselectAll = () => {
    if (activeRecipientTab === "builders") {
      setSelectedBuilders([]);
    } else {
      setSelectedCustomers([]);
    }
  };

  // Get total selected recipients count
  const totalSelectedRecipients =
    selectedBuilders.length + selectedCustomers.length + manualPhoneNumbers.length;

  // Clear all filters
  const clearAllFilters = () => {
    setBuilderTypeFilter("all");
    setBuilderCountyFilter("all");
    setBuilderSearch("");
    setCustomerTypeFilter("all");
    setCustomerCountyFilter("all");
    setCustomerSearch("");
  };

  // Send SMS function
  const sendSMS = async () => {
    try {
      setIsSending(true);

      // Validate that we have a message
      if (!message.trim()) {
        toast.error("Please enter a message before sending");
        setIsSending(false);
        return;
      }

      // Validate that we have recipients
      if (selectedBuilders.length === 0 && selectedCustomers.length === 0 && manualPhoneNumbers.length === 0) {
        toast.error("Please select at least one recipient or add phone numbers");
        setIsSending(false);
        return;
      }

      // Prepare the request payload
      const request: BulkSmsRequest = {
        message: message,
        recipientIds: {
          builderIds: selectedBuilders,
          customerIds: selectedCustomers,
        },
        phoneNumbers: manualPhoneNumbers.length > 0 ? manualPhoneNumbers : undefined,
      };

      // Call the backend API
      const response = await sendBulkSms(axiosInstance, request);

      if (response.success) {
        toast.success(`SMS sent successfully to ${response.totalRecipients} recipients!`);

        // Reset form
        setMessage("");
        setSelectedBuilders([]);
        setSelectedCustomers([]);
        setManualPhoneNumbers([]);

        // Refresh SMS history
        try {
          const updatedHistory = await getSmsHistory(axiosInstance);
          setSmsHistory(updatedHistory);
        } catch (err) {
          console.error("Error refreshing SMS history:", err);
        }
      } else {
        toast.error(response.message || "Failed to send SMS");
      }
    } catch (err: any) {
      console.error("Error sending SMS:", err);
      toast.error(err?.message || "An error occurred while sending SMS");
    } finally {
      setIsSending(false);
    }
  };

  // View SMS history details
  const viewHistoryDetails = async (item: SmsHistoryEntry) => {
    try {
      setIsLoadingDetails(true);
      const details = await getSmsHistoryById(axiosInstance, item.id);
      setSelectedHistoryItem(details);
      setIsDetailsOpen(true);
    } catch (err) {
      console.error("Error fetching SMS details:", err);
      toast.error("Failed to load SMS details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Safe array length getter (excluding ADMIN users)
  const safeBuildersLength =
    filteredBuilders && Array.isArray(filteredBuilders) ? filteredBuilders.length : 0;
  const safeCustomersLength =
    customers && Array.isArray(customers) ? customers.length : 0;

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove spaces, dashes, and plus signs
    const cleanPhone = phone.replace(/[\s\-+()]/g, "");
    // Check if it contains only digits and has at least 9 digits (Kenya phone numbers)
    return /^\d{9,}$/.test(cleanPhone);
  };

  // Parse phone numbers from file
  const parsePhoneNumbersFromFile = async (file: File): Promise<string[]> => {
    try {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith(".csv")) {
        return parseCSV(file);
      } else if (fileName.endsWith(".xlsx")) {
        return parseXLSX(file);
      } else if (fileName.endsWith(".xls")) {
        return parseXLSX(file);
      } else {
        throw new Error("Unsupported file format. Please use CSV, XLS, or XLSX.");
      }
    } catch (err: any) {
      throw new Error(err.message || "Failed to parse file");
    }
  };

  // Parse CSV file
  const parseCSV = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string;
          const lines = csv.split("\n").filter((line) => line.trim());
          const phoneNumbers: string[] = [];

          lines.forEach((line, index) => {
            // Split by comma and try each cell
            const cells = line.split(",").map((cell) => cell.trim());
            cells.forEach((cell) => {
              if (cell && validatePhoneNumber(cell)) {
                phoneNumbers.push(cell);
              }
            });
          });

          if (phoneNumbers.length === 0) {
            reject(new Error("No valid phone numbers found in CSV file"));
          } else {
            resolve([...new Set(phoneNumbers)]); // Remove duplicates
          }
        } catch (err: any) {
          reject(new Error("Failed to parse CSV: " + err.message));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  };

  // Parse Excel file (XLS/XLSX)
  const parseXLSX = async (file: File): Promise<string[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Dynamically import XLSX library
        const XLSX = await import("xlsx");
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const data = event.target?.result as ArrayBuffer;
            const workbook = XLSX.read(data, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            const phoneNumbers: string[] = [];

            rows.forEach((row, rowIndex) => {
              if (Array.isArray(row)) {
                row.forEach((cell, colIndex) => {
                  const cellValue = String(cell).trim();
                  if (cellValue && validatePhoneNumber(cellValue)) {
                    phoneNumbers.push(cellValue);
                  }
                });
              }
            });

            if (phoneNumbers.length === 0) {
              reject(new Error("No valid phone numbers found in Excel file"));
            } else {
              resolve([...new Set(phoneNumbers)]); // Remove duplicates
            }
          } catch (err: any) {
            reject(new Error("Failed to parse Excel: " + err.message));
          }
        };

        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };

        reader.readAsArrayBuffer(file);
      } catch (err: any) {
        reject(new Error("XLSX library not available: " + err.message));
      }
    });
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    try {
      const phoneNumbers = await parsePhoneNumbersFromFile(file);
      setManualPhoneNumbers((prev) => [...new Set([...prev, ...phoneNumbers])]);
      toast.success(`Imported ${phoneNumbers.length} phone number(s)`);
      event.target.value = ""; // Reset input
    } catch (err: any) {
      toast.error(err.message || "Failed to import phone numbers");
    } finally {
      setIsParsingFile(false);
    }
  };

  // Add single phone number
  const addPhoneNumber = () => {
    if (!phoneNumberInput.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    if (!validatePhoneNumber(phoneNumberInput)) {
      toast.error("Invalid phone number format");
      return;
    }

    if (manualPhoneNumbers.includes(phoneNumberInput)) {
      toast.warning("This phone number is already added");
      return;
    }

    setManualPhoneNumbers((prev) => [...prev, phoneNumberInput]);
    setPhoneNumberInput("");
    toast.success("Phone number added");
  };

  // Remove phone number
  const removePhoneNumber = (phone: string) => {
    setManualPhoneNumbers((prev) => prev.filter((p) => p !== phone));
  };

  // Retry function for fetching data
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
      setHistoryPage(1); // Reset to first page
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations for SMS history
  const sortedSmsHistory = useMemo(() => {
    // Sort by date descending (latest first)
    return [...smsHistory].sort((a, b) => {
      const dateA = new Date(b.sentAt).getTime();
      const dateB = new Date(a.sentAt).getTime();
      return dateA - dateB;
    });
  }, [smsHistory]);

  const totalPages = Math.ceil(sortedSmsHistory.length / itemsPerPage);
  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedSmsHistory.slice(startIndex, endIndex);
  }, [sortedSmsHistory, historyPage]);


  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk SMS</h1>
          <p className="text-muted-foreground mt-1">
            Error loading recipients
          </p>
        </div>
        <Card className="shadow-elegant">
          <CardContent className="flex justify-center items-center h-40 text-red-500">
            <div className="text-center">
              <p className="font-medium">Failed to load data</p>
              <p className="text-sm mt-1">{error}</p>
              <Button 
                className="mt-4" 
                onClick={retryFetchData}
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk SMS</h1>
        <p className="text-muted-foreground mt-1">
          Send messages to {safeBuildersLength} builders and{" "}
          {safeCustomersLength} customers
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="compose">
            <Send className="h-4 w-4 mr-2" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Message Composer */}
            <Card className="lg:col-span-1 shadow-elegant">
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>
                  Write your message to send to selected recipients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Message Content</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="resize-none"
                    disabled={isSending}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{message.length} characters</span>
                    <span>{Math.ceil(message.length / 160)} SMS</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium">
                      {totalSelectedRecipients} recipient
                      {totalSelectedRecipients !== 1 ? "s" : ""} selected
                    </span>
                    {selectedBuilders.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Building className="h-3 w-3" />
                        {selectedBuilders.length}
                      </Badge>
                    )}
                    {selectedCustomers.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <User className="h-3 w-3" />
                        {selectedCustomers.length}
                      </Badge>
                    )}
                  </div>
                  <Button
                    className="bg-blue-800 hover:bg-blue-900 text-primary-foreground"
                    disabled={
                      totalSelectedRecipients === 0 ||
                      !message.trim() ||
                      isSending
                    }
                    onClick={sendSMS}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send SMS
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recipients Selection */}
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recipients</CardTitle>
                    <CardDescription>
                      Select who will receive the message
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    <Filter className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipient Type Tabs */}
                <Tabs
                  value={activeRecipientTab}
                  onValueChange={setActiveRecipientTab}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="builders"
                      className="flex items-center gap-2"
                    >
                      <Building className="h-4 w-4" />
                      Builders ({safeBuildersLength})
                    </TabsTrigger>
                    <TabsTrigger
                      value="customers"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Customers ({safeCustomersLength})
                    </TabsTrigger>
                    <TabsTrigger
                      value="phone"
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Phone Numbers ({manualPhoneNumbers.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Builders Tab */}
                  <TabsContent value="builders" className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Search Builders</Label>
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, skills, or email..."
                            value={builderSearch}
                            onChange={(e) => setBuilderSearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Builder Type</Label>
                          <Select
                            value={builderTypeFilter}
                            onValueChange={setBuilderTypeFilter}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              {builderTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>County</Label>
                          <Select
                            value={builderCountyFilter}
                            onValueChange={setBuilderCountyFilter}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Counties</SelectItem>
                              {builderCounties.map((county) => (
                                <SelectItem key={county} value={county}>
                                  {county}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                        className="flex-1"
                        disabled={filteredBuilders.length === 0}
                      >
                        Select All ({filteredBuilders.length})
                      </Button>
                     
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAll}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                      {filteredBuilders.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          {builders && builders.length === 0
                            ? "No builders available"
                            : "No builders match your filters"}
                        </div>
                      ) : (
                        filteredBuilders.map((builder) => (
                          <div
                            key={builder.id}
                            className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
                          >
                            <Checkbox
                              id={`builder-${builder.id}`}
                              checked={selectedBuilders.includes(builder.id)}
                              onCheckedChange={() => toggleBuilder(builder.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`builder-${builder.id}`}
                                className="text-sm font-medium cursor-pointer block truncate"
                              >
                                {getBuilderName(builder)}
                              </label>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Phone className="h-3 w-3" />
                                {builder.phoneNumber || "No phone"}
                              </div>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {builder.user_type || "Unknown"}
                                </Badge>
                                {builder.skills && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {builder.skills}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Customers Tab */}
                  <TabsContent value="customers" className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Search Customers</Label>
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name or email..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Account Type</Label>
                          <Select
                            value={customerTypeFilter}
                            onValueChange={setCustomerTypeFilter}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="INDIVIDUAL">
                                Individual
                              </SelectItem>
                              <SelectItem value="ORGANIZATION">
                                Organization
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>County</Label>
                          <Select
                            value={customerCountyFilter}
                            onValueChange={setCustomerCountyFilter}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Counties</SelectItem>
                              {customerCounties.map((county) => (
                                <SelectItem key={county} value={county}>
                                  {county}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                        className="flex-1"
                        disabled={filteredCustomers.length === 0}
                      >
                        Select All ({filteredCustomers.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAll}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                      {filteredCustomers.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          {customers && customers.length === 0
                            ? "No customers available"
                            : "No customers match your filters"}
                        </div>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
                          >
                            <Checkbox
                              id={`customer-${customer.id}`}
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={() =>
                                toggleCustomer(customer.id)
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`customer-${customer.id}`}
                                className="text-sm font-medium cursor-pointer block truncate"
                              >
                                {getCustomerName(customer)}
                              </label>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Phone className="h-3 w-3" />
                                {customer.phoneNumber || "No phone"}
                              </div>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {customer.accountType || "Unknown"}
                                </Badge>
                                {customer.county && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {customer.county}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Phone Numbers Tab */}
                  <TabsContent value="phone" className="space-y-4">
                    <div className="space-y-4">
                      {/* File Upload Section */}
                      <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-primary" />
                          <Label htmlFor="file-upload" className="font-semibold">Import from File</Label>
                        </div>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv,.xls,.xlsx"
                          onChange={handleFileUpload}
                          disabled={isParsingFile}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                          📄 Supported formats: CSV, XLS, XLSX. Phone numbers can be in any column.
                        </p>
                      </div>

                      {/* Manual Entry Section */}
                      <div className="space-y-2">
                        <Label htmlFor="phone-input" className="font-semibold flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Add Manually
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="phone-input"
                            placeholder="Enter phone number (e.g., 254712345678 or 0712345678)"
                            value={phoneNumberInput}
                            onChange={(e) => setPhoneNumberInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                addPhoneNumber();
                              }
                            }}
                            disabled={isParsingFile}
                            className="text-sm"
                          />
                          <Button
                            onClick={addPhoneNumber}
                            disabled={!phoneNumberInput.trim() || isParsingFile}
                            size="sm"
                            className="whitespace-nowrap bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4" />
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Phone Numbers List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Added Phone Numbers</Label>
                          {manualPhoneNumbers.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {manualPhoneNumbers.length}
                            </Badge>
                          )}
                        </div>
                        
                        {manualPhoneNumbers.length === 0 ? (
                          <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg bg-muted/20">
                            <Phone className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm text-muted-foreground">No phone numbers added yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Import from file or enter manually above</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-3 bg-white">
                            {manualPhoneNumbers.map((phone, index) => (
                              <div
                                key={`${phone}-${index}`}
                                className="flex items-center justify-between gap-3 p-3 rounded-md bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 transition-colors border border-blue-100 group"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-xs font-semibold text-muted-foreground bg-muted rounded px-2 py-1">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm font-medium truncate text-blue-900">
                                    {phone}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePhoneNumber(phone)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {manualPhoneNumbers.length > 0 && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setManualPhoneNumbers([])}
                            className="flex-1"
                          >
                            Clear All ({manualPhoneNumbers.length})
                          </Button>
                          <div className="text-xs text-muted-foreground flex items-center px-3 py-2 bg-green-50 rounded-md border border-green-200">
                            ✓ {manualPhoneNumbers.length} number{manualPhoneNumbers.length !== 1 ? 's' : ''} ready
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>SMS History</CardTitle>
              <CardDescription>View all your sent bulk SMS messages</CardDescription>
            </CardHeader>
            <CardContent>
              {smsHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No SMS history yet</p>
                  <p className="text-sm">
                    Start sending bulk SMS messages to see them appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="font-semibold">Message</TableHead>
                          <TableHead className="text-right font-semibold">Recipients</TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="text-center font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Sent Date</TableHead>
                          <TableHead className="text-right w-12">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedHistory.map((item) => (
                          <TableRow 
                            key={item.id} 
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => viewHistoryDetails(item)}
                          >
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="font-medium text-sm truncate">{item.messagePreview}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.metadata?.characterCount} chars ({item.metadata?.smsCount} SMS)
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">{item.recipients}</div>
                              <div className="text-xs text-muted-foreground space-x-1">
                                {item.builderCount > 0 && <span>{item.builderCount} builders</span>}
                                {item.builderCount > 0 && item.customerCount > 0 && <span>•</span>}
                                {item.customerCount > 0 && <span>{item.customerCount} customers</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-xs">
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={`capitalize text-xs font-medium ${
                                  item.status === "sent"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : item.status === "failed"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    : item.status === "partial"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                }`}
                              >
                                {item.status}
                              </Badge>
                              {item.metadata?.failedCount > 0 && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  {item.metadata.failedCount} failed
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{item.date}</TableCell>
                            <TableCell className="text-right">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-2 py-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold">{(historyPage - 1) * itemsPerPage + 1}</span> to{" "}
                        <span className="font-semibold">{Math.min(historyPage * itemsPerPage, sortedSmsHistory.length)}</span> of{" "}
                        <span className="font-semibold">{sortedSmsHistory.length}</span> messages
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                          disabled={historyPage === 1}
                        >
                          ← Previous
                        </Button>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={historyPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setHistoryPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={historyPage === totalPages}
                        >
                          Next →
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS Details Sheet */}
          <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <SheetContent className="w-full sm:w-[700px] pl-4 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>SMS Details</SheetTitle>
                <SheetDescription>
                  Full details of the sent bulk SMS message
                </SheetDescription>
              </SheetHeader>

              {selectedHistoryItem && (
                <div className="space-y-6 py-6">
                  {/* Message Content */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Full Message</h3>
                    <div className="bg-muted p-2 rounded-lg border">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {selectedHistoryItem.message}
                      </p>
                    </div>
                  </div>

                  {/* Message Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Character Count</p>
                      <p className="text-lg font-semibold">
                        {selectedHistoryItem.metadata?.characterCount}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">SMS Parts</p>
                      <p className="text-lg font-semibold">
                        {selectedHistoryItem.metadata?.smsCount}
                      </p>
                    </div>
                     
                  </div>

                  {/* Recipients Summary */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Recipients</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="p-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-2xl font-bold">{selectedHistoryItem.recipients}</p>
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Builders</p>
                          <p className="text-2xl font-bold">{selectedHistoryItem.builderCount}</p>
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Customers</p>
                          <p className="text-2xl font-bold">{selectedHistoryItem.customerCount}</p>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Status and Timing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Status</p>
                      <Badge
                        className={`capitalize w-fit ${
                          selectedHistoryItem.status === "sent"
                            ? "bg-green-600"
                            : selectedHistoryItem.status === "failed"
                            ? "bg-red-600"
                            : selectedHistoryItem.status === "partial"
                            ? "bg-yellow-600"
                            : "bg-blue-600"
                        }`}
                      >
                        {selectedHistoryItem.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Sent Date</p>
                      <p className="text-sm font-medium">{selectedHistoryItem.date}</p>
                    </div>
                  </div>

                  {/* Failed Count */}
                  {selectedHistoryItem.metadata?.failedCount > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {selectedHistoryItem.metadata.failedCount} recipient
                        {selectedHistoryItem.metadata.failedCount !== 1 ? "s" : ""} failed to receive SMS
                      </p>
                    </div>
                  )}

                  {/* Recipient Type */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Recipient Type</p>
                    <Badge variant="secondary" className="capitalize w-fit">
                      {selectedHistoryItem.type}
                    </Badge>
                  </div>

                  {/* Recipients List */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Recipients List</h3>
                      <Badge variant="outline" className="text-xs">
                        {selectedHistoryItem.recipientsList?.length || selectedHistoryItem.recipients} total
                      </Badge>
                    </div>

                    {selectedHistoryItem.recipientsList && selectedHistoryItem.recipientsList.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                        {selectedHistoryItem.recipientsList.map((recipient, index) => (
                          <div
                            key={`${recipient.phoneNumber}-${index}`}
                            className="flex items-start justify-between gap-3 p-3 rounded-md bg-white border border-gray-200 dark:bg-slate-900 dark:border-slate-700 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                                  {recipient.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize flex-shrink-0"
                                >
                                  {recipient.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span className="font-mono">{recipient.phoneNumber}</span>
                              </div>
                              {recipient.email && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {recipient.email}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {recipient.status === "sent" ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs capitalize">
                                  ✓ {recipient.status}
                                </Badge>
                              ) : recipient.status === "failed" ? (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs capitalize">
                                  ✗ {recipient.status}
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs capitalize">
                                  ⏱ {recipient.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg bg-muted/20">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm text-muted-foreground">Recipient details not available</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedHistoryItem.recipients} {selectedHistoryItem.recipients === 1 ? "person" : "people"} received this message
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Wrapper component to catch errors during render
const ErrorBoundary = () => {
  try {
    return <BulkSMS />;
  } catch (err) {
    console.error("Error rendering BulkSMS component:", err);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk SMS</h1>
          <p className="text-muted-foreground mt-1">Error</p>
        </div>
        <Card>
          <CardContent className="flex justify-center items-center h-40 text-red-500">
            <div className="text-center">
              <p className="font-medium">Failed to load component</p>
              <p className="text-sm mt-1">{(err as any)?.message || "An unexpected error occurred"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default function BulkSMSWrapper() {
  return (
    <>
      <ErrorBoundary />
      <Toaster />
    </>
  );
}