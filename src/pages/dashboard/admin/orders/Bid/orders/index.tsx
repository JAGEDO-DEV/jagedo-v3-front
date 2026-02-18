//@ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft } from "react-icons/fa";
import GrandSummary from '@/components/FundiContractorCustomerSharedOrderComponents/Grand_Summary';
import ProductList from '@/components/FundiContractorCustomerSharedOrderComponents/ProductList';
import LeadTime from '@/components/FundiContractorCustomerSharedOrderComponents/Lead_Time';
import PaymentBreakdown from '@/components/FundiContractorCustomerSharedOrderComponents/Payment_Breakdown';
import Submissions from '@/components/FundiContractorCustomerSharedOrderComponents/Submissions';
import Specification from '@/components/FundiContractorCustomerSharedOrderComponents/Specification';
import Customer from '@/components/FundiContractorCustomerSharedOrderComponents/Customer';
import AcceptBid from '@/components/FundiContractorCustomerSharedOrderComponents/AcceptBid';
import Builder from '@/components/FundiContractorCustomerSharedOrderComponents/Builder';
import Bidders from '@/components/FundiContractorCustomerSharedOrderComponents/Bidders';
import { getOrderRequestsById } from "@/api/orderRequests.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import Loader from "@/components/Loader";
import { useGlobalContext } from "@/context/GlobalProvider";

export interface OrderData {
  type?: 'FUNDI' | 'PROFESSIONAL' | string; // Added type property
  customer?: {
    username: string;
    estate?: string;
  };
  items: {
    product: {
      id: number;
      name: string;
      category: string;
      images: string[];
    };
    productName: string;
    quantity: number;
    price: number;
  }[];
  createdAt?: string;
  deliveryConfirmedAt?: string;
  seller?: {
    username: string;
  };
  subTotal: number;
  deliveryFee: number;
  totalAmount: number;
  payments?: { id: string }[];
  notes?: string;
}

const allTabs = [
  { name: "Specification", component: Specification },
  { name: "Grand Summary", component: GrandSummary },
  { name: "Product List", component: ProductList },
  { name: "Payment Breakdown", component: PaymentBreakdown },
  { name: "Lead Time", component: LeadTime },
  { name: "Submissions", component: Submissions },
  { name: "Customer", component: Customer },
  { name: "Builder", component: Builder },
  { name: "Bidders", component: Bidders },
  { name: "Accept Bid", component: AcceptBid },
];

interface ActiveFundiNavProps {
  activeTab: string;
  onTabClick: (tabName: string) => void;
  tabs: typeof allTabs;
}

function ActiveFundiNav({ activeTab, onTabClick, tabs }: ActiveFundiNavProps) {
  return (
    <div className="border-b border-gray-400">
      <div className="flex justify-end space-x-6 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            type="button"
            onClick={() => onTabClick(tab.name)}
            className={`pb-1 font-medium focus:outline-none ${activeTab === tab.name
              ? "text-[rgb(0,0,122)] border-b-2 border-[rgb(0,0,122)]"
              : "text-gray-600 hover:text-[rgb(0,0,122)]"
              }`}
          >
            {tab.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function BidsOrderPageContainer() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const { user } = useGlobalContext();
  const [activeTab, setActiveTab] = useState(allTabs[0].name);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    const fetchOrderData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getOrderRequestsById(axiosInstance, id);
        if (response && response.success) {
          setOrderData(response.data);
        } else {
          throw new Error(response.message || "Failed to fetch order details.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        console.error("Error fetching order data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [id]);

  const displayedTabs = useMemo(() => {
    if (orderData?.type === 'FUNDI' || orderData?.type === 'PROFESSIONAL') {
      return allTabs.filter(tab => tab.name !== 'Accept Bid');
    }
    return allTabs;
  }, [orderData]);

  useEffect(() => {
    if (!displayedTabs.find(tab => tab.name === activeTab)) {
      setActiveTab(displayedTabs[0]?.name || '');
    }
  }, [displayedTabs, activeTab]);

  const handleBack = () => {
    navigate(-1);
  };

  const ActiveComponent = displayedTabs.find(tab => tab.name === activeTab)?.component;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      );
    }
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">
          <p>{error}</p>
        </div>
      );
    }
    if (orderData && ActiveComponent) {
      return <ActiveComponent orderData={orderData} user_type={user?.user_type} />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">
        <p>Could not load order data.</p>
      </div>
    );
  };

  return (
    <>
      <section className="container mx-auto mt-12">
        <header>
          <div className="border-b border-gray-400 flex justify-between items-center">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-800 transition-colors pr-4"
              aria-label="Go back"
            >
              <FaArrowLeft className="h-5 w-5" />
              <span className="font-semibold hidden sm:inline">Back</span>
            </button>
            <ActiveFundiNav
              activeTab={activeTab}
              onTabClick={setActiveTab}
              tabs={displayedTabs}
            />
          </div>
        </header>

        <main>
          {renderContent()}
        </main>
      </section>
    </>
  );
}

export default BidsOrderPageContainer;