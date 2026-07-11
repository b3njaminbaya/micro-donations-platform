import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { PlusCircle, Edit, Trash2, FolderHeart } from "lucide-react";
import CauseService from "../../services/CauseService";
import Card from "../../components/ui/Card";
import ProgressBar from "../../components/ui/ProgressBar";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";
import Button from "../../components/ui/Button";

const MyCauses = () => {
    const [causes, setCauses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                        return (
                            <Card key={cause.id} className="p-5">
                                <h2 className="font-display font-semibold text-lg text-ink-900 mb-3 line-clamp-1">{cause.title}</h2>
                                <ProgressBar value={progress} className="mb-2" />
                                <div className="flex justify-between text-sm text-ink-500 tabular-nums mb-4">
                                    <span><strong className="text-ink-900">${cause.raised_amount.toLocaleString()}</strong> raised</span>
                                    <span>of ${cause.goal_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-end gap-4 border-t border-line pt-3">
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
                            </Card>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default MyCauses;
