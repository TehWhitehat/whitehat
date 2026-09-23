"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { docPages } from "./content";
export function DocsNavigation() { const path=usePathname();return <nav aria-label="Documentation">{["Start here","Analysis","Protocol","Reference"].map(group=><div className="docs-nav-group" key={group}><p>{group}</p>{docPages.filter(p=>p.group===group).map(p=>{const href="/docs"+(p.slug?"/"+p.slug:"");return <Link key={href} href={href} aria-current={path===href?"page":undefined} onClick={e=>e.currentTarget.closest("details")?.removeAttribute("open")}>{p.title}</Link>;})}</div>)}</nav>; }
