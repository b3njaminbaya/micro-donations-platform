import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HeartHandshake, Download, Repeat, XCircle, Gift, Calendar } from "lucide-react";
import DonationService from "../../services/DonationService";
import RecurringDonationService from "../../services/RecurringDonationService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";
import Button from "../../components/ui/Button";

const STATUS_TONE = { completed: "brand", pending: "gold", failed: "danger" };
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=200&q=80";

const MyDonations = () => {
    const [donations, setDonations] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const load = async () => {
        try {
            const [donationData, subscriptionData] = await Promise.all([
                DonationService.getMyDonations(),
                RecurringDonationService.getMine(),
            ]);
            setDonations(donationData);
            setSubscriptions(subscriptionData);
            setError(null);
        } catch (err) {
            setError("Failed to load your donations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleDownload = async (donationId) => {
        setDownloadingId(donationId);
        try {
            await DonationService.downloadReceipt(donationId);
        } catch (err) {
            toast.error("Could not download the receipt.");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleCancel = async (subscriptionId) => {
        if (!window.confirm("Cancel this recurring donation?")) return;
        setCancellingId(subscriptionId);
        try {
            await RecurringDonationService.cancel(subscriptionId);
            toast.success("Recurring donation cancelled.");
            load();
        } catch (err) {
            toast.error("Could not cancel this recurring donation.");
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) return <PageLoader label="Loading your donations…" minHeight="40vh" />;

    const activeSubscriptions = subscriptions.filter((s) => s.status === "active");

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-2xl font-display font-semibold text-ink-900 flex items-center gap-2">
                <HeartHandshake size={24} className="text-brand-600" /> My Donations
            </h1>

            {error && <p className="text-danger-500">{error}</p>}

            {activeSubscriptions.length > 0 && (
                <div>
                    <h2 className="font-display font-semibold text-ink-900 flex items-center gap-2 mb-4">
                        <Repeat size={17} className="text-brand-600" /> Recurring Donations
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeSubscriptions.map((sub) => (
                            <Card key={sub.id} className="p-4 flex gap-4">
                                <img
                                    src={sub.cause?.image_url || FALLBACK_IMAGE}
                                    alt=""
                                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-ink-900 truncate">{sub.cause?.title || "—"}</p>
                                        <Badge tone="gold" className="capitalize shrink-0">{sub.frequency}</Badge>
                                    </div>
                                    <p className="text-lg font-display font-semibold text-ink-900 tabular-nums mt-1">
                                        ${sub.amount.toLocaleString()}
                                    </p>
                                    <p className="flex items-center gap-1.5 text-xs text-ink-500 mt-1">
                                        <Calendar size={12} />
                                        Next charge {new Date(sub.next_run_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                        {sub.charge_count > 0 && <span>· {sub.charge_count} payment{sub.charge_count === 1 ? "" : "s"} so far</span>}
                                    </p>
                                    <button
                                        onClick={() => handleCancel(sub.id)}
                                        disabled={cancellingId === sub.id}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-danger-500 hover:opacity-75 disabled:opacity-50 mt-2"
                                    >
                                        <XCircle size={14} /> {cancellingId === sub.id ? "Cancelling…" : "Cancel"}
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <Card className="p-5">
                {donations.length === 0 ? (
                    <EmptyState
                        icon={Gift}
                        title="You haven't made any donations yet"
                        description="Support a cause and it will show up here, with a downloadable receipt."
                        action={<Button to="/causes" variant="primary">Browse Causes</Button>}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-ink-500 border-b border-line uppercase text-xs">
                                    <th className="py-2 font-semibold">Cause</th>
                                    <th className="py-2 font-semibold">Amount</th>
                                    <th className="py-2 font-semibold">Status</th>
                                    <th className="py-2 font-semibold">Date</th>
                                    <th className="py-2 font-semibold">Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donations.map((donation) => (
                                    <tr key={donation.id} className="border-b border-line last:border-0">
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={donation.cause?.image_url || FALLBACK_IMAGE}
                                                    alt=""
                                                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                                                />
                                                <Link to={`/causes/${donation.cause_id}`} className="text-ink-700 hover:text-brand-600 font-medium">
                                                    {donation.cause?.title || "—"}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="py-3 text-ink-900 font-semibold tabular-nums">${donation.amount.toLocaleString()}</td>
                                        <td className="py-3">
                                            <Badge tone={STATUS_TONE[donation.status] || "neutral"} className="capitalize">{donation.status}</Badge>
                                        </td>
                                        <td className="py-3 text-ink-500 tabular-nums">{new Date(donation.timestamp).toLocaleDateString()}</td>
                                        <td className="py-3">
                                            {donation.status === "completed" ? (
                                                <button
                                                    onClick={() => handleDownload(donation.id)}
                                                    disabled={downloadingId === donation.id}
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-full px-3 py-1.5 disabled:opacity-50 transition-colors"
                                                >
                                                    <Download size={13} />
                                                    {downloadingId === donation.id ? "Downloading…" : "Receipt"}
                                                </button>
                                            ) : (
                                                <span className="text-ink-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </motion.div>
    );
};

export default MyDonations;
