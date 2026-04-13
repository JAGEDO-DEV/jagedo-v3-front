import { useEffect, useState, useRef } from "react";
import { assets } from "../../assets/assets";
import { useNavigate, Link } from "react-router-dom";

const PUBLIC_LINKS = [
    { name: "Products", route: "/customer/hardware_shop", kind: "route" },
    { name: "About Us", targetId: "About", kind: "scroll" },
    { name: "Events", url: "https://jbis.vercel.app/", kind: "external" },
];

const ACTION_BUTTONS = [
    { name: "Login", route: "/login" },
    { name: "Sign Up", route: "/" },
    { name: "Help", url: "https://jagedoplatform.zohodesk.com/portal/en/newticket" },
];

const Navbar = () => {
    const navigate = useNavigate();
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [, setOpenSubMenu] = useState(null);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = showMobileMenu ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showMobileMenu]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target)
            ) {
                setShowMobileMenu(false);
                setOpenSubMenu(null);
            }
        };

        const handleEscape = (e) => {
            if (e.key === "Escape") {
                setShowMobileMenu(false);
                setOpenSubMenu(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleScroll = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setShowMobileMenu(false);
        setOpenSubMenu(null);
    };

    const handleLinkClick = (item) => {
        if (item.kind === "scroll") {
            handleScroll(item.targetId || item.name.replace(/\s+/g, ""));
        } else if (item.kind === "external") {
            window.open(item.url, "_blank");
            setShowMobileMenu(false);
            setOpenSubMenu(null);
        } else {
            navigate(item.route);
            setShowMobileMenu(false);
            setOpenSubMenu(null);
        }
    };

    const handleActionClick = (item) => {
        if (item.url) {
            window.open(item.url, "_blank");
        } else {
            navigate(item.route);
        }
        setShowMobileMenu(false);
        setOpenSubMenu(null);
    };

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-sm transition-shadow duration-300 ${
                isScrolled ? "shadow-md" : ""
            }`}
        >
            <div className="container mx-auto flex items-center justify-between gap-4 py-4 px-6 md:px-12 lg:px-16">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Link to="/">
                        <img
                            src="/Sub-landing/hero.png"
                            alt="JaGedo Logo"
                            className="h-16 w-auto rounded-full"
                            aria-hidden="true"
                        />
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex flex-1 items-center justify-between ml-8">
                    <div className="flex items-center gap-6 md:gap-10">
                        {PUBLIC_LINKS.map((item) => {
                            if (item.kind === "scroll") {
                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => handleLinkClick(item)}
                                        className="text-[rgb(0,0,122)] font-semibold cursor-pointer hover:underline hover:text-[#3AB33A] transition bg-transparent p-0"
                                    >
                                        {item.name}
                                    </button>
                                );
                            }

                            if (item.kind === "external") {
                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => handleLinkClick(item)}
                                        className="text-[rgb(0,0,122)] font-semibold cursor-pointer hover:underline hover:text-[#3AB33A] transition bg-transparent p-0"
                                    >
                                        {item.name}
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={item.name}
                                    to={item.route}
                                    className="text-[rgb(0,0,122)] font-semibold cursor-pointer hover:underline hover:text-[#3AB33A] transition"
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3">
                        {ACTION_BUTTONS.map((item) => (
                            <button
                                key={item.name}
                                type="button"
                                onClick={() => handleActionClick(item)}
                                className="bg-[rgb(0,0,122)] text-white h-10 px-4 text-sm rounded-full shadow-md hover:scale-105 transition duration-300 ease-in-out hover:bg-[#3AB33A] flex items-center justify-center sm:w-32 md:w-28"
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setShowMobileMenu((prev) => !prev)}
                    ref={buttonRef}
                    className="md:hidden p-3 bg-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Open menu"
                    aria-expanded={showMobileMenu}
                >
                    <img
                        src={assets.menu_bar}
                        alt="Menu icon"
                        className="w-8"
                    />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 z-50 md:hidden flex justify-end transition-opacity duration-300 ${
                    showMobileMenu
                        ? "bg-black/30"
                        : "pointer-events-none opacity-0"
                }`}
                role="dialog"
                aria-modal="true"
            >
                <div
                    ref={menuRef}
                    className={`bg-white w-[85%] h-full shadow-lg transform transition-transform duration-300 ease-in-out ${
                        showMobileMenu ? "translate-x-0" : "translate-x-full"
                    } p-6 flex flex-col gap-6`}
                >
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowMobileMenu(false)}
                            aria-label="Close menu"
                            className="p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                        >
                            <img
                                src={assets.cross_icon}
                                alt="Close menu"
                                className="w-6"
                            />
                        </button>
                    </div>

                    <nav aria-label="Mobile navigation" className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3 border-b border-gray-200 pb-5">
                            {PUBLIC_LINKS.map((item) => {
                                if (item.kind === "scroll" || item.kind === "external") {
                                    return (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => handleLinkClick(item)}
                                            className="w-full text-left text-[rgb(0,0,122)] font-semibold px-2 py-2 hover:underline hover:text-[#3AB33A] transition bg-transparent"
                                        >
                                            {item.name}
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.name}
                                        to={item.route}
                                        onClick={() => setShowMobileMenu(false)}
                                        className="w-full text-left text-[rgb(0,0,122)] font-semibold px-2 py-2 hover:underline hover:text-[#3AB33A] transition"
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="flex flex-col gap-3">
                            {ACTION_BUTTONS.map((item) => (
                                <button
                                    key={item.name}
                                    type="button"
                                    onClick={() => handleActionClick(item)}
                                    className="w-full block text-center bg-[rgb(0,0,122)] text-white py-3 px-6 rounded-full shadow-md hover:scale-105 hover:bg-[#3AB33A] hover:text-white transition duration-300 ease-in-out"
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
