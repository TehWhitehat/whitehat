import Link from "next/link";
import { WalletControl } from "./wallet-provider";
import { HatLogo } from "./hat-logo";

export function SiteHeader() {
  return (
    <header className="shell flex flex-wrap items-center justify-between gap-5 border-b border-line py-6">
      <Link href="/" aria-label="Whitehat home" className="brand flex items-center gap-3">
        <HatLogo /><span>WHITEHAT</span>
      </Link>
      <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-6 text-sm text-muted sm:gap-9">
        <Link href="/#how-it-works" className="nav-link">The network</Link>
        <Link href="/investigations" className="nav-link">Investigations</Link>
        <Link href="/submit" className="nav-link">Submit</Link><Link href="/token" className="nav-link">Token</Link><Link href="/buybacks" className="nav-link">Buybacks</Link><Link href="/admin" className="nav-link">Admin</Link>
        <span className="preview-tag hidden sm:inline-flex">PUBLIC BETA</span>
      </nav>
      <WalletControl />
    </header>
  );
}

