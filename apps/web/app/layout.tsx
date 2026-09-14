import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "../components/wallet-provider";

export const metadata: Metadata = {
  title: "WHITEHAT — Autonomous DeFi Security",
  description: "Discover targets. Deploy intelligence. Defend DeFi. Explore the Whitehat security network concept.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><WalletProvider>{children}</WalletProvider></body></html>;
}
