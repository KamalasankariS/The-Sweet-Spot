import type { Metadata } from "next";
import { Inter, Love_Light, Schoolbell, Yuyu_Short, Playfair_Display, Special_Elite, WindSong, Henny_Penny, Fleur_De_Leah, Sedgwick_Ave_Display, Almendra_Display } from "next/font/google";
import "@/styles/globals.css";
import { GlobalToastWrapper } from "@/components/ui/GlobalToastWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const loveLight = Love_Light({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-love-light",
});

const schoolbell = Schoolbell({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-schoolbell",
});

const yuyuShort = Yuyu_Short({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yuyu",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-special-elite",
});

const windSong = WindSong({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-windsong",
});

const hennyPenny = Henny_Penny({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-henny-penny",
});

const fleurDeLeah = Fleur_De_Leah({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fleur-de-leah",
});

const sedgwickAveDisplay = Sedgwick_Ave_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sedgwick",
});

const almendraDisplay = Almendra_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-almendra",
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
      <body className={`${inter.variable} ${loveLight.variable} ${schoolbell.variable} ${yuyuShort.variable} ${playfairDisplay.variable} ${specialElite.variable} ${windSong.variable} ${hennyPenny.variable} ${fleurDeLeah.variable} ${sedgwickAveDisplay.variable} ${almendraDisplay.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <GlobalToastWrapper />
      </body>
    </html>
  );
}

