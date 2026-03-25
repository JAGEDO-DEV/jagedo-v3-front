//@ts-nocheck
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ShoppingBag } from "lucide-react";

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        let user = null;
        try {
            user = userStr ? JSON.parse(userStr) : null;
        } catch {
            user = null;
        }

        if (!token || !user) {
            navigate("/login", { state: { from: "/customer/checkout" } });
            return;
        }

        const role = (user.userType || user.role || "").toString().toUpperCase();
        if (role !== "CUSTOMER") {
            navigate("/login", { state: { from: "/customer/checkout" } });
            return;
        }

        navigate("/customer/checkout");
    };

    if (cartItems.length === 0) {
        return (
            <>
                <DashboardHeader />
                <div className="flex flex-col items-center justify-center text-center p-10 h-[60vh]">
                    <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Your Cart is Empty</h1>
                    <p className="text-gray-500 mb-6">
                        Looks like you haven't added anything to your cart yet.
                    </p>
                    <button
                        onClick={() => navigate("/customer/hardware_shop")}
                        className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-medium"
                    >
                        Continue Shopping
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader />
            <main className="container mx-auto p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                    {/* Cart Items */}
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold">
                                My Cart ({cartItems.length})
                            </h1>
                            <button
                                onClick={() => navigate("/customer/hardware_shop")}
                                className="px-3 py-1 text-white rounded-md bg-blue-600 hover:bg-blue-700 cursor-pointer text-sm"
                            >
                                Continue Shopping
                            </button>
                        </div>

                        <div className="space-y-4 bg-gray-200 p-4 rounded-lg">
                            {cartItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between items-center gap-4 p-4 border rounded-lg bg-gray-50/50"
                                >
                                    {/* Column 1: Image & Name */}
                                    <div className="flex flex-col items-center text-center w-24">
                                        <img
                                            src={item.images[0] || "/jagedologo.png"}
                                            alt={item.name}
                                            className="w-20 h-20 object-contain rounded-md"
                                        />
                                        <h3 className="font-semibold mt-1">{item.name}</h3>
                                    </div>

                                    {/* Column 2: Details */}
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-500">Product ID: {item.id}</p>
                                        <p className="font-bold my-1">
                                            Price: Ksh {item.price.toLocaleString()}
                                        </p>
                                        <p className="text-gray-700">
                                            Subtotal: KSH{" "}
                                            {(item.price * item.quantity).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>

                                    {/* Column 3: Actions */}
                                    <div className="flex flex-col items-end gap-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                disabled={item.quantity === 1}
                                                className="h-8 w-8 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 font-bold"
                                            >
                                                -
                                            </button>
                                            <span className="font-bold w-8 text-center text-lg">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="h-8 w-8 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 font-bold"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <aside className="w-full lg:w-80 lg:sticky lg:top-24">
                        <div className="border rounded-lg p-6 space-y-4">
                            <h2 className="text-xl font-bold border-b pb-4">Cart Summary</h2>
                            <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>Ksh {totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Shipping</span>
                                <span>Calculated at checkout</span>
                            </div>
                            <div className="border-t pt-4 flex justify-between font-bold text-lg">
                                <span>Grand Total</span>
                                <span>Ksh {totalPrice.toLocaleString()}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-semibold rounded-md"
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </aside>
                </div>
            </main>
        </>
    );
};

export default CartPage;
