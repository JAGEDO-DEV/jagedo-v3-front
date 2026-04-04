import { useMemo } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import axios from "axios";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGlobalContext } from "@/context/GlobalProvider";
import { ProfileCompletionModal } from "@/components/profile 2.0/ProfileCompletionModal";
import { getProviderProfile } from "@/api/provider.api";
import { completeProfile } from "@/api/auth.api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// The shape your backend expects
type TokenRequest = {
    credential: string;
    clientId: string;
    token?: string;
};

export default function GoogleSignIn() {
    const navigate = useNavigate();
    const { user: contextUser, setUser, setIsLoggedIn } = useGlobalContext();

    const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
    const [registeredUser, setRegisteredUser] = useState<any>(null);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [pendingUser, setPendingUser] = useState<any>(null);

    const nonce = useMemo(() => crypto.randomUUID(), []);

    const redirectUser = (user: any, redirectTo = null) => {
        setTimeout(() => {
            let role = user?.userType?.toLowerCase();
            let status = user?.status;
            
            let path = redirectTo || "/dashboard/customer";
            
            if (!redirectTo) {
                switch (role) {
                    case "admin":
                    case "super_admin":
                        path = "/dashboard/admin";
                        break;
                    case "customer":
                        path = user.profileType === "organization"
                            ? "/dashboard/customer/organization"
                            : "/dashboard/customer";
                        break;
                    case "fundi":
                    case "professional":
                    case "contractor":
                    case "hardware":
                        if (status === "INCOMPLETE") {
                            path = `/dashboard/${role}/profile`;
                        } else {
                            path = `/dashboard/${role}`;
                        }
                        break;
                    default:
                        path = "/dashboard";
                }
            }
            navigate(path);
        }, 1500);
    };

    const handleProfileComplete = async (profileData: any) => {
        try {
            const { redirectTo, ...apiData } = profileData;
            const payload = {
                email: registeredUser?.email || contextUser?.email,
                ...apiData,
            };
            const response = await completeProfile(payload);
            if (response.data?.success) {
                const updatedUser = response.data.user;
                if (updatedUser && typeof updatedUser === "object" && updatedUser.userType) {
                    const typeUpper = String(updatedUser.userType).toUpperCase();
                    updatedUser.userType = typeUpper;
                    if (updatedUser.isSuperAdmin === undefined || updatedUser.isSuperAdmin === null) {
                        updatedUser.isSuperAdmin = typeUpper === "SUPER_ADMIN";
                    }
                    updatedUser.isAdmin = typeUpper === "ADMIN" || updatedUser.isSuperAdmin;
                }
                setUser?.(updatedUser);
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setShowProfileCompletionModal(false);
                toast.success("Profile Completed!");
                redirectUser(updatedUser, redirectTo);
            } else {
                toast.error(response.data?.message || "Failed to complete profile");
            }
        } catch (error: any) {
            console.error("Profile completion error:", error);
            toast.error(error.response?.data?.message || "Error completing profile");
        }
    };

    const continueLoginFlow = async (user: any) => {
        if (user.status === "SIGNED_UP" && !user.isSuperAdmin && user.profileStatus !== "COMPLETE") {
            try {
                const profileResponse = await getProviderProfile(axios, user.id);
                const profileData = profileResponse?.data || profileResponse;
                setRegisteredUser({ ...user, ...profileData });
                setShowProfileCompletionModal(true);
            } catch (error) {
                console.error("Error fetching provider profile:", error);
                toast.error("Failed to fetch profile details");
            }
            return;
        }

        toast.success("Login successful! Redirecting to dashboard...");
        redirectUser(user);
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setIsSubmittingPassword(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/auth/set-password`, 
                { password: newPassword }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Password set successfully!");
            
            const updatedUser = { ...pendingUser, passwordSet: true };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser?.(updatedUser);

            setShowPasswordModal(false);
            setNewPassword("");
            setConfirmPassword("");
            continueLoginFlow(updatedUser);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to set password");
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    const handleSuccess = async (res: CredentialResponse) => {
        
        const idToken = res?.credential;
        if (!idToken) {
            toast.error('No credential from Google');
            return;
        }

        const payload: TokenRequest = {
            credential: idToken,
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
            token: idToken
        };

        try {
            // POST to your backend verification endpoint
            const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/auth/google/login`, payload, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.status !== 200) {
                const e = response.data || { message: 'unknown' };
                toast.error('Server rejected Google token: ' + (e?.message || response.status));
                return;
            }

            let { user, accessToken } = response.data;
            if (user && typeof user === "object" && user.userType) {
                const typeUpper = String(user.userType).toUpperCase();
                user.userType = typeUpper;
                if (user.isSuperAdmin === undefined || user.isSuperAdmin === null) {
                    user.isSuperAdmin = typeUpper === "SUPER_ADMIN";
                }
                user.isAdmin = typeUpper === "ADMIN" || user.isSuperAdmin;
            }

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', accessToken);
            setUser?.(user);
            setIsLoggedIn?.(true);

            if (user.passwordSet === false) {
                setPendingUser(user);
                setShowPasswordModal(true);
                return;
            }

            continueLoginFlow(user);
        } catch (err) {
            const errorMessage = axios.isAxiosError(err)
                ? err.response?.data?.message || err.message
                : (err as Error).message;
            toast.error('Login failed: ' + errorMessage);
        }
    };

    const handleError = () => toast.error('Google Sign-In failed');

    return (
        <div className="w-full flex items-center justify-center">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                useOneTap={true}
                nonce={nonce}
                ux_mode="popup"
                text="continue_with"
            />
            {showProfileCompletionModal && (
                <ProfileCompletionModal
                    isOpen={showProfileCompletionModal}
                    user={registeredUser}
                    accountType={registeredUser?.accountType || "INDIVIDUAL"}
                    userType={registeredUser?.userType || "CUSTOMER"}
                    onComplete={handleProfileComplete}
                    onClose={() => setShowProfileCompletionModal(false)}
                />
            )}
            
            <Dialog open={showPasswordModal} onOpenChange={(open) => {
                if (!open && pendingUser) {
                    // Force them to complete it
                    toast.error("You must set a password to continue.");
                }
            }}>
                <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                    <div className="flex flex-col items-center justify-center text-center p-4">
                        <img src="/jagedologo.png" alt="JaGedo Logo" className="h-10 mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Set Your Password</h2>
                        <p className="text-sm text-gray-500 mb-6">Since you signed up with Google, please set a password for your account.</p>
                        
                        <form onSubmit={handleSetPassword} className="w-full space-y-4">
                            <div className="space-y-2 text-left">
                                <Label htmlFor="new-password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showPass ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pr-10"
                                        placeholder="Enter password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        onClick={() => setShowPass(!showPass)}
                                    >
                                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-left">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirmPass ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pr-10"
                                        placeholder="Confirm password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                    >
                                        {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmittingPassword}>
                                {isSubmittingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Password & Continue
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}