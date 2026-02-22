//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import { useCart } from '@/context/CartContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { makeOrders } from '@/api/orderRequests.api';
import { Pencil } from 'lucide-react';
import ContactDetailsModal from './contactDetailsModal';
import DeliveryAddressModal from './deliveryAddressModal';
import { useGlobalContext } from "@/context/GlobalProvider";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

interface ContactDetails {
    name: string;
    phone: string;
    email: string;
}

interface DeliveryAddress {
    address: string;
}

const generatePagination = (currentPage: number, totalPages: number, siblingCount = 1): (number | '...')[] => {
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPages) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
        return [firstPageIndex, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
        let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
        return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }

    return [];
};


const CheckoutPage: React.FC = () => {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useGlobalContext();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const navigate = useNavigate();

    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactDetails, setContactDetails] = useState<ContactDetails>({
        name: `${user?.contactfirstName || ""} ${user?.contactlastName || ""}`.trim(),
        phone: user?.contactPhone,
        email: user?.contactEmail,
    });

    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
        address: `${user?.estate}, ${user?.subCounty}, ${user?.county}, ${user?.country}`,
    });


    const totalPages = Math.ceil(cartItems.length / itemsPerPage);
    const currentItems = cartItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const pageNumbers = generatePagination(currentPage, totalPages);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (cartItems.length === 0) {
                toast.error("Your cart is empty. Please add items before checking out.")
                navigate('/customer/hardware_shop');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [cartItems, navigate]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    if (cartItems.length === 0) {
        return null;
    }

    const handleConfirmOrder = async () => {
        if (!agreeToTerms) {
            toast.error("Please agree to the terms and conditions.");
            return;
        }

        if (!user) {
            toast.error("You must be logged in to place an order.");
            return;
        }

        setIsLoading(true);

        const orderPayload = {
            type: cartItems[0]?.type || 'UNKNOWN',
            orderItems: cartItems.map(item => ({
                productId: parseInt(item.id, 10),
                quantity: item.quantity,
                unitPrice: item.price
            })),
            subTotal: totalPrice,
            customerId: user.id,
            contactInfo: {
                name: contactDetails.name,
                phoneNumber: contactDetails.phone,
                email: contactDetails.email
            },
            details: {
                location: deliveryAddress.address
            }
        };

        try {
            await makeOrders(axiosInstance, orderPayload);
            toast.success("Order confirmed! Thank you for your purchase.");
            clearCart();
            navigate('/customer/hardware_shop');
        } catch (error) {
            console.error("Failed to create order:", error);
            toast.error("There was an error placing your order. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveContactDetails = (newDetails: ContactDetails) => {
        setContactDetails(newDetails);
        setIsContactModalOpen(false);
    };

    const handleSaveDeliveryAddress = (newAddress: DeliveryAddress) => {
        setDeliveryAddress(newAddress);
        setIsDeliveryModalOpen(false);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    return (
        <>
            <DashboardHeader />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-center text-3xl font-bold mb-8">Place Your Order</h1>

                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="shadow-md rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="font-semibold text-lg">Contact Details</h2>
                                <button
                                    className="flex items-center bg-gray-100 gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 rounded-md transition-colors"
                                    onClick={() => setIsContactModalOpen(true)}
                                >
                                    <Pencil className="h-4 w-4" /> Change
                                </button>
                            </div>
                            <div className="text-sm pb-5 text-muted-foreground space-y-1">
                                <p>{contactDetails.name}</p>
                                <p>{contactDetails.phone}</p>
                                <p>{contactDetails.email}</p>
                            </div>
                            <hr />
                            <div className="pt-5 flex justify-between items-center mb-2">
                                <h2 className="font-semibold text-lg">Delivery Address</h2>
                                <button
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-300 rounded-md transition-colors"
                                    onClick={() => setIsDeliveryModalOpen(true)}
                                >
                                    <Pencil className="h-4 w-4" /> Change
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground">{deliveryAddress.address}</p>
                        </div>

                        <div className="shadow-md rounded-lg p-4">
                            <h2 className="font-semibold text-lg mb-4">Order Items ({cartItems.length})</h2>
                            <div className="space-y-4">
                                {currentItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <img
                                            src={item.images[0] || '/jagedologo.png'}
                                            alt={item.name}
                                            className="w-16 h-16 object-cover rounded-md shadow-sm"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold">Ksh {(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t pt-4 gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Items per page:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                        className="border border-input bg-background rounded px-2 text-sm"
                                    >
                                        <option value={4}>4</option>
                                        <option value={8}>8</option>
                                        <option value={12}>12</option>
                                    </select>
                                </div>

                                {totalPages > 1 && (
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                                                />
                                            </PaginationItem>

                                            {pageNumbers.map((page, index) => (
                                                <PaginationItem key={`${page}-${index}`}>
                                                    {page === '...' ? (
                                                        <PaginationEllipsis />
                                                    ) : (
                                                        <PaginationLink
                                                            href="#"
                                                            isActive={currentPage === page}
                                                            onClick={(e) => { e.preventDefault(); handlePageChange(page as number); }}
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    )}
                                                </PaginationItem>
                                            ))}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </div>
                        </div>
                    </div>

                    <aside className="w-full lg:w-80">
                        <div className="shadow-lg rounded-lg p-6 space-y-4 sticky top-24">
                            <h2 className="text-xl font-bold border-b pb-4">Order Summary</h2>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                                <span>Ksh {totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Delivery Fee</span>
                                <span>TBD</span>
                            </div>
                            <div className="border-t pt-4 flex justify-between font-bold text-lg">
                                <span>Grand Total</span>
                                <span>Ksh {totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col space-y-2 pt-4">
                                <span className="text-xs">
                                    Note: The delivery fee will be determined by the Hardware Supplier.
                                </span>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox id="terms" checked={agreeToTerms} onCheckedChange={(checked) => setAgreeToTerms(!!checked)} />
                                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-none cursor-pointer">
                                        I agree to the Terms and Conditions
                                    </Label>
                                </div>
                            </div>
                            <button
                                className={`w-full mt-2 px-4 py-2 rounded-md font-medium transition-colors ${agreeToTerms && !isLoading
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                disabled={!agreeToTerms || isLoading}
                                onClick={handleConfirmOrder}
                            >
                                {isLoading ? 'Placing Order...' : 'Confirm Order'}
                            </button>
                        </div>
                    </aside>
                </div>
            </main>

            <ContactDetailsModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                onSave={handleSaveContactDetails}
                initialData={contactDetails}
            />
            <DeliveryAddressModal
                isOpen={isDeliveryModalOpen}
                onClose={() => setIsDeliveryModalOpen(false)}
                onSave={handleSaveDeliveryAddress}
                initialData={deliveryAddress}
            />
        </>
    );
};

export default CheckoutPage;