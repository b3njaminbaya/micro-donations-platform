import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Smartphone, ShieldCheck, Gift, ArrowRight } from "lucide-react";
import Blob from "../../components/Blob";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import CauseService from "../../services/CauseService";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80";

const STEPS = [
  {
    icon: Smartphone,
    title: "Find a cause",
    text: "Browse verified causes by category and country — education, health, water, and more.",
  },
  {
    icon: ShieldCheck,
    title: "Donate via M-Pesa",
    text: "Give any amount in seconds with an STK push to your phone. No card, no account setup for the cause.",
  },
  {
    icon: Gift,
    title: "Track your impact",
    text: "Watch the cause's progress update in real time, and earn reward points on every donation.",
  },
];

const WHY = [
  { title: "M-Pesa native", text: "Built for how East Africa actually pays — not a card form bolted on as an afterthought." },
  { title: "Full transparency", text: "Every cause shows exactly what's been raised, from whom, and toward what goal." },
  { title: "Rewards that add up", text: "Earn points on every donation, redeemable for real recognition — not just a thank-you email." },
];

const Home = () => {
  const [causes, setCauses] = useState([]);

  useEffect(() => {
    CauseService.getFeaturedCauses()
      .then((data) => setCauses(data))
      .catch(() => setCauses([]));
  }, []);

  const spotlight = causes[0];
  const spotlightProgress = spotlight ? (spotlight.raised_amount / spotlight.goal_amount) * 100 : 0;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-50">
        <Blob position="top-right" color="#CFEBE0" size={420} />
        <Blob position="bottom-left" color="#FBE7B8" size={320} />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge bg-white text-brand-700 mb-5 shadow-card">
              Powered by M-Pesa
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-ink-900 leading-[1.08] mb-6">
              Small donations,<br />sent in seconds, <em className="font-display italic text-brand-600">felt for years.</em>
            </h1>
            <p className="text-lg text-ink-700 max-w-lg mb-8 leading-relaxed">
              Support real causes across Kenya and beyond with a donation as small as you like —
              paid straight from your phone, tracked in the open.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button to="/causes" variant="primary" className="!px-6 !py-3 text-base">
                Browse Causes <ArrowRight size={18} />
              </Button>
              <Button to="/register" variant="secondary" className="!px-6 !py-3 text-base">
                Start a Cause
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            {spotlight ? (
              <Card className="p-5 md:p-6 relative z-10 rotate-1 hover:rotate-0 transition-transform duration-300">
                <img
                  src={spotlight.image_url || FALLBACK_IMAGE}
                  alt={spotlight.title}
                  className="w-full h-52 object-cover rounded-xl mb-4"
                />
                <Badge tone="brand" className="mb-2">{spotlight.category}</Badge>
                <h3 className="font-display font-semibold text-xl text-ink-900 mb-2">{spotlight.title}</h3>
                <ProgressBar value={spotlightProgress} className="mb-2" />
                <p className="text-sm text-ink-500">
                  <span className="font-semibold text-ink-900 tabular-nums">${spotlight.raised_amount.toLocaleString()}</span> raised of ${spotlight.goal_amount.toLocaleString()}
                </p>
              </Card>
            ) : (
              <Card className="p-8 text-center text-ink-500">
                Causes will appear here as soon as they're created.
              </Card>
            )}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-xl mx-auto text-center mb-14">
          <h2 className="text-3xl font-display font-semibold text-ink-900 mb-3">How it works</h2>
          <p className="text-ink-500">Three steps between finding a cause and knowing it made a difference.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white mb-5">
                <Icon size={22} />
              </div>
              <h3 className="text-lg font-display font-semibold text-ink-900 mb-2">{title}</h3>
              <p className="text-ink-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Causes */}
      {causes.length > 0 && (
        <section className="bg-paper-alt py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-display font-semibold text-ink-900 mb-2">Featured causes</h2>
                <p className="text-ink-500">One from each category, live right now.</p>
              </div>
              <Link to="/causes" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {causes.map((cause) => {
                const progress = (cause.raised_amount / cause.goal_amount) * 100;
                return (
                  <Link key={cause.id} to={`/causes/${cause.id}`}>
                    <Card className="overflow-hidden h-full hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200">
                      <img
                        src={cause.image_url || FALLBACK_IMAGE}
                        alt={cause.title}
                        className="w-full h-36 object-cover"
                      />
                      <div className="p-4">
                        <Badge tone="brand" className="mb-2">{cause.category}</Badge>
                        <h3 className="font-display font-semibold text-ink-900 mb-2 line-clamp-1">{cause.title}</h3>
                        <ProgressBar value={progress} className="mb-2" />
                        <p className="text-xs text-ink-500 tabular-nums">
                          ${cause.raised_amount.toLocaleString()} of ${cause.goal_amount.toLocaleString()}
                        </p>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Why */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {WHY.map(({ title, text }) => (
            <div key={title} className="border-t-2 border-brand-600 pt-5">
              <h3 className="font-display font-semibold text-lg text-ink-900 mb-2">{title}</h3>
              <p className="text-ink-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-900 py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-white mb-4">
            Ready to make an impact?
          </h2>
          <p className="text-lg text-white/60 mb-8">
            Every donation counts, however small. Start giving or start a cause today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button to="/causes" variant="gold" className="!px-6 !py-3 text-base">
              Browse Causes
            </Button>
            <Button to="/register" variant="ghost" className="!px-6 !py-3 text-base !text-white hover:!bg-white/10">
              Start a Cause
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
