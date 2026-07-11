import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import CauseService from "../../services/CauseService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";

const CATEGORIES = ["Health", "Education", "Environment", "Water", "Emergency", "Community", "Other"];
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80";
const PER_PAGE = 9;

const selectClass =
    "px-4 py-2.5 rounded-lg border border-line bg-white text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-400";

const Causes = () => {
    const [causes, setCauses] = useState([]);
    const [countries, setCountries] = useState([]);
    const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState("All");
    const [country, setCountry] = useState("All");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        CauseService.getCountries().then(setCountries).catch(() => setCountries([]));
    }, []);

    useEffect(() => {
        setPage(1);
    }, [category, country, search]);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        const timer = setTimeout(() => {
            CauseService.getAllCauses({ page, perPage: PER_PAGE, category, country, search })
                .then((data) => {
                    if (!isMounted) return;
                    setCauses(data.causes);
                    setPageInfo({ page: data.page, pages: data.pages, total: data.total });
                    setError(null);
                })
                .catch(() => {
                    if (isMounted) setError("Failed to load causes. Please try again later.");
                })
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        }, search ? 350 : 0);

        return () => { isMounted = false; clearTimeout(timer); };
    }, [page, category, country, search]);

    const hasFilters = category !== "All" || country !== "All" || search !== "";
    const clearFilters = () => { setCategory("All"); setCountry("All"); setSearch(""); };

    const heading = useMemo(() => {
        if (loading) return "Explore Causes";
        return `${pageInfo.total} ${pageInfo.total === 1 ? "cause" : "causes"} to support`;
    }, [loading, pageInfo.total]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-14">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
            >
                <h1 className="text-3xl md:text-4xl font-display font-semibold text-ink-900 mb-2">{heading}</h1>
                <p className="text-ink-500">Filter by category or country, or search for something specific.</p>
            </motion.div>

            <div className="flex flex-wrap items-center gap-3 mb-10">
                <div className="flex items-center flex-1 min-w-[240px] bg-white border border-line rounded-lg px-3">
                    <Search className="text-ink-300 shrink-0" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title or description"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-2.5 outline-none text-sm bg-transparent"
                    />
                </div>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
                    <option value="All">All Countries</option>
                    {countries.map((ctry) => <option key={ctry} value={ctry}>{ctry}</option>)}
                </select>
                {hasFilters && (
                    <button onClick={clearFilters} className="text-sm font-semibold text-brand-600 hover:text-brand-700 px-2">
                        Clear
                    </button>
                )}
            </div>

            {error && <p className="text-danger-500 mb-6">{error}</p>}

            {loading ? (
                <PageLoader label="Loading causes…" minHeight="30vh" />
            ) : causes.length === 0 ? (
                <EmptyState
                    icon={SearchX}
                    title="No causes match your filters"
                    description="Try a different category, country, or search term."
                    action={hasFilters && (
                        <button onClick={clearFilters} className="btn-secondary">Clear filters</button>
                    )}
                />
            ) : (
                <>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {causes.map((cause) => {
                            const progress = (cause.raised_amount / cause.goal_amount) * 100;
                            return (
                                <motion.div
                                    key={cause.id}
                                    variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                                >
                                    <Link to={`/causes/${cause.id}`}>
                                        <Card className="overflow-hidden h-full hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200">
                                            <img
                                                src={cause.image_url || FALLBACK_IMAGE}
                                                alt={cause.title}
                                                className="w-full h-44 object-cover"
                                            />
                                            <div className="p-5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge tone="brand">{cause.category}</Badge>
                                                    <span className="text-xs text-ink-500">{cause.country}</span>
                                                </div>
                                                <h2 className="font-display font-semibold text-lg text-ink-900 mb-1.5 line-clamp-1">
                                                    {cause.title}
                                                </h2>
                                                <p className="text-sm text-ink-500 line-clamp-2 mb-4">{cause.description}</p>
                                                <ProgressBar value={progress} className="mb-2" />
                                                <div className="flex justify-between text-xs text-ink-500 tabular-nums">
                                                    <span><strong className="text-ink-900">${cause.raised_amount.toLocaleString()}</strong> raised</span>
                                                    <span>of ${cause.goal_amount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {pageInfo.pages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-12">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={pageInfo.page <= 1}
                                className="p-2 rounded-full border border-line disabled:opacity-40 hover:bg-white transition"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm text-ink-500 tabular-nums">
                                Page {pageInfo.page} of {pageInfo.pages}
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

export default Causes;
