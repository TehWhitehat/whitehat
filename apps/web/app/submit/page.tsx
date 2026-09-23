import { SocialLinks } from "../../components/social-links";
import type { Metadata } from "next";
import Link from "next/link";
import { HatLogo } from "../../components/hat-logo";
import { SiteHeader } from "../../components/site-header";
import { TargetForm } from "../../components/target-form";
import "./submit.css";

export const metadata: Metadata = {
  title: "Submit a Target — WHITEHAT",
  description: "Submit a target to the Whitehat Scout network for read-only reconnaissance and scope-approved security research.",
};

const pipeline = ["SUBMIT", "VERIFY", "INVESTIGATE", "VALIDATE", "DISCLOSE", "BOUNTY"];

export default function SubmitPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main" className="shell target-intake">
        <section className="py-14 sm:py-20" aria-labelledby="intake-title">
          <p className="eyebrow mb-7 flex items-center gap-3"><span className="h-1.5 w-1.5 bg-mint" />SCOUT NETWORK / TARGET INTAKE</p>
          <h1 id="intake-title" className="hero-title">Find the target.</h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-muted">Surface a DeFi protocol for Whitehat to investigate. If an eligible investigation results in a successful bounty, the originating Scout receives 50%.</p>
          <p className="mt-3 text-sm leading-6 text-muted">The remaining 50% is allocated to $WHITEHAT buybacks.</p>
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-[1.45fr_1fr] lg:gap-10">
          <TargetForm />
          <aside className="min-w-0 space-y-6" aria-labelledby="attribution-title">
            <section className="border border-line bg-panel">
              <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-5 sm:px-8"><h2 id="attribution-title" className="intake-label">SCOUT ATTRIBUTION</h2><HatLogo className="text-mint" width="24" height="24" /></div>
              <div className="p-6 sm:p-8">
                <p className="mb-8 font-mono text-[10px] tracking-widest text-muted">SUCCESSFUL BOUNTY</p>
                <div className="grid grid-cols-2 divide-x divide-line">
                  <div className="pr-3"><p className="text-5xl font-medium tracking-tighter sm:text-6xl">50<span className="text-3xl text-mint">%</span></p><p className="mt-4 font-mono text-[10px] tracking-wider">SCOUT</p></div>
                  <div className="pl-5"><p className="text-5xl font-medium tracking-tighter sm:text-6xl">50<span className="text-3xl text-mint">%</span></p><p className="mt-4 font-mono text-[10px] tracking-wider">$WHITEHAT BUYBACK</p></div>
                </div>
                <p className="mt-8 border-t border-line pt-6 text-sm leading-6 text-muted">The first eligible Scout to surface a target establishes attribution. Final eligibility and bounty qualification are subject to Whitehat review and the applicable protocol security program.</p>
              </div>
            </section>
            <section className="empty-state border border-line p-6 sm:p-8" aria-labelledby="pipeline-title">
              <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><h2 id="pipeline-title" className="intake-label">INVESTIGATION PIPELINE</h2><span className="font-mono text-[9px] tracking-widest text-muted">PUBLIC BETA</span></div>
              <ol className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                {pipeline.map((step, index) => <li key={step}><span className="mb-2 block font-mono text-[10px] text-mint">0{index + 1}</span><span className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-wide">{step}{index < pipeline.length - 1 && <span aria-hidden="true" className="text-muted">→</span>}</span></li>)}
              </ol>
            </section>
          </aside>
        </div>

        <section className="my-14 border-y border-line py-7 sm:my-20" aria-labelledby="policy-title">
          <h2 id="policy-title" className="intake-label mb-4">WHITEHAT SECURITY POLICY</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted">Whitehat is designed for defensive research, isolated simulation, and responsible disclosure. Submission of a target does not authorize attacks against live systems.</p>
        </section>
      </main>
      <footer className="shell flex flex-wrap items-center justify-between gap-6 border-t border-line py-8"><Link href="/" className="brand flex items-center gap-3" aria-label="Whitehat home"><HatLogo /><span>WHITEHAT</span></Link><p className="text-xs text-muted">Independent security research / Public beta.</p><p className="font-mono text-[10px] tracking-widest text-muted">PUBLIC BETA</p><SocialLinks /></footer>
    </>
  );
}
