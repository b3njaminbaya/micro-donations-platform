import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import PayoutService from "../../services/PayoutService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";

const PER_PAGE = 20;
const STATUS_TONE = { completed: "brand", pending: "gold", failed: "danger" };
const STATUSES = ["All", "pending", "completed", "failed"];

const selectClass =
    "px-4 py-2.5 rounded-lg border border-line bg-white text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-400";

const AdminPayouts = () => {
    const [payouts, setPayouts] = useState([]);
    const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("All");
    const [page, setPage] = useState(1);

    useEffect(() => setPage(1), [status]);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        PayoutService.getAll({ page, perPage: PER_PAGE, status: status === "All" ? undefined : status })
            .then((data) => {
                if (!isMounted) return;
                setPayouts(data.payouts);
                setPageInfo({ page: data.page, pages: data.pages, total: data.total });
            })
            .catch(() => { if (isMounted) toast.error("Failed to load payouts."); })
            .finally(() => { if (isMounted) setLoading(false); });
        return () => { isMounted = false; };
    }, [page, status]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-display font-semibold text-ink-900 flex items-center gap-2">
                    <Wallet size={24} className="text-info-500" /> Payouts
                </h1>
                <p className="text-ink-500 mt-1">Every payout requested by a cause creator, across the platform.</p>
            </div>

            <div className="flex items-center gap-3">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>)}
                </select>
            </div>

            {loading ? (
                <PageLoader label="Loading payouts…" minHeight="30vh" />
            ) : payouts.length === 0 ? (
                <EmptyState icon={Wallet} title="No payouts found" description="Nothing matches this filter yet." />
            ) : (
                <>
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-ink-500 border-b border-line uppercase text-xs">
                                        <th className="py-3 px-5 font-semibold">Cause</th>
                                        <th className="py-3 px-5 font-semibold">Requested by</th>
                                        <th className="py-3 px-5 font-semibold">Amount</th>
                                        <th className="py-3 px-5 font-semibold">Phone</th>
                                        <th className="py-3 px-5 font-semibold">Status</th>
                                        <th className="py-3 px-5 font-semibold">Requested</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts.map((payout) => (
                                        <tr key={payout.id} className="border-b border-line last:border-0">
                                            <td className="py-3 px-5">
                                                <Link to={`/causes/${payout.cause_id}`} className="font-semibold text-ink-900 hover:text-brand-600">
                                                    {payout.cause?.title || "—"}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-5 text-ink-700">{payout.requested_by_name || "—"}</td>
                                            <td className="py-3 px-5 text-ink-900 font-semibold tabular-nums">${payout.amount.toLocaleString()}</td>
                                            <td className="py-3 px-5 text-ink-700 tabular-nums">{payout.phone_number}</td>
                                            <td className="py-3 px-5">
                                                <Badge tone={STATUS_TONE[payout.status] || "neutral"} className="capitalize">{payout.status}</Badge>
                                                {payout.status === "failed" && payout.failure_reason && (
                                                    <p className="text-xs text-danger-500 mt-1 max-w-xs">{payout.failure_reason}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-5 text-ink-500 tabular-nums">
                                                {new Date(payout.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {pageInfo.pages > 1 && (
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={pageInfo.page <= 1}
                                className="p-2 rounded-full border border-line disabled:opacity-40 hover:bg-white transition"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm text-ink-500 tabular-nums">
                                Page {pageInfo.page} of {pageInfo.pages} ({pageInfo.total} payouts)
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(pageInfo.pages, p + 1))}
                                disabled={pageInfo.page >= pageInfo.pages}
                                className="p-2 rounded-full border border-line disabled:opacity-40 hover:bg-white transition"
                                aria-label="Next page"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminPayouts;
