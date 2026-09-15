import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, List, HeartHandshake, Wallet, Gift } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import CauseService from "../../services/CauseService";
import DonationService from "../../services/DonationService";
import RewardService from "../../services/RewardService";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import PageLoader from "../../components/ui/PageLoader";

const STATUS_TONE = { completed: "brand", pending: "gold", failed: "danger" };

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [causes, setCauses] = useState([]);
  const [donations, setDonations] = useState([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [myCauses, myDonations, myRewards] = await Promise.all([
          CauseService.getMyCauses(),
          DonationService.getMyDonations(),
          RewardService.getMine(),
        ]);
        if (isMounted) {
          setCauses(myCauses);
          setDonations(myDonations);
          setPointsBalance(myRewards.points_balance);
        }
      } catch (err) {
        // stats simply stay empty; the individual My Causes / My Donations
        // pages surface a proper error state
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);

  if (loading) return <PageLoader label="Loading your dashboard…" minHeight="60vh" />;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-ink-900">
          Welcome back, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-ink-500 mt-1">Here's what's happening with your causes today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard icon={List} label="My Causes" value={causes.length} tone="brand" />
        <StatCard icon={HeartHandshake} label="My Donations" value={donations.length} tone="brand" />
        <StatCard icon={Wallet} label="Total Donated" value={`$${totalDonated.toLocaleString()}`} tone="info" />
        <StatCard icon={Gift} label="Reward Points" value={pointsBalance} tone="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-display font-semibold text-ink-900 mb-4">Recent Donations</h2>
          {donations.length === 0 ? (
            <p className="text-sm text-ink-500">You haven't made any donations yet.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-ink-500 uppercase border-b border-line">
                <tr>
                  <th className="py-2 font-semibold">Cause</th>
                  <th className="py-2 font-semibold">Amount</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.slice(0, 5).map((d) => (
                  <tr key={d.id} className="border-b border-line last:border-0">
                    <td className="py-2.5 text-ink-700">{d.cause?.title || "—"}</td>
                    <td className="py-2.5 text-ink-900 font-semibold tabular-nums">${d.amount.toLocaleString()}</td>
                    <td className="py-2.5">
                      <Badge tone={STATUS_TONE[d.status] || "neutral"} className="capitalize">{d.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display font-semibold text-ink-900">My Causes</h2>
            <Link to="/create-cause" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              <Plus size={16} /> New Cause
            </Link>
          </div>
          {causes.length === 0 ? (
            <p className="text-sm text-ink-500">You haven't started a cause yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {causes.slice(0, 5).map((cause) => (
                <li key={cause.id} className="py-3 flex justify-between items-center">
                  <span className="text-ink-700">{cause.title}</span>
                  <Link to={`/causes/${cause.id}`} className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                    <Eye size={15} /> View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
