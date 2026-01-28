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
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setIsLoggedIn(false);
    navigate("/");
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
