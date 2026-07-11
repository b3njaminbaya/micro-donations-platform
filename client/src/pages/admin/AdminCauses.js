import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Search, ChevronLeft, ChevronRight, ShieldCheck, Edit, Trash2 } from "lucide-react";
import CauseService from "../../services/CauseService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";

const PER_PAGE = 10;

const AdminCauses = () => {
    const [causes, setCauses] = useState([]);
    const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => setPage(1), [search]);

    const load = () => {
        setLoading(true);
        CauseService.getAllCauses({ page, perPage: PER_PAGE, search })
            .then((data) => {
                setCauses(data.causes);
                setPageInfo({ page: data.page, pages: data.pages, total: data.total });
            })
            .catch(() => toast.error("Failed to load causes."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(load, search ? 350 : 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line
    }, [page, search]);

    const handleDelete = async (cause) => {
        if (!window.confirm(`Remove "${cause.title}" from the platform? This cannot be undone.`)) return;
        setDeletingId(cause.id);
        try {
            await CauseService.deleteCause(cause.id);
            toast.success("Cause removed.");
            load();
        } catch (err) {
            toast.error("Could not remove this cause.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-display font-semibold text-ink-900 flex items-center gap-2">
                    <ShieldCheck size={24} className="text-info-500" /> Moderate Causes
                </h1>
                <p className="text-ink-500 mt-1">Every cause on the platform, regardless of who created it.</p>
            </div>

            <div className="flex items-center flex-1 max-w-md bg-white border border-line rounded-lg px-3">
                <Search className="text-ink-300 shrink-0" size={18} />
                <input
                    type="text"
                    placeholder="Search by title or description"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2.5 outline-none text-sm bg-transparent"
                />
            </div>

            {loading ? (
                <PageLoader label="Loading causes…" minHeight="30vh" />
            ) : causes.length === 0 ? (
                <EmptyState icon={Search} title="No causes found" description="Try a different search term." />
            ) : (
                <>
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-ink-500 border-b border-line uppercase text-xs">
                                        <th className="py-3 px-5 font-semibold">Cause</th>
                                        <th className="py-3 px-5 font-semibold">Creator</th>
                                        <th className="py-3 px-5 font-semibold">Progress</th>
                                        <th className="py-3 px-5 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {causes.map((cause) => {
                                        const progress = (cause.raised_amount / cause.goal_amount) * 100;
                                        return (
                                            <tr key={cause.id} className="border-b border-line last:border-0 align-top">
                                                <td className="py-3 px-5 max-w-xs">
                                                    <Link to={`/causes/${cause.id}`} className="font-semibold text-ink-900 hover:text-brand-600">
                                                        {cause.title}
                                                    </Link>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge tone="brand">{cause.category}</Badge>
                                                        <span className="text-xs text-ink-500">{cause.country}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-5 text-ink-700">{cause.creator_name || "—"}</td>
                                                <td className="py-3 px-5 w-48">
                                                    <ProgressBar value={progress} className="mb-1.5" />
                                                    <p className="text-xs text-ink-500 tabular-nums">
                                                        ${cause.raised_amount.toLocaleString()} of ${cause.goal_amount.toLocaleString()}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <div className="flex items-center gap-4">
                                                        <Link to={`/edit-cause/${cause.id}`} className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                                                            <Edit size={15} /> Edit
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(cause)}
                                                            disabled={deletingId === cause.id}
                                                            className="flex items-center gap-1.5 text-sm font-semibold text-danger-500 hover:opacity-75 disabled:opacity-50"
                                                        >
                                                            <Trash2 size={15} /> Remove
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                                Page {pageInfo.page} of {pageInfo.pages} ({pageInfo.total} causes)
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

export default AdminCauses;
