/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getOrderRequestsById, PostOrderAdminNotesandAttachments, updateStage, RecallOrder, assignOrderToProviders } from "@/api/orderRequests.api";
import { AiOutlinePaperClip } from "react-icons/ai";
import { getUserProfileAdmin } from "@/api/provider.api";
import { TiTick } from "react-icons/ti";
import { uploadFile, type UploadedFile } from "@/utils/fileUpload";
import { toast } from "react-hot-toast";
import { Download } from "lucide-react";

const OrderDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [order, setOrder] = useState<any>(null);
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [method, setMethod] = useState(() => {
        if (id) {
            const savedMethod = localStorage.getItem(`orderAssignmentMethod-${id}`);
            return savedMethod || "Restricted";
        }
        return "Restricted";
    });

    const methods = ["Restricted", "Competitive"];
    const [adminNotes, setAdminNotes] = useState("");
    const [attachments, setAttachments] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmittingAdminData, setIsSubmittingAdminData] = useState(false);
    const [isRecallingOrder, setIsRecallingOrder] = useState(false);

    const [showConfirm, setShowConfirm] = useState(false);
    const [showReason, setShowReason] = useState(false);
    const [reason, setReason] = useState("");
    const [orderIsAssigned, setOrderIsAssigned] = useState(false);

    const buttonRef = useRef(null);


    const isUnreviewed = !order?.stage || order?.stage === "UNREVIEWED";

    useEffect(() => {
        if (id) {
            localStorage.setItem(`orderAssignmentMethod-${id}`, method);
        }
    }, [method, id]);

    const fetchOrder = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!id) {
                setError("No order ID provided.");
                setLoading(false);
                return;
            }
            const response = await getOrderRequestsById(axiosInstance, id);
            const orderData = response.data;
            setOrder(orderData);
            setOrderIsAssigned(orderData?.assignedServiceProviders?.length > 0);

            if (orderData?.adminNotes) {
                setAdminNotes(orderData?.adminNotes);
            }

            if (
                orderData?.adminAttachments &&
                Array.isArray(orderData?.adminAttachments)
            ) {
                const existingAttachments: UploadedFile[] =
                    orderData?.adminAttachments.map(
                        (url: string, index: number) => ({
                            id: `existing-${index}-${Date.now()}`,
                            originalName: url.split("/").pop() || `attachment-${index + 1}`,
                            displayName: url.split("/").pop() || `attachment-${index + 1}`,
                            url: url,
                            type: "unknown",
                            size: 0,
                            uploadedAt: new Date()
                        })
                    );
                setAttachments(existingAttachments);
            }


            const customerId = orderData.customer?.id || orderData.customerId;

            if (customerId) {
                try {
                    const profileResponse = await getUserProfileAdmin(axiosInstance, customerId);
                    if (profileResponse && profileResponse.data) {
                        setCustomer(profileResponse.data);
                    } else {
                        setCustomer(profileResponse);
                    }
                } catch (profileErr) {
                    console.error("Failed to fetch customer profile details:", profileErr);
                    if (orderData.customer) setCustomer(orderData.customer);
                }
            } else if (orderData.customer) {
                setCustomer(orderData.customer);
            }


        } catch (err: any) {
            setError(err.message || "Failed to fetch order details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (order && (order.type === "PROFESSIONAL" || order.type === "FUNDI")) {
            setMethod("Restricted");
        }
    }, [order]);

    const handleRecallOrder = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for recalling the order");
            return;
        }

        setIsRecallingOrder(true);
        try {
            await RecallOrder(axiosInstance, order.id);
            toast.success("Order recalled successfully!");
            setShowReason(false);
            setReason("");
            navigate("/dashboard/admin/orders");
        } catch (error: any) {
            console.error("Error recalling order:", error);
            toast.error(error.message || "Failed to recall order");
        } finally {
            setIsRecallingOrder(false);
        }
    };

    const handleStartReview = async () => {
        try {
            await updateStage(axiosInstance, order.id, "UNDERREVIEW");
            toast.success("Review started successfully!");
            fetchOrder();
        } catch (error: any) {
            toast.error(error.message || "Failed to start review");
        }
    };

    const handleSubmitAdminData = async () => {
        if (!adminNotes.trim() && attachments.length === 0) {
            toast.error("Please add admin notes or attachments before submitting.");
            return;
        }

        setIsSubmittingAdminData(true);
        try {
            const adminNotesData = {
                attachments: attachments.map((file) => file.url),
                adminNotes: adminNotes.trim()
            };
            await PostOrderAdminNotesandAttachments(axiosInstance, adminNotesData, order.id);
            toast.success("Admin data submitted successfully!");
            fetchOrder();
            setAdminNotes("");
            setAttachments([]);
        } catch (error: any) {
            console.error("Error submitting admin data:", error);
            toast.error(error.message || "Failed to submit admin data");
        } finally {
            setIsSubmittingAdminData(false);
        }
    };

    const handleBottomButtonClick = async () => {
        const navigateUrl = `/dashboard/admin/register?method=${method.toLowerCase()}&orderId=${order.id}&type=${order.type}`;

        if (method.toLowerCase() === "competitive") {
            navigate(navigateUrl);
        } else {
            try {
                const sellerIds = order?.items
                    ?.map(item => item?.product?.sellerId)
                    .filter(id => id != null);

                const uniqueSellerIds = [...new Set(sellerIds)];

                if (!uniqueSellerIds || uniqueSellerIds.length === 0) {
                    toast.error("Could not find any sellers for the items in this order.");
                    console.error("Error: No sellerIds found in order items.", order);
                    return;
                }

                const payload = {
                    procurementMethod: method,
                    providerIds: uniqueSellerIds
                };

                await assignOrderToProviders(axiosInstance, order.id, payload);
                toast.success("Order assigned successfully!");
                setTimeout(() => {
                    navigate("/dashboard/admin/orders");
                }
                    , 1500);

            } catch (error) {
                console.error("Error assigning order:", error);
                toast.error("Failed to assign order.");
            }
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                try {
                    const uploadedFile = await uploadFile(file);
                    setAttachments((prev) => [...prev, uploadedFile]);
                    toast.success(`'${uploadedFile.displayName}' uploaded successfully.`);
                } catch (error: any) {
                    console.error(`Error uploading ${file.name}:`, error);
                    toast.error(`Failed to upload ${file.name}: ${error.message}`);
                }
            }
        } finally {
            setIsUploading(false);
            event.target.value = "";
        }
    };

    const removeAttachment = (fileId: string) => {
        setAttachments((prev) => prev.filter((file) => file.id !== fileId));
        toast.success("File removed successfully.");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-400 border-t-transparent" />
                <p className="mt-3 text-gray-600">Loading...</p>
            </div>
        );
    }
    if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
    if (!order) return <div className="p-10 text-center">No order data found.</div>;


    const getDisplayPrice = (item: any) => {
        if (item.price > 0) return item.price;
        if (item.product?.customPrice) return item.product.customPrice;
        return 0;
    };


    const customerName =
        customer?.organizationName ||
        (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : null) ||
        (customer?.contactfirstName && customer?.contactlastName ? `${customer.contactfirstName} ${customer.contactlastName}` : null) ||
        customer?.username ||
        order.customer?.username ||
        "Unknown Customer";

    const contactPerson =
        (customer?.contactfirstName && customer?.contactlastName) ? `${customer.contactfirstName} ${customer.contactlastName}` : null;

    const displayPhone = customer?.phoneNumber || customer?.contactPhone || order.customerPhone;
    const displayEmail = customer?.email || customer?.contactEmail || order.customerEmail;


    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg relative border border-gray-200">
            <div className="flex justify-between items-center bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                <h1 className="text-2xl font-bold text-gray-800">{order.orderId || `ID: ${order.id}`}</h1>
                <span className="text-xs font-semibold bg-[rgb(0,0,122)] text-white px-3 py-1 rounded-full shadow-sm">{order.stage || "NEW"}</span>
                <span className="text-xs font-semibold bg-[rgb(0,0,122)] text-white px-3 py-1 rounded-full shadow-sm">{method}</span>
                <h2 className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
                    Created: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                </h2>
            </div>
            <br className="my-6 border-gray-200" />
            <div className="flex justify-between items-center mb-6">
                <div className="relative flex items-center gap-4">
                    {order.status === "NEW" && (
                        <div>
                            <span className="text-gray-700 font-semibold mr-2">Method:</span>
                            {order.type === "PROFESSIONAL" || order.type === "FUNDI" ? (
                                <span className="border p-2 rounded-md shadow-sm bg-gray-100 text-gray-700">
                                    Restricted
                                </span>
                            ) : (
                                <select
                                    className="border p-2 rounded-md shadow-sm"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                >
                                    {methods.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                    {isUnreviewed && (
                        <button type="button" className="ml-4 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition-colors" onClick={handleStartReview}>
                            Start Review
                        </button>
                    )}
                </div>
            </div>
            <br className="my-6 border-gray-200" />

            {/* Customer Details Section (Summarized) */}
            <div className="p-8 my-6 rounded-xl shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Details</h2>
                <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                        <span className="font-semibold text-gray-800 w-32">Name:</span>
                        <span className="text-gray-700">{customerName}</span>
                    </div>
                </div>
            </div>

            {/* Order Details Section */}
            <div className="p-8 my-6 rounded-xl shadow-lg bg-white hover:shadow-xl transition-all duration-300 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>
                <div className="flex justify-between gap-8">
                    <div className="w-1/2 space-y-4">
                        <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200"><span className="font-semibold text-gray-800 w-24">Order Type:</span><span className="text-gray-700">{order.type || 'N/A'}</span></div>
                        <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200"><span className="font-semibold text-gray-800 w-24">Subtotal:</span><span className="text-gray-700">KES {order.subTotal?.toLocaleString() || 'N/A'}</span></div>
                        <div className="bg-blue-50 p-4 rounded-2xl shadow-md mt-4 border border-gray-200">
                            <h3 className="text-xl font-bold text-blue-900 mb-2">Items in Order</h3>
                            {order.items && order.items.length > 0 ? order.items.map((item, index) => (
                                <div key={index} className="text-gray-700 mt-2">
                                    <p><span className="font-semibold">{item.productName}</span> (x{item.quantity})</p>
                                    <p className="text-sm">Price: KES {getDisplayPrice(item).toLocaleString()}</p>
                                </div>
                            )) : <p className="text-gray-500">No items in this order.</p>}
                        </div>
                    </div>
                    <div className="w-1/2 pl-8 border-l border-gray-200 space-y-4">
                        {order.payments && order.payments.length > 0 && (
                            <div className="flex items-center space-x-2 bg-green-100 p-4 rounded-lg cursor-pointer border border-green-300" onClick={() => navigate(`/receipts/${order.payments[order.payments.length - 1].id}`)}>
                                <Download className="h-6 w-6 text-green-500" />
                                <span className="text-green-600 font-medium">Download Receipt</span>
                            </div>
                        )}
                        <div className="bg-blue-50 p-4 rounded-2xl shadow-md mt-4 border border-gray-200">
                            <h3 className="text-xl font-bold text-blue-900 mb-1">
                                Package Details
                            </h3>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-center">
                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                    Jagedo Oversees
                                </li>
                            </ul>
                            <h3 className="text-xl font-bold text-blue-900 mb-1">
                                Arrival Time
                            </h3>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-center">
                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                    Scope Budget
                                </li>

                                <li className="flex items-center">
                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                    Products Quality
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Details Section - SPLIT VIEW */}
            <div className="p-8 my-6 bg-white shadow-lg rounded-xl border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Details</h2>
                <div className="grid grid-cols-2 gap-6">
                    {/* LEFT COLUMN: Identity (Name & Contact Person) */}
                    <div className="pr-6 border-r border-gray-200 space-y-3 text-gray-700">
                        {customerName && (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 w-28">Name:</span>
                                <span>{customerName}</span>
                            </div>
                        )}

                        {contactPerson && contactPerson !== customerName && (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 w-28">Contact Person:</span>
                                <span>{contactPerson}</span>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Communication (Phone & Email) */}
                    <div className="pl-6 space-y-3 text-gray-700">
                        {displayPhone && (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 w-20">Phone:</span>
                                <span>{displayPhone}</span>
                            </div>
                        )}

                        {displayEmail && (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 w-20">Email:</span>
                                <span>{displayEmail}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fallback if all empty */}
                {!customerName && !displayPhone && !displayEmail && (
                    <p className="text-gray-500 italic mt-2">No contact details provided.</p>
                )}
            </div>
            <br className="my-6 border-gray-200" />

            <div className="grid grid-cols-2 gap-6 bg-white p-8 shadow-lg rounded-xl border border-gray-200">
                <div className="pr-6 border-r border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Notes</h2>
                    <textarea className="w-full p-4 border border-gray-200 rounded-md" rows={10} placeholder="Enter admin notes..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} disabled={isUnreviewed} />
                </div>
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Attachments</h2>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 gap-3">
                        <label className="cursor-pointer flex items-center gap-2 flex-1">
                            <AiOutlinePaperClip className="text-gray-700 text-2xl" /><span className="text-gray-600">{isUploading ? "Uploading..." : "Click to upload files"}</span>
                            <input type="file" className="hidden" onChange={handleFileUpload} multiple disabled={isUploading || isUnreviewed} accept="image/*,.pdf,.doc,.docx" />
                        </label>
                    </div>
                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700">Uploaded Files:</h3>
                            {attachments.map((file) => (
                                <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                                    <div className="flex items-center gap-2 min-w-0"><span className="text-sm text-gray-600 truncate">{file.displayName}</span><span className="text-xs text-gray-400 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span></div>
                                    <div className="flex items-center gap-2"><a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">View</a><button onClick={() => removeAttachment(file.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {(order?.status !== "DRAFT" && !isUnreviewed) && (
                <>
                    <div className="flex justify-center mt-6">
                        <button type="button" onClick={handleSubmitAdminData} disabled={isSubmittingAdminData || (!adminNotes.trim() && attachments.length === 0)} className="bg-[#00007A] text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmittingAdminData ? "Saving..." : "Save Changes"}
                        </button>
                    </div>

                    <div className="flex justify-between mt-6">
                        <button type="button" onClick={handleBottomButtonClick} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                            {method.toLowerCase() === "restricted" ? "Assign" : "View Registers"}
                        </button>
                        {!orderIsAssigned && (<button ref={buttonRef} type="button" onClick={() => setShowConfirm(true)} className="bg-red-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-red-700">Recall Order</button>)}

                        {showConfirm && (
                            <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-md shadow-md w-64 p-4 z-10">
                                <h2 className="text-sm font-semibold mb-3">Are you sure you want to recall this order?</h2>
                                <div className="flex justify-end space-x-2">
                                    <button onClick={() => setShowConfirm(false)} className="text-sm px-3 py-1 border rounded hover:bg-gray-100">Cancel</button>
                                    <button onClick={() => { setShowConfirm(false); setShowReason(true); }} className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Yes</button>
                                </div>
                            </div>
                        )}

                        {showReason && (
                            <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-md shadow-md w-80 p-4 z-10">
                                <h2 className="text-sm font-semibold mb-2">Reason for recalling order</h2>
                                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Enter reason..." className="w-full text-sm border border-gray-300 rounded p-2 mb-3" />
                                <div className="flex justify-end space-x-2">
                                    <button onClick={() => { setShowReason(false); setReason(""); }} className="text-sm px-3 py-1 border rounded hover:bg-gray-100">Cancel</button>
                                    <button onClick={handleRecallOrder} disabled={!reason.trim() || isRecallingOrder} className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                        {isRecallingOrder ? "Recalling..." : "Submit & Recall"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderDetail;