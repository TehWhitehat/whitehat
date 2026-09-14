import { internalFixtureProtocol, loadInvestigation } from "../../../lib/persistent-investigations";
import { notFound } from "next/navigation";
import { adminWallet } from "../../../lib/scout-auth";
import type { Metadata } from "next";
import { SiteHeader } from "../../../components/site-header";
import { InvestigationConsole } from "../../../components/investigation-console";
import "../console.css";

export const metadata: Metadata = { title: "Investigation Console — WHITEHAT" };

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const internal = id === "local-security-fixture" || (await loadInvestigation(id))?.targets.protocol_name === internalFixtureProtocol;
  if (internal && !(await adminWallet())) notFound();
  return <><a className="skip-link" href="#main">Skip to content</a><SiteHeader /><InvestigationConsole id={id} /></>;
}
