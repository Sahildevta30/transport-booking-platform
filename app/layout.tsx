import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Transport Booking Platform",
    template: "%s | Transport Booking Platform",
  },
  description:
    "Book seats or whole vehicles across taxis, buses, cars, and tempo travellers.",
};

// Deliberately using the system font stack (see app/globals.css --font-sans)
// instead of next/font/google: it removes a Google Fonts network
// dependency from every build, which matters in offline/restricted CI
// environments and avoids a runtime fetch for something purely cosmetic.
// Swap in next/font/local with self-hosted font files if a specific
// brand typeface is chosen later.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
