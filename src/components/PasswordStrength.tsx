export const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "" };
 
    let score = 0;
    if (password.length > 5) score += 1;
    if (password.length > 7) score += 1; // Bonus for length > 7
    if (/[A-Z]/.test(password)) score += 1; // Has uppercase
    if (/[0-9]/.test(password)) score += 1; // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Has special char

    switch (score) {
        case 0:
        case 1:
        case 2:
            return { score, label: "Weak", color: "text-red-500" };
        case 3:
        case 4:
            return { score, label: "Medium", color: "text-yellow-500" };
        case 5:
            return { score, label: "Strong", color: "text-green-500" };
        default:
            return { score: 0, label: "", color: "" };
    }


};