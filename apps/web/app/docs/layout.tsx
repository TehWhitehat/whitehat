import type { Metadata } from "next";
import { SiteHeader } from "../../components/site-header";
import { DocsNavigation } from "./navigation";
import "./docs.css";
export const metadata: Metadata = { metadataBase: new URL("https://whitehat.run"), robots: { index: true, follow: true } };
export default function DocsLayout({children}:{children:React.ReactNode}) {
 return <><SiteHeader/><a className="skip-link" href="#docs-content">Skip to documentation</a><div className="shell docs-layout"><aside className="docs-sidebar"><p className="eyebrow">WHITEHAT / DOCUMENTATION</p><DocsNavigation/></aside><details className="docs-mobile-menu"><summary>Documentation menu</summary><DocsNavigation/></details><main id="docs-content" className="docs-content">{children}</main></div></>;
}
