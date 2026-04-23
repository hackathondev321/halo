import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Halo — See your entire onchain halo",
  description:
    "One dashboard for every chain. Portfolio, activity, and security insights for any wallet — powered by GoldRush.",
  openGraph: {
    title: "Halo — See your entire onchain halo",
    description:
      "One dashboard for every chain. Portfolio, activity, and security insights powered by GoldRush.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
