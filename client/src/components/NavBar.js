import { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import Button from "./ui/Button";
import logo from "../assets/micro-logo.jpg";

const PUBLIC_LINKS = [
    { to: "/", text: "Home" },
    { to: "/causes", text: "Causes" },
];

const NavBar = () => {
    const { user, logout } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    const toggleDrawer = () => setMenuOpen((v) => !v);
    const closeDrawer = () => setMenuOpen(false);

    return (
        <>
            <nav className="fixed top-0 left-0 w-full z-50 bg-paper/90 backdrop-blur border-b border-line">
                <div className="max-w-7xl mx-auto px-6 h-[76px] flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2.5 shrink-0">
                        <img
                            src={logo}
                            alt="Micro-Donations Platform"
                            className="h-9 w-9 object-contain rounded-full ring-1 ring-line"
                        />
                        <span className="text-lg font-display font-semibold text-ink-900">
                            Micro-Donations
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {PUBLIC_LINKS.map((link) => (
                            <NavLink key={link.to} {...link} currentPath={location.pathname} />
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <Button to="/dashboard" variant="secondary" className="!py-2">
                                    <LayoutDashboard size={16} /> Dashboard
                                </Button>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-danger-500 transition"
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-semibold text-ink-700 hover:text-brand-600 transition">
                                    Log in
                                </Link>
                                <Button to="/register" variant="primary" className="!py-2">
                                    Get started
                                </Button>
                            </>
                        )}
                    </div>

                    <button onClick={toggleDrawer} className="md:hidden text-ink-900" aria-label="Toggle menu">
                        {menuOpen ? <X size={26} /> : <Menu size={26} />}
                    </button>
                </div>

                {menuOpen && (
                    <div className="md:hidden bg-paper border-t border-line px-6 py-5">
                        <ul className="space-y-4">
                            {PUBLIC_LINKS.map((link) => (
                                <MobileLink key={link.to} {...link} close={closeDrawer} currentPath={location.pathname} />
                            ))}
                            {user ? (
                                <>
                                    <MobileLink to="/dashboard" text="Dashboard" close={closeDrawer} currentPath={location.pathname} />
                                    <li>
                                        <button
                                            onClick={() => { logout(); closeDrawer(); }}
                                            className="flex items-center gap-2 text-danger-500 font-semibold"
                                        >
                                            <LogOut size={18} /> Logout
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <MobileLink to="/login" text="Log in" close={closeDrawer} currentPath={location.pathname} />
                                    <MobileLink to="/register" text="Get started" close={closeDrawer} currentPath={location.pathname} />
                                </>
                            )}
                        </ul>
                    </div>
                )}
            </nav>

            <div className="h-[76px]" />
        </>
    );
};

const NavLink = ({ to, text, currentPath }) => {
    const isActive = currentPath === to;
    return (
        <Link
            to={to}
            className={`text-sm font-semibold transition ${isActive ? "text-brand-600" : "text-ink-700 hover:text-brand-600"
                }`}
        >
            {text}
        </Link>
    );
};

const MobileLink = ({ to, text, close, currentPath }) => {
    const isActive = currentPath === to;
    return (
        <li>
            <Link
                to={to}
                onClick={close}
                className={`block text-base font-semibold ${isActive ? "text-brand-600" : "text-ink-700"}`}
            >
                {text}
            </Link>
        </li>
    );
};

export default NavBar;
