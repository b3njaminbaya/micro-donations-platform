import { Loader } from "lucide-react";

const PageLoader = ({ label = "Loading…", minHeight = "50vh" }) => (
  <div className="flex flex-col items-center justify-center gap-3 text-ink-500" style={{ minHeight }}>
    <Loader className="animate-spin text-brand-500" size={28} />
    <span className="text-sm">{label}</span>
  </div>
);

export default PageLoader;
