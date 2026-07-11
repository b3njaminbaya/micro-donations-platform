import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { Trash2, MessageCircle, ShieldCheck, ArrowLeft, Repeat } from "lucide-react";
import { toast } from "react-toastify";
import CauseService from "../../services/CauseService";
import DonationService from "../../services/DonationService";
import MpesaService from "../../services/MpesaService";
import RecurringDonationService from "../../services/RecurringDonationService";
import CommentService from "../../services/CommentService";
import { AuthContext } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import PageLoader from "../../components/ui/PageLoader";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&q=80";

const CauseDetail = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [cause, setCause] = useState(null);
    const [donations, setDonations] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [phoneNumber, setPhoneNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState("monthly");
    const [submitting, setSubmitting] = useState(false);

    const [newComment, setNewComment] = useState("");
    const [postingComment, setPostingComment] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [causeData, donationData, commentData] = await Promise.all([
                CauseService.getCauseById(id),
                DonationService.getDonationsByCause(id),
                CommentService.getComments(id),
            ]);
            setCause(causeData);
            setDonations(donationData);
            setComments(commentData);
        } catch (err) {
            setError("This cause could not be found.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // Deliberately re-runs only when the cause id changes, not when `load`
        // is redefined on every render.
        // eslint-disable-next-line
    }, [id]);

    const handleDonate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isRecurring) {
                await RecurringDonationService.create({
                    causeId: id, amount: Number(amount), phoneNumber, frequency,
                });
                toast.success(`Recurring ${frequency} donation set up — approve the M-Pesa prompt to confirm the first payment.`);
            } else {
                await MpesaService.initiateStkPush({ phoneNumber, amount: Number(amount), causeId: id });
                toast.success("Check your phone to approve the M-Pesa payment.");
            }
            setPhoneNumber("");
            setAmount("");
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not start the M-Pesa payment. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setPostingComment(true);
        try {
            const comment = await CommentService.postComment(id, newComment.trim());
            setComments((prev) => [comment, ...prev]);
            setNewComment("");
        } catch (err) {
            toast.error("Could not post your comment.");
        } finally {
            setPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await CommentService.deleteComment(commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (err) {
            toast.error("Could not delete this comment.");
        }
    };

    if (loading) return <PageLoader label="Loading cause…" minHeight="60vh" />;

    if (error || !cause) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-ink-700">{error || "This cause could not be found."}</p>
                <Link to="/causes" className="text-brand-600 hover:underline font-semibold">Back to Causes</Link>
            </div>
        );
    }

    const progress = Math.min((cause.raised_amount / cause.goal_amount) * 100, 100);

    return (
        <main className="max-w-6xl mx-auto px-6 py-10 w-full">
            <Link to="/causes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600 mb-6 transition">
                <ArrowLeft size={16} /> All causes
            </Link>

            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Badge tone="brand">{cause.category}</Badge>
                    <span className="text-sm text-ink-500">{cause.country}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-semibold text-ink-900">{cause.title}</h1>
            </div>

            <img
                src={cause.image_url || FALLBACK_IMAGE}
                alt={cause.title}
                className="rounded-2xl shadow-card w-full max-h-[420px] object-cover mb-10"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-display font-semibold text-ink-900 mb-3">About this cause</h2>
                    <p className="text-ink-700 leading-relaxed whitespace-pre-line">{cause.description}</p>
                </div>

                <div className="lg:row-span-2">
                    <Card className="p-6 lg:sticky lg:top-24">
                        <div className="mb-5">
                            <ProgressBar value={progress} className="mb-2 h-3" />
                            <div className="flex justify-between items-baseline">
                                <span className="text-2xl font-display font-semibold text-ink-900 tabular-nums">
                                    ${cause.raised_amount.toLocaleString()}
                                </span>
                                <span className="text-sm text-ink-500">of ${cause.goal_amount.toLocaleString()} goal</span>
                            </div>
                        </div>

                        <h3 className="text-base font-semibold text-ink-900 mb-4">Make a donation</h3>
                        {user ? (
                            <form onSubmit={handleDonate} className="flex flex-col gap-3">
                                <input
                                    type="tel"
                                    placeholder="M-Pesa phone number (2547XXXXXXXX)"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                    className="field"
                                />
                                <input
                                    type="number"
                                    placeholder="Amount (KSh)"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    min="1"
                                    className="field"
                                />
                                <div className="grid grid-cols-2 gap-1 p-1 bg-paper-alt rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setIsRecurring(false)}
                                        className={`py-2 rounded-md text-sm font-semibold transition-colors ${!isRecurring ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
                                            }`}
                                    >
                                        One-time
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsRecurring(true)}
                                        className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition-colors ${isRecurring ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
                                            }`}
                                    >
                                        <Repeat size={14} /> Recurring
                                    </button>
                                </div>

                                {isRecurring && (
                                    <div className="grid grid-cols-2 gap-1 p-1 bg-paper-alt rounded-lg">
                                        {["weekly", "monthly"].map((f) => (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() => setFrequency(f)}
                                                className={`py-2 rounded-md text-sm font-medium capitalize transition-colors ${frequency === f ? "bg-white text-brand-700 shadow-sm" : "text-ink-500 hover:text-ink-700"
                                                    }`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button type="submit" disabled={submitting} className="btn-primary w-full mt-1">
                                    {submitting ? "Starting payment…" : isRecurring ? `Start ${frequency} donation` : "Donate Now"}
                                </button>
                                <p className="flex items-center gap-1.5 text-xs text-ink-500 justify-center mt-1">
                                    <ShieldCheck size={14} /> Paid securely via M-Pesa
                                </p>
                            </form>
                        ) : (
                            <div className="text-center py-2">
                                <p className="text-ink-500 text-sm mb-4">You need an account to donate.</p>
                                <div className="flex justify-center gap-3">
                                    <Link to="/register" className="btn-primary flex-1">Register</Link>
                                    <Link to="/login" className="btn-secondary flex-1">Login</Link>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <h4 className="text-lg font-display font-semibold text-ink-900 mb-4">Recent Donations</h4>
                        {donations.length === 0 ? (
                            <p className="text-ink-500 text-sm">No donations yet — be the first to support this cause.</p>
                        ) : (
                            <ul className="divide-y divide-line">
                                {donations.map((donation) => (
                                    <li key={donation.id} className="py-3 flex justify-between text-ink-700">
                                        <span>Supporter</span>
                                        <span className="text-brand-600 font-semibold tabular-nums">${donation.amount.toLocaleString()}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card className="p-6 mt-8">
                        <h4 className="text-lg font-display font-semibold text-ink-900 mb-4 flex items-center gap-2">
                            <MessageCircle size={18} /> Comments
                        </h4>

                        {user ? (
                            <form onSubmit={handlePostComment} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    placeholder="Share a word of support..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    maxLength={1000}
                                    className="field flex-1"
                                />
                                <button
                                    type="submit"
                                    disabled={postingComment || !newComment.trim()}
                                    className="btn-primary shrink-0"
                                >
                                    Post
                                </button>
                            </form>
                        ) : (
                            <p className="text-sm text-ink-500 mb-6">
                                <Link to="/login" className="text-brand-600 hover:underline font-semibold">Log in</Link> to leave a comment.
                            </p>
                        )}

                        {comments.length === 0 ? (
                            <p className="text-ink-500 text-sm">No comments yet.</p>
                        ) : (
                            <ul className="divide-y divide-line">
                                {comments.map((comment) => (
                                    <li key={comment.id} className="py-3 flex justify-between items-start gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-ink-900">{comment.author?.name || "Anonymous"}</p>
                                            <p className="text-ink-700">{comment.content}</p>
                                            <p className="text-xs text-ink-500 mt-1">
                                                {new Date(comment.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        {user && (user.id === comment.user_id || user.role === "admin") && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="text-danger-500 hover:opacity-70 shrink-0"
                                                aria-label="Delete comment"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </main>
    );
};

export default CauseDetail;
