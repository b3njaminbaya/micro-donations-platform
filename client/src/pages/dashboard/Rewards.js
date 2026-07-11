import { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Gift, Award, Trash2, Plus } from "lucide-react";
import RewardService from "../../services/RewardService";
import { AuthContext } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";

const Rewards = () => {
    const { user } = useContext(AuthContext);
    const [catalog, setCatalog] = useState([]);
    const [mine, setMine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [redeemingId, setRedeemingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [newReward, setNewReward] = useState({ title: "", description: "", points_required: "" });
    const [creating, setCreating] = useState(false);

    const load = async () => {
        try {
            const [catalogData, mineData] = await Promise.all([
                RewardService.getCatalog(),
                RewardService.getMine(),
            ]);
            setCatalog(catalogData);
            setMine(mineData);
        } catch (err) {
            toast.error("Failed to load rewards.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleRedeem = async (rewardId) => {
        setRedeemingId(rewardId);
        try {
            await RewardService.redeem(rewardId);
            toast.success("Reward redeemed!");
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not redeem this reward.");
        } finally {
            setRedeemingId(null);
        }
    };

    const handleDelete = async (rewardId) => {
        if (!window.confirm("Remove this reward from the catalog?")) return;
        setDeletingId(rewardId);
        try {
            await RewardService.deleteReward(rewardId);
            toast.success("Reward removed.");
            load();
        } catch (err) {
            toast.error("Could not remove this reward.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await RewardService.createReward({
                ...newReward,
                points_required: Number(newReward.points_required),
            });
            toast.success("Reward added to the catalog.");
            setNewReward({ title: "", description: "", points_required: "" });
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not add this reward.");
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <PageLoader label="Loading rewards…" minHeight="40vh" />;

    return (
        <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-2xl font-display font-semibold text-ink-900 flex items-center gap-2">
                    <Gift size={24} className="text-gold-500" /> Rewards
                </h1>
                <Card className="!shadow-none !border-gold-100 bg-gold-50 px-5 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">Points balance</p>
                    <p className="text-2xl font-display font-semibold text-ink-900 tabular-nums">{mine?.points_balance ?? 0}</p>
                </Card>
            </div>

            {user?.role === "admin" && (
                <Card className="p-5 border-gold-100">
                    <h2 className="font-display font-semibold text-ink-900 mb-3 flex items-center gap-2">
                        <Plus size={17} /> Add a Reward <span className="badge bg-ink-900/5 text-ink-500 normal-case">Admin</span>
                    </h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                            type="text"
                            placeholder="Title"
                            value={newReward.title}
                            onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                            required
                            className="field md:col-span-1"
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={newReward.description}
                            onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                            required
                            className="field md:col-span-2"
                        />
                        <input
                            type="number"
                            placeholder="Points required"
                            value={newReward.points_required}
                            onChange={(e) => setNewReward({ ...newReward, points_required: e.target.value })}
                            required
                            min="1"
                            className="field"
                        />
                        <button type="submit" disabled={creating} className="btn-gold md:col-span-4">
                            {creating ? "Adding…" : "Add Reward"}
                        </button>
                    </form>
                </Card>
            )}

            <div>
                <h2 className="font-display font-semibold text-lg text-ink-900 mb-4">Redeem Points</h2>
                {catalog.length === 0 ? (
                    <EmptyState icon={Gift} title="No rewards available yet" description="Check back soon." />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {catalog.map((reward) => {
                            const canAfford = (mine?.points_balance ?? 0) >= reward.points_required;
                            return (
                                <Card key={reward.id} className="p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-display font-semibold text-lg text-ink-900 mb-1">{reward.title}</h3>
                                        {user?.role === "admin" && (
                                            <button
                                                onClick={() => handleDelete(reward.id)}
                                                disabled={deletingId === reward.id}
                                                className="text-danger-500 hover:opacity-70 shrink-0"
                                                aria-label="Remove reward"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-ink-500 mb-3">{reward.description}</p>
                                    <p className="text-sm font-semibold text-gold-600 mb-4 tabular-nums">{reward.points_required} points</p>
                                    <button
                                        onClick={() => handleRedeem(reward.id)}
                                        disabled={!canAfford || redeemingId === reward.id}
                                        className="btn-gold w-full"
                                    >
                                        {redeemingId === reward.id
                                            ? "Redeeming…"
                                            : canAfford
                                                ? "Redeem"
                                                : "Not enough points"}
                                    </button>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {mine?.redemptions?.length > 0 && (
                <div>
                    <h2 className="font-display font-semibold text-lg text-ink-900 mb-4 flex items-center gap-2">
                        <Award size={18} /> Your Redeemed Rewards
                    </h2>
                    <Card className="p-5">
                        <ul className="divide-y divide-line">
                            {mine.redemptions.map((r) => (
                                <li key={r.id} className="py-3 flex justify-between text-ink-700">
                                    <span>{r.reward?.title || "—"}</span>
                                    <span className="text-sm text-ink-500">
                                        {new Date(r.redeemed_at).toLocaleDateString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            )}
        </motion.div>
    );
};

export default Rewards;
