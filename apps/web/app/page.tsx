import { SocialLinks } from "../components/social-links";
import { MainnetContracts } from "../components/mainnet-contracts";
import { homepageStats } from "../lib/homepage-stats";
import { HatLogo as Mark } from "../components/hat-logo";
import { SiteHeader } from "../components/site-header";
import Link from "next/link";

export const dynamic = "force-dynamic";

const steps = [
  ["Scout submits target", "An interesting protocol. A new perspective. Anyone can surface an opportunity."],
  ["Whitehat agents investigate", "Specialist security agents research the target within its permitted scope."],
  ["Vulnerability is validated", "Findings are tested in isolation and reviewed by human security experts."],
  ["Responsible disclosure", "Validated findings go through the protocol’s authorized disclosure process."],
  ["Bounty received", "A reward follows only when the protocol accepts a finding and pays a bounty."],
];

function NetworkGraphic() {
  return <div className="network-panel" aria-label="Concept illustration: Scouts connect to Whitehat research, human validation, and disclosure" role="img">
    <div className="panel-caption"><span>RESEARCH NETWORK</span><span>CONCEPT / 001</span></div>
    <svg viewBox="0 0 480 390" className="network-svg" aria-hidden="true">
      <defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#26312c" strokeWidth=".6" /></pattern></defs>
      <rect width="480" height="390" fill="url(#grid)" />
      <g fill="none" stroke="#31493e"><path d="M65 90h70l55 65M415 90h-70l-55 65M65 300h70l55-65M415 300h-70l-55-65" /><circle cx="240" cy="195" r="143" strokeDasharray="3 8" /><path d="M240 35v61M240 294v61M35 195h106M339 195h106" /></g>
      <path d="m240 95 87 50v100l-87 50-87-50V145Z" stroke="#72bb98" fill="#101c16" />
      <path d="m240 112 72 42v82l-72 42-72-42v-82Z" stroke="#2d4d3b" fill="none" />
      <Mark x="184" y="138" width="112" height="112" className="text-mint" />
      <g fill="#a7f6cf"><circle cx="65" cy="90" r="4"/><circle cx="415" cy="90" r="4"/><circle cx="65" cy="300" r="4"/><circle cx="415" cy="300" r="4"/></g>
      <g fill="#a5b1aa" fontSize="9" fontFamily="monospace" letterSpacing="1.8"><text x="44" y="72">SCOUTS</text><text x="358" y="72">RESEARCH</text><text x="44" y="326">VALIDATION</text><text x="342" y="326">DISCLOSURE</text><text x="240" y="258" textAnchor="middle">WHITEHAT</text></g>
      <g stroke="#53665b"><path d="M9 20V9h11M460 9h11v11M9 370v11h11M460 381h11v-11" /></g>
    </svg>
    <div className="panel-caption panel-bottom"><span>HUMAN INTELLIGENCE × MACHINE SCALE</span><span className="text-mint">＋</span></div>
  </div>;
}

export default async function Home() {
  const values = await homepageStats();
  const stats = ["BOUNTIES RECOVERED", "PROTOCOLS INVESTIGATED", "VALIDATED FINDINGS", "$WHITEHAT BUYBACKS"].map((label,index)=>[values[index],label]);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <SiteHeader />
    <main id="main">
      <section className="shell hero grid items-center gap-12 py-20 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:py-28" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow mb-7 flex items-center gap-3"><span className="h-1.5 w-1.5 bg-mint" />AUTONOMOUS DEFI SECURITY</p>
          <h1 id="hero-title" className="hero-title">Discover targets.<br />Deploy intelligence.<br /><span className="text-mint">Defend DeFi.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-muted">A new model for DeFi security. You find the target. Our agents do the research. Successful discoveries reward the Scout and power the Whitehat network.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link className="button button-primary" href="/submit">SUBMIT A TARGET <span aria-hidden="true">↗</span></Link>
            <Link className="button button-secondary" href="/investigations">EXPLORE INVESTIGATIONS <span aria-hidden="true">→</span></Link>
          </div>
          <p className="mt-6 font-mono text-[11px] tracking-wide text-muted">DESIGNED FOR ROBINHOOD CHAIN <span className="mx-2 text-dim">/</span> PUBLIC BETA</p>
        </div>
        <NetworkGraphic />
      </section>

      <section className="shell border-y border-line" aria-label="Live network statistics">
        <div className="flex flex-wrap justify-between gap-2 border-b border-line py-4 font-mono text-[10px] tracking-[.12em] text-muted"><span>NETWORK AT A GLANCE</span><span>LIVE DATABASE COUNTS · TESTNET PAYMENTS EXCLUDED</span></div>
        <dl className="grid grid-cols-2 lg:grid-cols-4">{stats.map(([value, label]) => <div className="stat" key={label}><dd className="text-4xl font-medium tracking-tight sm:text-5xl">{value}</dd><dt className="mt-4 font-mono text-[10px] tracking-[.1em] text-muted">{label}</dt></div>)}</dl><p className="py-3 text-xs text-muted">Counts of paid bounty records, completed investigations, human-validated findings and recorded production buybacks. No price or USD valuation is implied.</p>
      </section>

      <section id="how-it-works" className="shell section-space" aria-labelledby="network-title">
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <div><p className="eyebrow mb-5">01 / THE WHITEHAT NETWORK</p><h2 id="network-title">Good intelligence.<br />Shared rewards.</h2></div>
          <p className="max-w-md leading-7 text-muted md:justify-self-end">Security starts with knowing where to look. Whitehat connects community discovery with specialist AI research and human judgment.</p>
        </div>
        <ol className="mt-12 grid gap-px border border-line bg-line md:grid-cols-5">{steps.map(([title, description], index) => <li key={title} className="bg-panel p-6"><div className="mb-8 flex justify-between font-mono text-xs text-mint"><span>0{index + 1}</span><span aria-hidden="true">→</span></div><h3 className="min-h-12 text-base font-medium">{title}</h3><p className="mt-4 text-sm leading-6 text-muted">{description}</p></li>)}</ol>
        <div className="split-panel grid gap-8 border border-t-0 border-line p-7 sm:p-10 md:grid-cols-[1.1fr_1fr_1fr] md:items-center">
          <div><p className="eyebrow mb-4">06 / THE BOUNTY SPLIT</p><h3 className="text-xl">A simple, transparent promise.</h3><p className="mt-3 text-sm leading-6 text-muted">The bounty actually received is split equally. Whitehat’s operating costs are funded separately.</p></div>
          <div className="reward"><p className="text-6xl font-medium tracking-tighter">50<span className="text-3xl text-mint">%</span></p><p className="mt-3 font-mono text-xs tracking-wider">TO THE SCOUT</p><p className="mt-2 text-sm text-muted">For surfacing the opportunity.</p></div>
          <div className="reward"><p className="text-6xl font-medium tracking-tighter">50<span className="text-3xl text-mint">%</span></p><p className="mt-3 font-mono text-xs tracking-wider">$WHITEHAT BUYBACK</p><p className="mt-2 text-sm text-muted">Allocated to the planned token buyback.</p></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">Bounties depend on accepted findings and payment. Protocol research requires scope review. Core infrastructure is deployed on Robinhood Chain mainnet. The production token and buyback route remain pending; testnet demonstrations are labelled separately.</p>
      </section>

      <section id="investigations" className="shell pb-20" aria-labelledby="investigations-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-5">02 / RESEARCH ACTIVITY</p><h2 id="investigations-title">Built for accountability.</h2></div><span className="preview-tag">LIVE INVESTIGATIONS</span></div>
        <div className="empty-state border border-line px-6 py-14 text-center"><div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center border border-line text-mint"><Mark /></div><h3 className="text-xl">Follow the research.</h3><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">Follow saved targets, read-only reconnaissance and scope-approved investigations. Unresolved evidence stays private for human review.</p><Link href="/investigations" className="mt-6 inline-block text-sm text-mint underline decoration-mint/40 underline-offset-4">Explore live investigations <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section id="submit" className="shell pb-20" aria-labelledby="submit-title"><div className="grid gap-8 border border-line bg-panel p-8 md:grid-cols-[1.5fr_1fr] md:items-center md:p-12"><div><p className="eyebrow mb-5">HUMAN CURIOSITY. COLLECTIVE DEFENSE.</p><h2 id="submit-title">The next discovery<br />could start with you.</h2><p className="mt-5 max-w-lg leading-7 text-muted">You won’t need to write code to become a Scout. Just spot a protocol worth investigating.</p></div><div className="border-l-2 border-mint pl-6"><h3 className="text-lg">Target submissions are open.</h3><p className="mt-3 text-sm leading-6 text-muted">Connect your wallet, sign in and submit a target. Recon begins through the worker queue; deeper analysis requires scope approval.</p><Link href="/submit" className="preview-tag mt-5 text-mint">SUBMIT A TARGET</Link></div></div></section>
      <section className="shell pb-20" aria-label="Verified mainnet contracts"><h2>Onchain foundation.</h2><MainnetContracts /><Link className="mt-4 inline-block text-sm text-mint underline" href="/docs/contracts">Contract directory and deployment details ↗</Link></section>
    </main>
    <footer className="shell flex flex-wrap items-center justify-between gap-6 border-t border-line py-8"><a href="#" className="brand flex items-center gap-3" aria-label="Whitehat home"><Mark /><span>WHITEHAT</span></a><p className="text-xs text-muted">Independent security research / Public beta.</p><p className="font-mono text-[10px] tracking-widest text-muted">PUBLIC BETA / MAINNET INFRASTRUCTURE</p><SocialLinks /></footer>
  </>;
}
