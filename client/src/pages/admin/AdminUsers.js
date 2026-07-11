import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Search, ChevronLeft, ChevronRight, Users, ShieldCheck, ShieldOff } from "lucide-react";
import AdminService from "../../services/AdminService";
import { AuthContext } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";

const PER_PAGE = 20;

const AdminUsers = () => {
    const { user: me } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => setPage(1), [search]);

    const load = () => {
        setLoading(true);
        AdminService.getUsers({ page, perPage: PER_PAGE, search })
            .then((data) => {
                setUsers(data.users);
                setPageInfo({ page: data.page, pages: data.pages, total: data.total });
            })
            .catch(() => toast.error("Failed to load users."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(load, search ? 350 : 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line
    }, [page, search]);

    const handleToggleRole = async (targetUser) => {
        const nextRole = targetUser.role === "admin" ? "user" : "admin";
        const verb = nextRole === "admin" ? "Promote" : "Remove admin access from";
        if (!window.confirm(`${verb} ${targetUser.name}?`)) return;

        setUpdatingId(targetUser.id);
        try {
            await AdminService.updateUserRole(targetUser.id, nextRole);
            toast.success(nextRole === "admin" ? "User promoted to admin." : "Admin access removed.");
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not update this user's role.");
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-display font-semibold text-ink-900 flex items-center gap-2">
                    <Users size={24} className="text-info-500" /> Manage Users
                </h1>
                <p className="text-ink-500 mt-1">Promote trusted users to admin, or remove admin access.</p>
            </div>

            <div className="flex items-center flex-1 max-w-md bg-white border border-line rounded-lg px-3">
                <Search className="text-ink-300 shrink-0" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2.5 outline-none text-sm bg-transparent"
                />
            </div>

            {loading ? (
                <PageLoader label="Loading users…" minHeight="30vh" />
            ) : users.length === 0 ? (
                <EmptyState icon={Search} title="No users found" description="Try a different search term." />
            ) : (
                <>
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-ink-500 border-b border-line uppercase text-xs">
                                        <th className="py-3 px-5 font-semibold">Name</th>
                                        <th className="py-3 px-5 font-semibold">Email</th>
                                        <th className="py-3 px-5 font-semibold">Role</th>
                                        <th className="py-3 px-5 font-semibold">Joined</th>
                                        <th className="py-3 px-5 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => {
                                        const isSelf = u.id === me?.id;
                                        return (
                                            <tr key={u.id} className="border-b border-line last:border-0">
                                                <td className="py-3 px-5 font-semibold text-ink-900">
                                                    {u.name} {isSelf && <span className="text-ink-500 font-normal">(you)</span>}
                                                </td>
                                                <td className="py-3 px-5 text-ink-700">{u.email}</td>
                                                <td className="py-3 px-5">
                                                    <Badge tone={u.role === "admin" ? "info" : "neutral"} className="capitalize">{u.role}</Badge>
                                                </td>
                                                <td className="py-3 px-5 text-ink-500 tabular-nums">
                                                    {new Date(u.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-5">
                                                    {isSelf ? (
                                                        <span className="text-xs text-ink-300">Can't change your own role</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleToggleRole(u)}
                                                            disabled={updatingId === u.id}
                                                            className={`flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50 ${u.role === "admin" ? "text-danger-500 hover:opacity-75" : "text-brand-600 hover:text-brand-700"
                                                                }`}
                                                        >
                                                            {u.role === "admin" ? (
                                                                <><ShieldOff size={15} /> Remove admin</>
                                                            ) : (
                                                                <><ShieldCheck size={15} /> Make admin</>
                                                            )}
                                                        </button>
                                                    )}
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
                                Page {pageInfo.page} of {pageInfo.pages} ({pageInfo.total} users)
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

export default AdminUsers;
