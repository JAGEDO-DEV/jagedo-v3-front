// import { createContext, useContext, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const GlobalContext = createContext();

// export const GlobalProvider = ({ children }) => {
//     const [user, setUser] = useState(null);

//     const [isLoggedIn, setIsLoggedIn] = useState(false);

//     const navigate = useNavigate();

//     // Initialize user from localStorage when the component mounts
//     useEffect(() => {
//         const user = localStorage.getItem("user");
//         if (user) {
//             setUser(JSON.parse(user));
//             setIsLoggedIn(true);
//         }
//     }, []);

//     const logout = () => {
//         setUser(null);
//         setIsLoggedIn(false);
//         localStorage.clear();
//         navigate("/");
//     };

//     return (
//         <GlobalContext.Provider
//             value={{ user, setUser, isLoggedIn, setIsLoggedIn, logout }}
//         >
//             {children}
//         </GlobalContext.Provider>
//     );
// };

// export const useGlobalContext = () => useContext(GlobalContext);
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GlobalContext = createContext({});

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage if present
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);

      // Auto-fix: Ensure roles and flags are set correctly
      if (userData && typeof userData === 'object' && userData.userType) {
        const typeUpper = String(userData.userType).toUpperCase();
        const isSuperAdmin = typeUpper === 'SUPER_ADMIN';
        const isAdmin = typeUpper === 'ADMIN' || isSuperAdmin;

        // Update userType to uppercase if it's not already, to ensure consistency
        if (userData.userType !== typeUpper) {
          userData.userType = typeUpper;
        }

        if (!userData.isSuperAdmin && isSuperAdmin) {
          userData.isSuperAdmin = true;
          
        }

        if (!userData.isAdmin && isAdmin) {
          userData.isAdmin = true;
          
        }

        // Update localStorage if any changes were made
        localStorage.setItem("user", JSON.stringify(userData));
      }

      setUser(userData);
      setIsLoggedIn(true);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cachedPermissions");
    localStorage.removeItem("cachedPermissionsUserId");
    setUser(null);
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <GlobalContext.Provider
      value={{ user, setUser, isLoggedIn, setIsLoggedIn, logout }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
