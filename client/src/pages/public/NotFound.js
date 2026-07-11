import Button from "../../components/ui/Button";
import { Compass } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[70vh] px-6">
      <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 mb-6">
        <Compass size={30} />
      </span>
      <p className="font-display text-7xl font-semibold text-ink-900 mb-2">404</p>
      <h1 className="text-xl font-display font-semibold text-ink-900 mb-2">Page not found</h1>
      <p className="text-ink-500 max-w-sm mb-8">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button to="/" variant="primary">Go back home</Button>
    </div>
  );
};

export default NotFound;
