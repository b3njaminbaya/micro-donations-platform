import { Link } from "react-router-dom";
import logo from "../assets/micro-logo.jpg";

const Footer = () => {
    return (
        <footer className="bg-ink-900 text-white mt-24">
            <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div>
                    <Link to="/" className="flex items-center gap-2.5 mb-3">
                        <img src={logo} alt="" className="h-8 w-8 object-contain rounded-full" />
                        <span className="font-display font-semibold text-lg">Micro-Donations</span>
                    </Link>
                    <p className="text-white/60 text-sm max-w-xs leading-relaxed">
                        Small, mobile-money-native donations that add up to real change —
                        built for East Africa, powered by M-Pesa.
                    </p>
                </div>

                <div>
                    <h5 className="text-sm font-semibold uppercase tracking-wide text-white/50 mb-4">Explore</h5>
                    <ul className="space-y-3 text-sm">
                        <li><Link to="/" className="text-white/80 hover:text-white transition">Home</Link></li>
                        <li><Link to="/causes" className="text-white/80 hover:text-white transition">Browse Causes</Link></li>
                        <li><Link to="/register" className="text-white/80 hover:text-white transition">Start a Cause</Link></li>
                    </ul>
                </div>

                <div>
                    <h5 className="text-sm font-semibold uppercase tracking-wide text-white/50 mb-4">Account</h5>
                    <ul className="space-y-3 text-sm">
                        <li><Link to="/login" className="text-white/80 hover:text-white transition">Log in</Link></li>
                        <li><Link to="/register" className="text-white/80 hover:text-white transition">Create an account</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/10">
                <p className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-white/40">
                    &copy; {new Date().getFullYear()} Micro-Donations Platform. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
