import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Sweet Spot — Where Your Group's Tastes Meet",
  description:
    "AI-powered group outing planner that finds the cultural intersection of everyone's taste. Powered by Qloo.",
  openGraph: {
    title: "The Sweet Spot",
    description:
      "Where your group's tastes meet. Plan perfect nights out together.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
