import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import React, { Suspense } from "react";
import RouteLoading from "@/components/RouteLoading";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import { GlobalProvider } from "@/context/GlobalProvider";
import { RolePermissionProvider } from "@/context/RolePermissionProvider";
import Unauthorized from "@/pages/Unauthorized.js";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import NotFound from "@/pages/NotFound.js";
import TermsOfService from "@/pages/TermsOfService"
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import DetailReceiptPage from "@/pages/DetailReceiptPage"

// Page Imports
const Home = React.lazy(() => import("@/pages/Home"));
const AboutUs = React.lazy(() => import("./pages/About"));
const Login = React.lazy(() => import("@/pages/login"));
const ForgotPassword = React.lazy(() => import("@/pages/ForgotPassword"));
const ResetToken = React.lazy(() => import("@/pages/ResetToken"));

// Signup Pages
const CustomerSignup = React.lazy(
    () => import("@/pages/signup/customer/index")
);
const FundiSignup = React.lazy(() => import("@/pages/signup/fundi"));
const ContractorSignup = React.lazy(() => import("@/pages/signup/contractor"));
const HardwareSignup = React.lazy(() => import("@/pages/signup/hardware"));
const ProfessionalSignup = React.lazy(
    () => import("@/pages/signup/professional")
);

// Dashboard Entry Points
const CustomerDashboard = React.lazy(
    () => import("@/pages/dashboard/customer")
);
const FundiDashboard = React.lazy(() => import("@/pages/dashboard/fundi"));
const ProfessionalDashboard = React.lazy(
    () => import("@/pages/dashboard/professional")
);
const HardwareDashboard = React.lazy(
    () => import("@/pages/dashboard/hardware")
);
const ContractorDashboard = React.lazy(
    () => import("@/pages/dashboard/contractor")
);
const AdminRootLayout = React.lazy(
    () => import("@/pages/dashboard/admin/AdminRootLayout")
);

// Shared Components
const Profile = React.lazy(() => import("./pages/profile"));
const Profile2 = React.lazy(
    () => import("./pages/dashboard/profile/ProfileApp")
);
const Sales = React.lazy(() => import("@/pages/Sales/Sales"));

// Customer Specific Pages
const ShopApp = React.lazy(() => import("@/pages/Shop/ShopApp"));
const CustomerNewJobRequestDetails = React.lazy(
    () => import("@/pages/dashboard/customer/New/jobs/index")
);
const CustomerDraftJobRequestDetails = React.lazy(
    () => import("@/pages/dashboard/customer/Draft/jobs/index")
);
const CustomerBidsJobRequestDetails = React.lazy(
    () => import("@/pages/dashboard/customer/Bid/jobs/index")
);
const ActiveCustomerJobsPageContainer = React.lazy(
    () => import("@/pages/dashboard/customer/Active/jobs/index")
);
const PastJobPageContainer = React.lazy(
    () => import("@/pages/dashboard/customer/Complete/jobs/index")
);
const NewCustomerOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/customer/New/orders/index")
);
const DraftCustomerOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/customer/Draft/orders/index")
);
const BidsCustomerOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/customer/Bid/orders/index")
);
const ActiveCustomerOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/customer/Active/orders/index")
);
const PastCustomerOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/customer/Complete/orders/index")
);
const CheckoutPage = React.lazy(
    () => import("@/pages/dashboard/customer/cart/checkout")
);
const CartPage = React.lazy(
    () => import("@/pages/dashboard/customer/cart/mycart")
);

// Fundi Specific Pages
const JobRequestDetails = React.lazy(
    () => import("@/pages/dashboard/fundi/New/jobs/BidInvitation")
);
const ActiveJobPageContainer = React.lazy(
    () => import("@/pages/dashboard/fundi/Active/jobs/index")
);
const PastJobsPageContainer = React.lazy(
    () => import("@/pages/dashboard/fundi/Complete/jobs/index")
);
const NewOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/fundi/New/orders/index")
);
const DraftOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/fundi/Draft/orders/index")
);
const BidsOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/fundi/Bid/orders/index")
);
const ActiveOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/fundi/Active/orders/index")
);
const PastOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/fundi/Complete/orders/index")
);

// Professional Specific Pages
const JobProffRequestDetails = React.lazy(
    () => import("@/pages/dashboard/professional/New/jobs/BidInvitation")
);
const BidProffPageContainer = React.lazy(
    () => import("@/pages/dashboard/professional/Bid/jobs/index")
);
const ActiveProffJobsPageContainer = React.lazy(
    () => import("@/pages/dashboard/professional/Active/jobs/index")
);
const PastProffJobsPageContainer = React.lazy(
    () => import("@/pages/dashboard/professional/Complete/jobs/index")
);
const DraftJobProffRequestDetails = React.lazy(
    () => import("@/pages/dashboard/professional/Draft/jobs/index")
);
const NewProffOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/professional/New/orders/index")
);
const DraftProffPageContainer = React.lazy(
    () => import("@/pages/dashboard/professional/Draft/orders/index")
);
const ProffBidsOrdersPageContainer = React.lazy(
    () => import("@/pages/dashboard/professional/Bid/orders/index")
);
const ProffActiveOrdersPageContainer = React.lazy(
    () => import("@/pages/dashboard/professional/Active/orders/index")
);
const PastProffOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/professional/Complete/orders/index")
);

const Receipts = React.lazy(
    () => import("@/pages/dashboard/customer/receipts")
);

// Contractor Specific Pages
const JobContractorRequestDetails = React.lazy(
    () => import("@/pages/dashboard/contractor/New/jobs/BidInvitation")
);
const BidJobPageContainer = React.lazy(
    () => import("@/pages/dashboard/contractor/Bid/jobs/index")
);
const ActiveContractorJobsPageContainer = React.lazy(
    () => import("@/pages/dashboard/contractor/Active/jobs/index")
);
const PastContractorJobsPageContainer = React.lazy(
    () => import("@/pages/dashboard/contractor/Complete/jobs/index")
);
const DraftJobContractorRequestDetails = React.lazy(
    () => import("@/pages/dashboard/contractor/Draft/jobs/index")
);
const NewContractorOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/contractor/New/orders/index")
);
const DraftContractorPageContainer = React.lazy(
    () => import("@/pages/dashboard/contractor/Draft/orders/index")
);
const ContractorBidsOrdersPageContainer = React.lazy(
    () => import("@/pages/dashboard/contractor/Bid/orders/index")
);
const ContractorActiveOrdersPageContainer = React.lazy(
    () => import("@/pages/dashboard/contractor/Active/orders/index")
);
const PastContractorOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/contractor/Complete/orders/index")
);

// Hardware Specific Pages
const NewHardwareOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/hardware/New/orders/index")
);
const DraftHardwarePageContainer = React.lazy(
    () => import("@/pages/dashboard/hardware/Draft/orders/index")
);
const HardwareQuotationsOrdersPageContainer = React.lazy(
    () => import("@/pages/dashboard/hardware/Quotations/orders/index")
);
const HardwareActiveOrdersPageContainer = React.lazy(
    () => import("@/pages/dashboard/hardware/Active/orders/index")
);
const PastHardwareOrderPageContainer = React.lazy(
    () => import("@/pages/dashboard/hardware/Complete/orders/index")
);

// Admin Shop Pages
const ShopProducts = React.lazy(
    () => import("@/pages/dashboard/admin/shop/products")
);
const ShopCustomerView = React.lazy(
    () => import("@/pages/dashboard/admin/shop/customer-view")
);
const ShopCategories = React.lazy(
    () => import("@/pages/dashboard/admin/shop/categories")
);
const ShopAttributes = React.lazy(
    () => import("@/pages/dashboard/admin/shop/attributes")
);
const ShopRegions = React.lazy(
    () => import("@/pages/dashboard/admin/shop/regions")
);
const ShopPrices = React.lazy(
    () => import("@/pages/dashboard/admin/shop/prices")
);

const BillDetails = React.lazy(
    () => import("@/components/PastActiveContractorJobsComponent/progresscomponents/BillDetails")
);

const ProgressComponent = React.lazy(
    () => import("@/components/PastActiveContractorJobsComponent/progresscomponents/ProgressComponent")
);

const BidAwarded = React.lazy(
    () => import("@/pages/dashboard/customer/Bid/jobs/awarded")
);

const BuilderConfiguration = React.lazy(
    () => import("@/pages/dashboard/admin/BuildersConfigurations")
);

const ProtectedRoutesLayout = () => (
    <Outlet />
);

function App() {
    return (
        <Router>
            <GlobalProvider>
                <RolePermissionProvider>
                    <CartProvider>
                        <Suspense fallback={<RouteLoading />}>
                            <Routes>
                                {/* ========================================================== */}
                                {/* PUBLIC ROUTES                                            */}
                                {/* ========================================================== */}
                                <Route path="/" element={<Home />} />
                                <Route path="/about-us" element={<AboutUs />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/receipts/:id" element={<DetailReceiptPage />} />
                                <Route path="/termsOfService" element={<TermsOfService />} />
                                <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
                                <Route
                                    path="/forgot-password"
                                    element={<ForgotPassword />}
                                />
                                <Route
                                    path="/reset-password"
                                    element={<ResetToken />}
                                />
                                <Route
                                    path="/customer/hardware_shop"
                                    element={<ShopApp />}
                                />
                                <Route
                                    path="/products"
                                    element={<ShopApp />}
                                />
                                <Route
                                    path="/customer/cart"
                                    element={<CartPage />}
                                />

                                {/* SIGN UP ROUTES */}
                                <Route
                                    path="/signup/customer"
                                    element={<CustomerSignup />}
                                />
                                <Route
                                    path="/signup/fundi"
                                    element={<FundiSignup />}
                                />
                                <Route
                                    path="/signup/contractor"
                                    element={<ContractorSignup />}
                                />
                                <Route
                                    path="/signup/hardware"
                                    element={<HardwareSignup />}
                                />
                                <Route
                                    path="/signup/professional"
                                    element={<ProfessionalSignup />}
                                />

                                <Route element={<ProtectedRoutesLayout />}>
                                    {/* ========================================================== */}
                                    {/* SHARED PROTECTED ROUTES                                  */}
                                    {/* ========================================================== */}

                                    {/* --- Profile Route (accessible by any logged-in user) --- */}
                                    <Route
                                        element={<ProtectedRoute allowedRoles={[]} />}
                                    >
                                        <Route path="/profile" element={<Profile />} />
                                        <Route
                                            path="/dashboard/profile/:id/:role"
                                            element={<Profile2 />}
                                        />
                                    </Route>

                                    {/* --- Sales Route (grouped by admin approval requirement) --- */}
                                    <Route
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    "FUNDI",
                                                    "PROFESSIONAL",
                                                    "CONTRACTOR",
                                                    "HARDWARE"
                                                ]}
                                                requireAdminApproved={true}
                                            />
                                        }
                                    >
                                        <Route
                                            path="/dashboard/sales"
                                            element={<Sales />}
                                        />
                                    </Route>

                                    {/* ========================================================== */}
                                    {/* ROLE-SPECIFIC DASHBOARD ROUTES                           */}
                                    {/* ========================================================== */}

                                    {/* --- CUSTOMER DASHBOARD --- */}
                                    <Route
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={["CUSTOMER"]}
                                            />
                                        }
                                    >
                                        <Route
                                            path="/dashboard/customer"
                                            element={<CustomerDashboard />}
                                        />
                                        <Route
                                            path="/customer/receipts"
                                            element={<Receipts />}
                                        />
                                        <Route
                                            path="/customer/checkout"
                                            element={<CheckoutPage />}
                                        />

                                        <Route
                                            path="/customer/new/job/:id"
                                            element={<CustomerNewJobRequestDetails />}
                                        />
                                        <Route
                                            path="/customer/draft/job/:id"
                                            element={<CustomerDraftJobRequestDetails />}
                                        />
                                        <Route
                                            path="/customer/bid/job/:id"
                                            element={<CustomerBidsJobRequestDetails />}
                                        />
                                        <Route
                                            path="/customer/active/job/:id"
                                            element={
                                                <ActiveCustomerJobsPageContainer />
                                            }
                                        />
                                        <Route
                                            path="/customer/complete/job/:id"
                                            element={<PastJobPageContainer />}
                                        />
                                        <Route
                                            path="/customer/new/order/:id"
                                            element={<NewCustomerOrderPageContainer />}
                                        />
                                        <Route
                                            path="/customer/draft/order/:id"
                                            element={
                                                <DraftCustomerOrderPageContainer />
                                            }
                                        />
                                        <Route
                                            path="/customer/bid/order/:id"
                                            element={<BidsCustomerOrderPageContainer />}
                                        />
                                        <Route
                                            path="/customer/active/order/:id"
                                            element={
                                                <ActiveCustomerOrderPageContainer />
                                            }
                                        />
                                        <Route
                                            path="/customer/complete/order/:id"
                                            element={<PastCustomerOrderPageContainer />}
                                        />
                                        <Route
                                            path="/customer/bid/job/:id/bid_awarded"
                                            element={<BidAwarded />}
                                        />
                                    </Route>

                                    {/* --- FUNDI DASHBOARD --- */}
                                    <Route
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={["FUNDI"]}
                                                requireAdminApproved={true}
                                            />
                                        }
                                    >
                                        <Route
                                            path="/dashboard/fundi"
                                            element={<FundiDashboard />}
                                        />
                                        <Route
                                            path="/fundi-portal/new/job/:id"
                                            element={<JobRequestDetails />}
                                        />
                                        <Route
                                            path="/fundi-portal/active/job/:id"
                                            element={<ActiveJobPageContainer />}
                                        />
                                        <Route
                                            path="/fundi-portal/complete/job/:id"
                                            element={<PastJobsPageContainer />}
                                        />
                                        <Route
                                            path="/fundi-portal/new/order/:id"
                                            element={<NewOrderPageContainer />}
                                        />
                                        <Route
                                            path="/fundi-portal/draft/order/:id"
                                            element={<DraftOrderPageContainer />}
                                        />
                                        <Route
                                            path="/fundi-portal/bid/order/:id"
                                            element={<BidsOrderPageContainer />}
                                        />
                                        <Route
                                            path="/fundi-portal/active/order/:id"
                                            element={<ActiveOrderPageContainer />}
                                        />
                                        <Route
                                            path="/fundi-portal/complete/order/:id"
                                            element={<PastOrderPageContainer />}
                                        />
                                    </Route>

                                    {/* --- PROFESSIONAL DASHBOARD --- */}
                                    <Route
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={["PROFESSIONAL"]}
                                                requireAdminApproved={true}
                                            />
                                        }
                                    >
                                        <Route
                                            path="/dashboard/professional"
                                            element={<ProfessionalDashboard />}
                                        />
                                        <Route
                                            path="/professional/new/job/:id"
                                            element={<JobProffRequestDetails />}
                                        />
                                        <Route
                                            path="/professional/bid/job/:id"
                                            element={<BidProffPageContainer />}
                                        />
                                        <Route
                                            path="/professional/active/job/:id"
                                            element={<ActiveProffJobsPageContainer />}
                                        />
                                        <Route
                                            path="/professional/complete/job/:id"
                                            element={<PastProffJobsPageContainer />}
                                        />
                                        <Route
                                            path="/professional/draft/job/:id"
                                            element={<DraftJobProffRequestDetails />}
                                        />
                                        <Route
                                            path="/professional/new/order/:id"
                                            element={<NewProffOrderPageContainer />}
                                        />
                                        <Route
                                            path="/professional/draft/order/:id"
                                            element={<DraftProffPageContainer />}
                                        />
                                        <Route
                                            path="/professional/bid/order/:id"
                                            element={<ProffBidsOrdersPageContainer />}
                                        />
                                        <Route
                                            path="/professional/active/order/:id"
                                            element={<ProffActiveOrdersPageContainer />}
                                        />
                                        <Route
                                            path="/professional/complete/order/:id"
                                            element={<PastProffOrderPageContainer />}
                                        />
                                    </Route>

                                    {/* --- HARDWARE DASHBOARD --- */}
                                    <Route
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={["HARDWARE"]}
                                                requireAdminApproved={true}
                                            />
                                        }
                                    >
                                        <Route
                                            path="/dashboard/hardware"
                                            element={<HardwareDashboard />}
                                        />
                                        <Route
                                            path="/hardware/new/order/:id"
                                            element={<NewHardwareOrderPageContainer />}
                                        />
                                        <Route
                                            path="/hardware/draft/order/:id"
                                            element={<DraftHardwarePageContainer />}
                                        />
                                        <Route
                                            path="/hardware/quotations/order/:id"
                                            element={
                                                <HardwareQuotationsOrdersPageContainer />
                                            }
                                        />
                                        <Route
                                            path="/hardware/active/order/:id"
                                            element={
                                                <HardwareActiveOrdersPageContainer />
                                            }
                                        />
                                        <Route
                                            path="/hardware/complete/order/:id"
                                            element={<PastHardwareOrderPageContainer />}
                                        />
                                    </Route>

                                    {/* --- CONTRACTOR DASHBOARD --- */}
                                    <Route
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={["CONTRACTOR"]}
                                                requireAdminApproved={true}
                                            />
                                        }
                                    >
                                        <Route
                                            path="/dashboard/contractor"
                                            element={<ContractorDashboard />}
                                        />
                                        <Route
                                            path="/contractor/new/job/:id"
                                            element={<JobContractorRequestDetails />}
                                        />
                                        <Route
                                            path="/contractor/bid/job/:id"
                                            element={<BidJobPageContainer />}
                                        />
                                        <Route
                                            path="/contractor/active/job/:id"
                                            element={
                                                <ActiveContractorJobsPageContainer />
                                            }
                                        />
                                        <Route
                                            path="/contractor/complete/job/:id"
                                            element={
                                                <PastContractorJobsPageContainer />
                                            }
                                        />
                                        <Route
                                            path="/contractor/draft/job/:id"
                                            element={
                                                <DraftJobContractorRequestDetails />
                                            }
                                        />
                                        <Route
                                            path="/contractor/new/order/:id"
                                            element={
                                                <NewContractorOrderPageContainer />
                                            }
                                        />
                                        <Route
                                            path="/contractor/draft/order/:id"
                                            element={<DraftContractorPageContainer />}
                                        />
                                        <Route
                                            path="/contractor/bid/order/:id"
                                            element={
                                                <ContractorBidsOrdersPageContainer />
                                            }
                                        />
                                        <Route
                                            path="/contractor/active/order/:id"
                                            element={
                                                <ContractorActiveOrdersPageContainer />
                                            }
                                        />
                                        <Route
                                            path="/contractor/complete/order/:id"
                                            element={
                                                <PastContractorOrderPageContainer />
                                            }
                                        />
                                    </Route>
                                    {/* */}
                                    <Route
                                        element={
                                            <ProtectedRoute allowedRoles={["CONTRACTOR", "PROFESSIONAL", "CUSTOMER", "ADMIN"]} />
                                        }
                                    >
                                        <Route path="/job-progress/:id/:milestoneId" element={<ProgressComponent />} />
                                        <Route path="/bill-details/:id/:billid" element={<BillDetails />} />
                                    </Route>

                                    {/* --- ADMIN DASHBOARD WITH PERMISSION CHECKS --- */}
                                    <Route
                                        element={
                                            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]} />
                                        }
                                    >
                                        <Route
                                            path="/dashboard/admin"
                                            element={<AdminRootLayout />}
                                        >
                                            {/* Home - Home Menu */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="home" />}
                                            >
                                                <Route
                                                    index
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/index"
                                                                )
                                                        )
                                                    )}
                                                />
                                            </Route>

                                            {/* Analytics */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="analytics" />}
                                            >
                                                <Route
                                                    path="analytics"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/Analytics"
                                                                )
                                                        )
                                                    )}
                                                />
                                            </Route>

                                            {/* User Management */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="user-management" />}
                                            >
                                                <Route
                                                    path="user-management"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/users-management"
                                                                )
                                                        )
                                                    )}
                                                />
                                            </Route>

                                            {/* Bulk SMS */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="bulk-sms" />}
                                            >
                                                <Route
                                                    path="bulk-sms"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/bulk-sms"
                                                                )
                                                        )
                                                    )}
                                                />
                                            </Route>

                                            {/* Jobs Management */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="jobs" />}
                                            >
                                                <Route
                                                    path="jobs"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/jobs"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="jobs/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/job-detail"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="jobs/active/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/fundi/Active/jobs/index"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="professional/active/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/professional/Active/jobs/index"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="jobs/fundi/complete/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/fundi/Complete/jobs/index"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="jobs/bid/complete/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/professional/Complete/jobs/index"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="jobs/bid/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/bid"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="jobs/quote/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/quoteBreakdown"
                                                                )
                                                        )
                                                    )}
                                                />
                                            </Route>

                                            {/* Orders Management */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="orders" />}
                                            >
                                                <Route
                                                    path="orders"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/orders"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="orders/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/order-detail"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="orders/active/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/orders/Active/orders/index"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="orders/bid/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/orders/Bid/orders/index"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="orders/complete/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/orders/Complete/orders/index"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="orders/draft/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/orders/Draft/orders/index"
                                                                )
                                                        )
                                                    )}
                                                />
                                                <Route
                                                    path="orders/new/:id"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/order-detail"
                                                                )
                                                        )
                                                    )}
                                                />
                                            </Route>

                                            {/* Shop Products */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="shop-products" />}
                                            >
                                                <Route
                                                    path="shop/products"
                                                    element={<ShopProducts />}
                                                />
                                            </Route>

                                            {/* Shop Customer View */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="shop-customer-view" />}
                                            >
                                                <Route
                                                    path="shop/customer-view"
                                                    element={<ShopCustomerView />}
                                                />
                                            </Route>

                                            {/* Shop Categories */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="shop-categories" />}
                                            >
                                                <Route
                                                    path="shop/categories"
                                                    element={<ShopCategories />}
                                                />
                                            </Route>

                                            {/* Shop Attributes */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="shop-attributes" />}
                                            >
                                                <Route
                                                    path="shop/attributes"
                                                    element={<ShopAttributes />}
                                                />
                                            </Route>

                                            {/* Shop Regions */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="shop-regions" />}
                                            >
                                                <Route
                                                    path="shop/regions"
                                                    element={<ShopRegions />}
                                                />
                                            </Route>

                                            {/* Shop Prices */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="shop-prices" />}
                                            >
                                                <Route
                                                    path="shop/prices"
                                                    element={<ShopPrices />}
                                                />
                                            </Route>

                                            {/* Builder Configuration */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="configuration" />}
                                            >
                                                <Route
                                                    path="configuration"
                                                    element={<BuilderConfiguration />}
                                                />
                                            </Route>

                                            {/* Builder Registers */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="registers-builders" />}
                                            >
                                                <Route
                                                    path="builders"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/registers/builders"
                                                                )
                                                        )
                                                    )}
                                                />
                                            </Route>

                                            {/* Customer Registers */}
                                            <Route
                                                element={<ProtectedAdminRoute requiredMenu="registers-customers" />}
                                            >
                                                <Route
                                                    path="customers"
                                                    element={React.createElement(
                                                        React.lazy(
                                                            () =>
                                                                import(
                                                                    "@/pages/dashboard/admin/registers/customers"
                                                                )
                                                        )
                                                    )}
                                                />
                                            </Route>

                                            {/* Remaining legacy routes - kept for backwards compatibility */}
                                            <Route
                                                path="register"
                                                element={React.createElement(
                                                    React.lazy(
                                                        () =>
                                                            import(
                                                                "@/pages/dashboard/admin/register"
                                                            )
                                                    )
                                                )}
                                            />
                                            <Route
                                                path="settings"
                                                element={React.createElement(
                                                    React.lazy(
                                                        () =>
                                                            import(
                                                                "@/pages/dashboard/admin/settings"
                                                            )
                                                    )
                                                )}
                                            />
                                        </Route>
                                    </Route>
                                </Route>

                                {/* ========================================================== */}
                                {/* FALLBACK ROUTES                                          */}
                                {/* ========================================================== */}
                                <Route path="/403" element={<Unauthorized />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                        <Toaster
                            position="top-center"
                            reverseOrder={false}
                            gutter={8}
                            containerStyle={{ zIndex: 9999 }}
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: "#363636",
                                    color: "#fff",
                                    zIndex: 9999,
                                    maxWidth: "500px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis"
                                },
                                success: {
                                    style: { background: "#10b981", color: "#fff" }
                                },
                                error: {
                                    style: { background: "#ef4444", color: "#fff" }
                                },
                                loading: {
                                    duration: Infinity
                                }
                            }}
                        />
                    </CartProvider>
                </RolePermissionProvider>
            </GlobalProvider>
        </Router >
    );
}

export default App;
