import Link from "next/link";
import { ArrowLeft, Route } from "lucide-react";
export default function NotFound() {
  return (
    <div className="not-found">
      <Route size={44} />
      <span className="eyebrow">A SMALL DETOUR</span>
      <h1>This trail ends here.</h1>
      <p>
        We couldn’t find that project record. Your workspace is right where you
        left it.
      </p>
      <Link href="/" className="button primary">
        <ArrowLeft size={16} />
        Back to overview
      </Link>
    </div>
  );
}
