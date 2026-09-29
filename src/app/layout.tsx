import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Trailmark — Your work, accounted for.",
    template: "%s · Trailmark",
  },
  description:
    "A clear trail from field change to contractual notice. The operations workspace for Bob Builder Infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
