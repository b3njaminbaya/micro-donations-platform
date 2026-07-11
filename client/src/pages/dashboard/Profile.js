import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Gift, ArrowRight } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import RewardService from "../../services/RewardService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const [pointsBalance, setPointsBalance] = useState(null);

    useEffect(() => {
        RewardService.getMine()
            .then((data) => setPointsBalance(data.points_balance))
            .catch(() => setPointsBalance(null));
    }, []);

    const initials = (user?.name || "?")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <motion.div
            className="space-y-6 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-2xl font-display font-semibold text-ink-900">Profile</h1>

            <Card className="p-6">
                <div className="flex items-center gap-4">
                    <span className="w-16 h-16 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-display font-semibold shrink-0">
                        {initials}
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-display font-semibold text-ink-900">{user?.name}</h2>
                            {user?.role === "admin" && <Badge tone="info">Admin</Badge>}
                        </div>
                        <p className="text-sm text-ink-500">{user?.email}</p>
                        {user?.created_at && (
                            <p className="text-sm text-ink-300 mt-0.5">
                                Joined {new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {pointsBalance !== null && (
                <Link to="/rewards">
                    <Card className="flex items-center justify-between p-5 bg-gold-50 border-gold-100 hover:shadow-lift transition-shadow">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-white text-gold-600">
                                <Gift size={22} />
                            </span>
                            <div>
                                <p className="text-sm text-ink-500">Reward points</p>
                                <p className="text-xl font-display font-semibold text-ink-900 tabular-nums">{pointsBalance}</p>
                            </div>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-semibold text-gold-600">
                            View Rewards <ArrowRight size={15} />
                        </span>
                    </Card>
                </Link>
            )}

            <div className="flex justify-end">
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm font-semibold text-danger-500 hover:opacity-75"
                >
                    <LogOut size={17} /> Logout
                </button>
            </div>
        </motion.div>
    );
};

export default Profile;
