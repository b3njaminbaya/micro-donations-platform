import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { PlusCircle, Edit, Trash2, FolderHeart, Wallet, ChevronDown, ChevronUp } from "lucide-react";
import CauseService from "../../services/CauseService";
import PayoutService from "../../services/PayoutService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";
import Button from "../../components/ui/Button";

const PAYOUT_STATUS_TONE = { completed: "brand", pending: "gold", failed: "danger" };

const MyCauses = () => {
    const [causes, setCauses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [openPayoutFor, setOpenPayoutFor] = useState(null);
    const [payoutForm, setPayoutForm] = useState({ amount: "", phoneNumber: "" });
    const [requesting, setRequesting] = useState(false);
    const [payoutHistory, setPayoutHistory] = useState({});
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchCauses = async () => {
        setLoading(true);
        try {
            const data = await CauseService.getMyCauses();
            setCauses(data);
            setError(null);
        } catch (err) {
            setError("Failed to load your causes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCauses();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this cause? This cannot be undone.")) return;
        try {
            await CauseService.deleteCause(id);
            setCauses((prev) => prev.filter((c) => c.id !== id));
            toast.success("Cause deleted.");
        } catch (err) {
            toast.error("Failed to delete cause.");
        }
    };

    const refreshBalancesQuietly = async () => {
        // Re-fetches causes without toggling `loading` — fetchCauses() would
        // flash the whole grid back to a full-page spinner and collapse the
        // open payout panel, which is jarring right after a submit.
        try {
            const data = await CauseService.getMyCauses();
            setCauses(data);
        } catch (err) {
            // best-effort background refresh; the visible balances just stay stale
        }
    };

    const loadPayoutHistory = async (causeId) => {
        setLoadingHistory(true);
        try {
            const data = await PayoutService.getForCause(causeId);
            setPayoutHistory((prev) => ({ ...prev, [causeId]: data }));
        } catch (err) {
            toast.error("Could not load payout history.");
        } finally {
            setLoadingHistory(false);
        }
    };

    const togglePayoutPanel = (causeId) => {
        const opening = openPayoutFor !== causeId;
        setOpenPayoutFor(opening ? causeId : null);
        setPayoutForm({ amount: "", phoneNumber: "" });
        if (opening && !payoutHistory[causeId]) {
            loadPayoutHistory(causeId);
        }
    };

    const handleRequestPayout = async (e, cause) => {
        e.preventDefault();
        const amount = Number(payoutForm.amount);
        if (!payoutForm.phoneNumber || !amount || amount <= 0) return;
        if (amount > cause.available_balance) {
            toast.error("That's more than this cause has available to withdraw.");
            return;
        }

        setRequesting(true);
        try {
            await PayoutService.request(cause.id, { amount, phoneNumber: payoutForm.phoneNumber });
            toast.success("Payout started — approve/await confirmation via M-Pesa.");
            setPayoutForm({ amount: "", phoneNumber: "" });
            refreshBalancesQuietly();
            loadPayoutHistory(cause.id);
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not start this payout.");
        } finally {
            setRequesting(false);
        }
    };

    if (loading) return <PageLoader label="Loading your causes…" minHeight="40vh" />;

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-display font-semibold text-ink-900">My Causes</h1>
                <Button to="/create-cause" variant="primary">
                    <PlusCircle size={18} /> Add New Cause
                </Button>
            </div>

            {error && <p className="text-danger-500">{error}</p>}

            {causes.length === 0 ? (
                <EmptyState
                    icon={FolderHeart}
                    title="You haven't started a cause yet"
                    description="Create one to start collecting M-Pesa donations for something you care about."
                    action={<Button to="/create-cause" variant="primary">Start a Cause</Button>}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {causes.map((cause) => {
                        const progress = (cause.raised_amount / cause.goal_amount) * 100;
                        const panelOpen = openPayoutFor === cause.id;
                        const history = payoutHistory[cause.id];
                        return (
                            <Card key={cause.id} className="p-5">
                                <h2 className="font-display font-semibold text-lg text-ink-900 mb-3 line-clamp-1">{cause.title}</h2>
                                <ProgressBar value={progress} className="mb-2" />
                                <div className="flex justify-between text-sm text-ink-500 tabular-nums mb-2">
                                    <span><strong className="text-ink-900">${cause.raised_amount.toLocaleString()}</strong> raised</span>
                                    <span>of ${cause.goal_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm tabular-nums mb-4 bg-paper-alt rounded-lg px-3 py-2">
                                    <span className="text-ink-500">Available to withdraw</span>
                                    <span className="font-semibold text-ink-900">${cause.available_balance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center gap-4 border-t border-line pt-3">
                                    <button
                                        onClick={() => togglePayoutPanel(cause.id)}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-gold-600 hover:text-gold-700"
                                    >
                                        <Wallet size={16} /> Withdraw
                                        {panelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    <div className="flex gap-4">
                                        <Link to={`/edit-cause/${cause.id}`} className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                                            <Edit size={16} /> Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(cause.id)}
                                            className="flex items-center gap-1.5 text-sm font-semibold text-danger-500 hover:opacity-75"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </div>

                                {panelOpen && (
                                    <div className="border-t border-line mt-4 pt-4">
                                        {cause.available_balance > 0 ? (
                                            <form onSubmit={(e) => handleRequestPayout(e, cause)} className="flex flex-col gap-2 mb-4">
                                                <input
                                                    type="tel"
                                                    placeholder="M-Pesa phone number (2547XXXXXXXX)"
                                                    value={payoutForm.phoneNumber}
                                                    onChange={(e) => setPayoutForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                                                    required
                                                    className="field !py-2 text-sm"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder={`Amount (up to $${cause.available_balance.toLocaleString()})`}
                                                        value={payoutForm.amount}
                                                        onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                                                        required
                                                        min="1"
                                                        max={cause.available_balance}
                                                        className="field !py-2 text-sm flex-1"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={requesting}
                                                        className="btn-gold !py-2 text-sm shrink-0"
                                                    >
                                                        {requesting ? "Sending…" : "Send"}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <p className="text-sm text-ink-500 mb-4">Nothing available to withdraw right now.</p>
                                        )}

                                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Payout history</p>
                                        {loadingHistory && !history ? (
                                            <p className="text-sm text-ink-500">Loading…</p>
                                        ) : !history || history.length === 0 ? (
                                            <p className="text-sm text-ink-500">No payouts requested yet.</p>
                                        ) : (
                                            <ul className="divide-y divide-line">
                                                {history.map((p) => (
                                                    <li key={p.id} className="py-2 flex items-center justify-between text-sm">
                                                        <span className="text-ink-700 tabular-nums">${p.amount.toLocaleString()} · {p.phone_number}</span>
                                                        <Badge tone={PAYOUT_STATUS_TONE[p.status] || "neutral"} className="capitalize">{p.status}</Badge>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default MyCauses;
