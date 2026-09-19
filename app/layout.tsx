import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TransitBook",
    template: "%s | TransitBook",
  },
  description:
    "Book cabs, cars, buses, and tempo travellers by seat or whole vehicle — a multi-vendor transport marketplace.",
};

// @fontsource-variable/manrope self-hosts the variable font as a static
// asset shipped inside the npm package -- no Google Fonts network fetch
// at build or runtime, so this keeps working in offline/restricted CI
// exactly like the previous system-font-stack choice did, while giving
// the marketplace a distinctive display typeface instead of whatever
// each OS/browser happens to ship as its default UI font.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
