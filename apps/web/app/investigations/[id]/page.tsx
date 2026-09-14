import type { Metadata } from "next";
import { SiteHeader } from "../../../components/site-header";
import { InvestigationConsole } from "../../../components/investigation-console";
import "../console.css";

export const metadata: Metadata = { title: "Investigation Console — WHITEHAT" };

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><a className="skip-link" href="#main">Skip to content</a><SiteHeader /><InvestigationConsole id={id} /></>;
}
