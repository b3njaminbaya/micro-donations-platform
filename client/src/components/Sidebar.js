import { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Plus, List, DollarSign, User, LogOut, Gift, ArrowLeft, Menu, X, ShieldCheck, Users, Wallet } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/micro-logo.jpg";

const NAV_LINKS = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/my-causes", icon: List, label: "My Causes" },
    { path: "/create-cause", icon: Plus, label: "Create Cause" },
    { path: "/my-donations", icon: DollarSign, label: "My Donations" },
    { path: "/rewards", icon: Gift, label: "Rewards" },
    { path: "/profile", icon: User, label: "Profile" },
];

const ADMIN_LINKS = [
    { path: "/admin/causes", icon: ShieldCheck, label: "Moderate Causes" },
    { path: "/admin/users", icon: Users, label: "Manage Users" },
    { path: "/admin/payouts", icon: Wallet, label: "Payouts" },
];

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const initials = (user?.name || "?")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <>
            {/* Mobile topbar */}
            <div className={`md:hidden fixed top-0 left-0 w-full h-16 bg-ink-900 flex items-center justify-between px-4 z-30 ${open ? "invisible" : ""}`}>
                <Link to="/" className="flex items-center gap-2">
                    <img src={logo} alt="" className="h-8 w-8 rounded-full object-contain" />
                    <span className="text-white font-display font-semibold">Micro-Donations</span>
                </Link>
                <button onClick={() => setOpen(true)} className="text-white" aria-label="Open menu">
                    <Menu size={24} />
                </button>
            </div>
            <div className="md:hidden h-16" />

            {open && (
                <div
                    className="md:hidden fixed inset-0 bg-ink-900/60 z-40"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-screen w-72 bg-ink-900 text-white flex flex-col z-50 transition-transform duration-300 ease-out
                ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
            >
                <div className="flex items-center justify-between px-6 h-20 border-b border-white/10 shrink-0">
                    <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                        <img src={logo} alt="" className="h-8 w-8 rounded-full object-contain" />
                        <span className="font-display font-semibold">Micro-Donations</span>
                    </Link>
                    <button onClick={() => setOpen(false)} className="md:hidden text-white/70" aria-label="Close menu">
                        <X size={22} />
                    </button>
                </div>

                <Link
                    to="/"
                    className="flex items-center gap-2 mx-4 mt-4 px-3 py-2.5 rounded-lg text-sm font-semibold text-brand-100 bg-white/5 hover:bg-white/10 transition shrink-0"
                >
                    <ArrowLeft size={16} /> Back to site
                </Link>

                <nav className="flex-1 px-4 mt-6 space-y-1 overflow-y-auto">
                    {NAV_LINKS.map(({ path, icon: Icon, label }) => {
                        const active = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <Icon size={18} /> {label}
                            </Link>
                        );
                    })}

                    {user?.role === "admin" && (
                        <>
                            <p className="px-3 pt-5 pb-1 text-xs font-semibold uppercase tracking-wide text-white/30">Admin</p>
                            {ADMIN_LINKS.map(({ path, icon: Icon, label }) => {
                                const active = location.pathname === path;
                                return (
                                    <Link
                                        key={path}
                                        to={path}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <Icon size={18} /> {label}
                                    </Link>
                                );
                            })}
                        </>
                    )}
                </nav>

                <div className="border-t border-white/10 p-4 shrink-0">
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <span className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-semibold shrink-0">
                            {initials}
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{user?.name}</p>
                            <p className="text-xs text-white/50 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-red-300 transition"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
