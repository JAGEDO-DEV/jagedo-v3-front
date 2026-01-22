/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Menu,
  X,
  CheckCircleIcon,
  ChevronDown,
  User,
  PencilRuler,
  HardHat,
  Store,
  SquareUser,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa6";
import customerImg from "../assets/customer(1).png";
import fundiImg from "../assets/fundi.jpeg";
import professionalImg from "../assets/professional.jpeg";
import contractorImg from "../assets/contractor.jpeg";
import hardwareImg from "../assets/hardware.jpeg";
import JamesImg from "../assets/Builder.jpg";
import micaImg from "../assets/mutonga.jpg";
import ChatWidgetWrapper from "@/components/ChatWidget";

const GreenCheckIcon = (
  <CheckCircleIcon className="text-green-500 inline-flex align-top w-5 h-5" />
);

const Home = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Customer");
  const [image, setImage] = useState(micaImg);
  const [active, setActive] = useState(false);
  const [showSignupDropdown, setShowSignupDropdown] = useState(false);
  const [showMobileSignupDropdown, setShowMobileSignupDropdown] =
    useState(false);
  const [showSignupSection, setShowSignupSection] = useState(false);
  const dropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);
  const signupSectionRef = useRef(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const [steps, setSteps] = useState([
    {
      id: 1,
      title: "Sign Up",
      /* icon: "📝" */
    },
    { id: 2, title: "Request" /* icon: "📄" */ },
    { id: 3, title: "Pay to Escrow" /* icon: "💰" */ },
    { id: 4, title: "Track Execution" /* icon: "📊" */ },
    { id: 5, title: "Complete and Review" /* icon: "✅" */ },
  ]);
  const [benefits, setBenefits] = useState([
    <p className="flex items-start gap-3 mb-1.5" key="1">
      <span>{GreenCheckIcon}</span>Access to verified Builders - Vetted,
      certified construction professionals only.
    </p>,
    <p className="flex items-start gap-3 mb-1.5" key="2">
      <span>{GreenCheckIcon}</span>All-in-one platform - 1500+ services in one
      place.
    </p>,
    <p className="flex items-start gap-3 mb-1.5" key="3">
      <span>{GreenCheckIcon}</span>Secure Escrow Payments - Pay by milestone,
      funds safely held.
    </p>,
    <p className="flex items-start gap-3 mb-1.5" key="4">
      <span>{GreenCheckIcon}</span>Quality Assurance - Reviewed and approved by
      expert peers.
    </p>,
    <p className="flex items-start gap-3 mb-1.5" key="5">
      <span>{GreenCheckIcon}</span>Project Tracking Tools - Monitor progress and
      collaborate easily.
    </p>,
  ]);

  const section1Ref = React.useRef(null);
  const section2Ref = React.useRef(null);
  const navigate = useNavigate();

  const navCards = [
    { name: "Customer", img: customerImg },
    { name: "Fundi", img: fundiImg },
    { name: "Professional", img: professionalImg },
    { name: "Contractor", img: contractorImg },
    { name: "Hardware", img: hardwareImg },
  ];

  const categories = [
    {
      name: "Customer",
      img: [image],
      steps:
        "1. Sign up as a customer.\n2. Browse available services.\n3. Request a service.",
      benefits:
        "✔ Access trusted builders\n✔ Convenient service booking\n✔ Secure payments",
    },
    {
      name: "Builder",
      img: JamesImg,
      steps:
        "1. Create a fundi account.\n2. Showcase your skills.\n3. Receive job requests.",
      benefits:
        "✔ Get hired easily\n✔ Showcase your skills\n✔ Increase your earnings",
    },
  ];

  const handleCategory = (category) => {
    setSelectedCategory(category.name);
    // const GreenCheckIcon = <CheckCircleIcon className="text-green-500 inline-flex align-top w-5 h-5" />;

    switch (category.name) {
      case "Customer":
        setImage(micaImg);
        // setSteps("1. Sign up.\n2. Request.\n3. Pay to Escrow. \n4. Job Execution and Tracking. \n5. Complete and Review Job.");
        setSteps([
          {
            id: 1,
            title: "Sign Up",
            /* icon: "📝" */
          },
          { id: 2, title: "Request" /* icon: "📄" */ },
          { id: 3, title: "Pay to Escrow" /* icon: "💰" */ },
          { id: 4, title: "Track Execution" /* icon: "📊" */ },
          { id: 5, title: "Complete and Review" /* icon: "✅" */ },
        ]);
        setBenefits([
          <p className="flex items-start gap-3 mb-1.5" key="1">
            <span>{GreenCheckIcon}</span>Access to verified Builders - Vetted,
            certified construction professionals only.
          </p>,
          <p className="flex items-start gap-3 mb-1.5" key="2">
            <span>{GreenCheckIcon}</span>All-in-one platform - 1500+ services in
            one place.
          </p>,
          <p className="flex items-start gap-3 mb-1.5" key="3">
            <span>{GreenCheckIcon}</span>Secure Escrow Payments - Pay by
            milestone, funds safely held.
          </p>,
          <p className="flex items-start gap-3 mb-1.5" key="4">
            <span>{GreenCheckIcon}</span>Quality Assurance - Reviewed and
            approved by expert peers.
          </p>,
          <p className="flex items-start gap-3 mb-1.5" key="5">
            <span>{GreenCheckIcon}</span>Project Tracking Tools - Monitor
            progress and collaborate easily.
          </p>,
        ]);
        scrollToSection(section2Ref);
        break;
      case "Builder":
        setImage(JamesImg);
        setSteps([
          {
            id: 1,
            title: "Sign up & Set Profile.",
          },
          { id: 2, title: "Receive Requests." /* icon: "📄" */ },
          { id: 3, title: "Bid and win." /* icon: "💰" */ },
          { id: 4, title: "Job Execution Updates." /* icon: "📊" */ },
          { id: 5, title: "Get Paid and Reviewed." /* icon: "✅" */ },
        ]);
        setBenefits([
          <p className="flex items-start gap-3 mb-1.5" key="1">
            <span>{GreenCheckIcon}</span>More jobs - Direct Access to
            construction projects.
          </p>,
          <p className="flex items-start gap-3 mb-1.5" key="2">
            <span>{GreenCheckIcon}</span>Fair Pay - Transparent and timely
            structured payments.
          </p>,
          <p className="flex items-start gap-3 mb-1.5" key="3">
            <span>{GreenCheckIcon}</span>Skill Growth - In-app apprenticeships
            and upskilling program.
          </p>,
          <p className="flex items-start gap-3 mb-1.5" key="4">
            <span>{GreenCheckIcon}</span>Team collaboration - Seamless teamwork
            and communication tools.
          </p>,
          <p className="flex items-start gap-3 mb-1.5" key="5">
            <span>{GreenCheckIcon}</span>Secure payments - Guaranteed
            milestone-based payment system.
          </p>,
        ]);
        scrollToSection(section2Ref);
        break;
      default:
        setImage(null);
        setSteps("");
        setBenefits("");
    }
  };
  const handleProductsClick = () => {
    navigate("/products");
  };

  const handleHelpClick = () => {
    window.open(
      "https://jagedoplatform.zohodesk.com/portal/en/newticket",
      "_blank",
    );
  };
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClickSignUp = () => {
    setShowSignupDropdown(!showSignupDropdown);
  };

  const handleSignupOptionClick = (userType) => {
    setShowSignupDropdown(false);
    setShowMobileSignupDropdown(false);
    setShowSignupSection(false);
    navigate(`/signup/${userType.toLowerCase()}`);
  };

  const handleMobileSignupClick = () => {
    setShowMobileSignupDropdown(!showMobileSignupDropdown);
  };

  const handleSignupForFreeClick = () => {
    setShowSignupSection(!showSignupSection);
    if (!showSignupSection) {
      setTimeout(() => {
        signupSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSignupDropdown(false);
      }
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(event.target)
      ) {
        setShowMobileSignupDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavigation = (card) => {
    switch (card.name) {
      case "Customer":
        navigate("/signup/customer");
        break;
      case "Fundi":
        navigate("/signup/fundi");
        break;
      case "Professional":
        navigate("/signup/professional");
        break;
      case "Contractor":
        navigate("/signup/contractor");
        break;
      case "Hardware":
        navigate("/signup/hardware");
        break;
      default:
        break;
    }
  };

  const menuButtons = [
    "Products",
    "About us ",
    "Events",
    "Login",
    "Sign Up",
    "Help",
  ];

  const handleMenuButtonClick = (index) => {
    switch (menuButtons[index]) {
      case "Products":
        navigate("/products");
        break;
      case "Help":
        window.open(
          "https://jagedoplatform.zohodesk.com/portal/en/newticket",
          "_blank",
        );
        break;
      case "Login":
        navigate("/login");
        break;
      case "Sign Up":
        handleMobileSignupClick();
        break;
      case "About Us ":
        navigate("/about-us");
        break;
      case "Events":
        window.open("https://jbis.vercel.app/", "_blank");
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      className="bg-white text-black min-h-screen flex flex-col"
    >
      <ChatWidgetWrapper />
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="flex justify-between items-center py-1 px-6 md:px-8"
      >
        <Link to="/">
          <img
            src="/JaGedo logo.webp"
            alt="Logo"
            className="w-30 md:w-50 lg:w-50 h-auto"
          />
        </Link>
        {/* <div
          id="div1"
          className="hidden sm:flex items-center space-x-4 md:space-x-9 -ml-4"
        >
          <button
            type="button"
            className="bg-[rgb(0,0,122)] text-white h-10 px-4 text-sm rounded-full shadow-md
               hover:scale-105 transition duration-300 ease-in-out
               hover:bg-[#3AB33A] flex items-center justify-center
               sm:w-32 md:w-28"
            onClick={handleProductsClick}
          >
            Products
          </button>

          <button
            type="button"
            className="bg-[rgb(0,0,122)] text-white h-10 px-4 text-sm rounded-full shadow-md
               hover:scale-105 transition duration-300 ease-in-out
               hover:bg-[#3AB33A] flex items-center justify-center
               sm:w-32 md:w-28"
            onClick={() => navigate("/about-us")}
          >
            About Us
          </button>

          <button
            type="button"
            className="bg-[rgb(0,0,122)] text-white h-10 px-4 text-sm rounded-full shadow-md
               hover:scale-105 transition duration-300 ease-in-out
               hover:bg-[#3AB33A] flex items-center justify-center
               sm:w-32 md:w-28"
            onClick={() => window.open("https://jbis.vercel.app/", "_blank")}
          >
            Events
          </button>
        </div> */}
<div
  id="div1"
  className="hidden sm:flex items-center space-x-6 md:space-x-10 -ml-4"
>
  <span
    onClick={handleProductsClick}
    className="text-[rgb(0,0,122)] font-semibold cursor-pointer hover:underline hover:text-[#3AB33A] transition"
  >
    Products
  </span>

  <span
    onClick={() => navigate("/about-us")}
    className="text-[rgb(0,0,122)] font-semibold cursor-pointer hover:underline hover:text-[#3AB33A] transition"
  >
    About Us
  </span>

  <span
    onClick={() => window.open("https://jbis.vercel.app/", "_blank")}
    className="text-[rgb(0,0,122)] font-semibold cursor-pointer hover:underline hover:text-[#3AB33A] transition"
  >
    Events
  </span>
</div>

        <div
          id="div2"
          className="flex items-center space-x-4 md:space-x-9 ml-4"
        >
          <button
            type="button"
            className="bg-[rgb(0,0,122)] text-white h-10 px-4 text-sm rounded-full shadow-md
               hover:scale-105 transition duration-300 ease-in-out
               hover:bg-[#3AB33A] flex items-center justify-center
               sm:w-32 md:w-28"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleClickSignUp}
              className="bg-[rgb(0,0,122)] text-white h-10 px-4 text-sm rounded-full shadow-md
                 hover:scale-105 transition duration-300 ease-in-out
                 hover:bg-[#3AB33A] flex items-center justify-center gap-2
                 sm:w-32 md:w-28"
            >
              Sign Up
            </button>

            {showSignupDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48 z-50">
                <button
                  onClick={() => handleSignupOptionClick("customer")}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,0,122)] transition-colors duration-200"
                >
                  <User size={20} color="#3AB33A" />
                  Customer
                </button>

                <button
                  onClick={() => handleSignupOptionClick("fundi")}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,0,122)] transition-colors duration-200"
                >
                  <PencilRuler size={20} color="#3AB33A" />
                  Fundi
                </button>

                <button
                  onClick={() => handleSignupOptionClick("professional")}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,0,122)] transition-colors duration-200"
                >
                  <SquareUser size={20} color="#3AB33A" />
                  Professional
                </button>

                <button
                  onClick={() => handleSignupOptionClick("contractor")}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,0,122)] transition-colors duration-200"
                >
                  <HardHat size={20} color="#3AB33A" />
                  Contractor
                </button>

                <button
                  onClick={() => handleSignupOptionClick("hardware")}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,0,122)] transition-colors duration-200"
                >
                  <Store size={20} color="#3AB33A" />
                  Hardware
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleHelpClick}
            className="bg-[rgb(0,0,122)] text-white h-10 px-4 text-sm rounded-full shadow-md
               hover:scale-105 transition duration-300 ease-in-out
               hover:bg-[#3AB33A] flex items-center justify-center gap-2
               sm:w-32 md:w-28"
          >
            Help
          </button>
        </div>

        <div className="sm:hidden">
          <button
            className="hover:cursor-pointer"
            type="button"
            onClick={handleClick}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-16 right-2 rounded-lg w-48 bg-gray-200 shadow-md flex flex-col items-center space-y-2 p-4 md:hidden">
            {menuButtons.map((text, index) => {
              if (text === "Sign Up") {
                return (
                  <div
                    key={index}
                    className="relative w-full"
                    ref={mobileDropdownRef}
                  >
                    <button
                      type="button"
                      className="bg-[rgb(0,0,122)] text-white min-h-[48px] py-2 px-6 rounded-full shadow-md hover:scale-110 hover:transition duration-900 ease-in-out hover:bg-[#FFD700] hover:text-black hover:cursor-pointer flex items-center justify-center w-full gap-2"
                      onClick={handleMobileSignupClick}
                    >
                      {text}
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${showMobileSignupDropdown ? "rotate-180" : ""}`}
                      />
                    </button>
                    {showMobileSignupDropdown && (
                      <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <button
                          onClick={() => handleSignupOptionClick("customer")}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,0,122)] transition-colors duration-200"
                        >
                          Customer
                        </button>
                        <button
                          onClick={() => handleSignupOptionClick("fundi")}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,0,122)] transition-colors duration-200"
                        >
                          Fundi
                        </button>
                        <button
                          onClick={() =>
                            handleSignupOptionClick("professional")
                          }
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,0,122)] transition-colors duration-200"
                        >
                          Professional
                        </button>
                        <button
                          onClick={() => handleSignupOptionClick("contractor")}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,0,122)] transition-colors duration-200"
                        >
                          Contractor
                        </button>
                        <button
                          onClick={() => handleSignupOptionClick("hardware")}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,0,122)] transition-colors duration-200"
                        >
                          Hardware
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <button
                  type="button"
                  key={index}
                  className="bg-[rgb(0,0,122)] text-white min-h-[48px] py-2 px-6 rounded-full shadow-md hover:scale-110 hover:transition duration-900 ease-in-out hover:bg-[#FFD700] hover:text-black hover:cursor-pointer flex items-center justify-center w-full"
                  onClick={handleMenuButtonClick.bind(null, index)}
                >
                  {text}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="flex-grow py-8 px-6 flex flex-col items-center justify-center text-center bg-gray-100"
      >
        <div className="max-w-4xl">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
            A One-Stop Construction Platform
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-28">
            JaGedo seamlessly connects customers and builders to other builders:
            fundis, professionals, contractors, and hardware suppliers in your
            locality.
          </p>
        </div>
      </motion.div>
      <motion.div ref={section1Ref} className="py-10 text-center">
        <button
          type="button"
          onClick={handleSignupForFreeClick}
          className="bg-[rgb(0,0,122)] text-white py-3 px-8 rounded-md shadow-lg hover:scale-110 hover:transition duration-900 ease-in-out hover:bg-[#3AB33A] hover:cursor-pointer text-lg font-medium transition-all"
        >
          Sign Up For Free
        </button>
      </motion.div>

      {/* Signup Options Section */}
      {showSignupSection && (
        <motion.div
          ref={signupSectionRef}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-50 py-12 px-6"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <button
                onClick={() => handleSignupOptionClick("customer")}
                className="flex items-center gap-2 px-6 py-4 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 hover:scale-105 transition-all duration-300 border-2 border-blue-700"
              >
                <User size={30} color="#3AB33A" />
                <span className="text-lg font-semibold text-gray-700">
                  Customer
                </span>
              </button>

              <button
                onClick={() => handleSignupOptionClick("fundi")}
                className="flex items-center gap-2 px-6 py-4 bg-white rounded-lg shadow-md hover:shadow-md hover:bg-gray-50 hover:scale-105 transition-all duration-300 border-2 border-blue-700"
              >
                <PencilRuler size={30} color="#3AB33A" />
                <span className="text-lg font-semibold text-gray-700">
                  Fundi
                </span>
              </button>

              <button
                onClick={() => handleSignupOptionClick("professional")}
                className="flex items-center gap-2 px-6 py-4 bg-white rounded-lg shadow-md hover:shadow-md hover:scale-105 transition-all duration-300 border-2 border-blue-700"
              >
                <SquareUser size={30} color="#3AB33A" />
                <span className="text-lg font-semibold text-gray-700">
                  Professional
                </span>
              </button>

              <button
                onClick={() => handleSignupOptionClick("contractor")}
                className="flex items-center gap-2 px-6 py-4 bg-white rounded-lg shadow-md hover:shadow-md hover:scale-105 transition-all duration-300 border-2 border-blue-700"
              >
                <HardHat size={30} color="#3AB33A" />
                <span className="text-lg font-semibold text-gray-700">
                  Contractor
                </span>
              </button>

              <button
                onClick={() => handleSignupOptionClick("hardware")}
                className="flex items-center gap-2 px-6 py-4 bg-white rounded-lg hover:shadow-md hover:scale-105 transition-all duration-300 border-2 border-blue-700"
              >
                <Store size={30} color="#3AB33A" />
                <span className="text-lg font-semibold text-gray-700">
                  Hardware
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
<br></br>

      {/* How It Works Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="bg-white text-black py-2 flex flex-col"
      >
        {/* <h2 className="text-2xl text-center px-6 sm:text-3xl font-bold mb-4">
          How It Works
        </h2> */}
        <h2
  onClick={() => setShowHowItWorks((prev) => !prev)}
  className="text-2xl text-center px-6 sm:text-3xl font-bold mb-4 
             text-black-800 cursor-pointer hover:underline hover:text-green-600 transition"
>
  How It Works
</h2>




        <p className="text-gray-700 mt-2 text-center text-base sm:text-lg px-2 sm:px-12 mb-2">
          Seamlessly connect with fundis, professionals, contractors, and
          hardware in just a few steps.
        </p>
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-center gap-4 md:gap-10 px-10 mt-5 w-auto">
          {categories.map((category) => (
            <button
              type="button"
              key={category.name}
              onClick={() => handleCategory(category)}
              className={`bg-[rgb(0,0,122)] w-72 sm:w-40 px-6 py-2 rounded-full my-1.5 justify-center text-white shadow-md hover:cursor-pointer hover:scale-105 hover:transition duration-700 ease-in-out transition  ${
                selectedCategory === category.name
                  ? "bg-green-600 text-white"
                  : " hover:bg-gray-400"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="bg-[rgb(255, 255, 255)] p-4 hover:transition duration-700 ease-in-out md:px-4 w-4/5 sm:w-full mt-2 mx-auto">
          <div className="flex flex-col items-center justify-center text-gray-100 md:flex-row 2xl:pl-24">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center w-full justify-between p-3"
              >
                <div className="flex flex-col md:flex-row w-72 md:w-48 px-4 py-2 bg-white text-black rounded-lg justify-start items-start shadow-md relative">
                  <div className="flex absolute -top-4 -left-4 items-center justify-center w-8 h-8 bg-gray-300 border-2 border-gray-300 rounded-full text-black font-bold">
                    {step.id}
                  </div>
                  <div className="flex flex-row">
                    <h3 className="font-bold text-sm">{step.title}</h3>
                  </div>
                </div>
                {step.id !== steps.length && (
                  <span className="hidden md:inline md:gap-4 text-5xl text-gray-400">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col gap-10 w-full px-4 sm:px-6 lg:px-8 md:flex-row md:gap-1.5 xl:gap-10 xl:max-w-7xl xl:mx-auto"
          >
            <div className="flex-shrink-0 w-full md:flex-1">
              <img
                src={image}
                alt={selectedCategory}
                className="object-cover rounded-lg shadow-lg"
              />
            </div>

            <div className="bg-white p-6 hover:scale-95 hover:transition duration-700 ease-in-out md:p-8 rounded-lg shadow-md md:flex-1">
              <h3 className="text-xl font-bold mb-3 text-gray-600">Benefits</h3>
              <div className="text-gray-600 text-base leading-relaxed whitespace-pre-line">
                {benefits}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>







      <motion.footer
        className="mt-16 bg-[rgb(0,0,122)] text-white py-12 px-6"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
          <div className="space-y-3">
            <h3 className="font-bold text-xl mb-3">About Us</h3>
            <Link to="/about-us">
              <p className="hover:text-[#FFD700] cursor-pointer transition duration-300">
                JaGedo
              </p>
            </Link>
            <p
              className="hover:text-[#FFD700] cursor-pointer transition duration-300"
              onClick={() =>
                window.open(
                  "https://jagedoplatform.zohodesk.com/portal/en/newticket",
                  "_blank",
                )
              }
            >
              Helpdesk
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-xl mb-3">Quick Links</h3>
            <p
              className="hover:text-[#FFD700] cursor-pointer transition duration-300"
              onClick={() =>
                window.open(
                  "https://jagedo.s3.us-east-1.amazonaws.com/legal/Jagedo%20Terms%20of%20Service.pdf",
                  "_blank",
                )
              }
            >
              Terms Of Service
            </p>
            <p
              className="hover:text-[#FFD700] cursor-pointer transition duration-300"
              onClick={() =>
                window.open(
                  " https://jagedo.s3.us-east-1.amazonaws.com/legal/Jagedo%20Data%20Protection%20Policy.pdf",
                  "_blank",
                )
              }
            >
              Privacy and Data Protection Policy
            </p>
          </div>

          {/* Contacts Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-xl mb-3">Contacts</h3>
            <p>
              <a
                href="tel:+254113273333"
                className="text-gray-300 hover:text-[#FFD700] transition duration-300"
              >
                +254 113 273 333
              </a>
            </p>
            <p>
              <a
                href="mailto:info@jagedo.co.ke"
                className="text-[#FFD700] hover:underline transition duration-300"
              >
                info@jagedo.co.ke
              </a>
            </p>
          </div>

          {/* Social Media Links */}
          <div className="space-y-3">
            <h3 className="font-bold text-xl mb-3">Follow Us</h3>
            <div className="flex justify-center sm:justify-start space-x-5 mt-4">
              {[
                {
                  icon: FaFacebookF,
                  color: "blue-900",
                  url: "https://www.facebook.com/people/Jagedo/100093668226700/",
                },
                {
                  icon: FaXTwitter,
                  color: "blue-900",
                  url: "https://x.com/jaGedo_?t=ZO64afvms6OMvL0d1GTMkQ&amp;s=09",
                },
                {
                  icon: FaLinkedinIn,
                  color: "blue-900",
                  url: "https://www.linkedin.com/company/jagedo/",
                },
                {
                  icon: FaInstagram,
                  color: "pink-900",
                  url: "https://www.instagram.com/jagedo._/#",
                },
                {
                  icon: FaTiktok,
                  color: "gray-900",
                  url: "https://www.tiktok.com/@_jagedo",
                },
              ].map(({ icon: Icon, color, url }, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xl p-3 bg-[rgb(0,0,122)] text-white rounded-full hover:bg-[#FFD700] hover:text-${color} transition duration-300 transform hover:scale-110 shadow-md`}
                >
                  <Icon />
                </a>
              ))}
              {/* <img src={jibs} alt="logo" className="w-8 h-8 mt-2 bg-[rgb(0,0,112)] text-white rounded-full cursor-pointer hover:bg-[#FFD700] transition duration-200 hover:scale-110" /> */}
            </div>
            {/* <div>
              <img src={jibs} alt="logo" className="w-6 h-6 bg-[rgb(0,0,112)]" />
            </div> */}
          </div>
        </div>
        {/* Bottom Copyright Section */}
        <div className="border-t border-gray-500 mt-12 pt-6 text-center text-sm text-gray-300">
          <p>&copy; 2025 JaGedo. All rights reserved.</p>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default Home;
