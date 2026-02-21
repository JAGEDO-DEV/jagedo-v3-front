export const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
        return "";
    }

    return `Bearer ${token}`;
};
