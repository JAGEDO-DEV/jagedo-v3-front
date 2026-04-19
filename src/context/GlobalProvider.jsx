import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GlobalContext = createContext({});

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);

      
      if (userData && typeof userData === 'object' && userData.userType) {
        const typeUpper = String(userData.userType).toUpperCase();
        const isSuperAdmin = typeUpper === 'SUPER_ADMIN';
        const isAdmin = typeUpper === 'ADMIN' || isSuperAdmin;

        
        if (userData.userType !== typeUpper) {
          userData.userType = typeUpper;
        }

        if (!userData.isSuperAdmin && isSuperAdmin) {
          userData.isSuperAdmin = true;
          
        }

        if (!userData.isAdmin && isAdmin) {
          userData.isAdmin = true;
          
        }

        
        localStorage.setItem("user", JSON.stringify(userData));
      }

      setUser(userData);
      setIsLoggedIn(true);
    }
  }, []);

  const logout = () => {
    const drafts = localStorage.getItem("jagedo_product_drafts");
    localStorage.clear();
    if (drafts) {
      localStorage.setItem("jagedo_product_drafts", drafts);
    }
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
