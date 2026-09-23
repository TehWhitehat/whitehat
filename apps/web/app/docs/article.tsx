import { ProductionToken } from "../../components/production-token";
import {socialLinks} from "../../components/social-links";
import Link from "next/link";
import type {Metadata} from "next";
import deployment from "../../../../docs/deployments/robinhood-mainnet.json";
import {docPages, type DocPage} from "./content";
import {CopyAddress} from "./copy-address";
import {AgentPipeline} from "./agent-pipeline";
const anchor=(title:string)=>title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export function docsMetadata(page:DocPage):Metadata{return {title:page.slug?page.title+" | WHITEHAT Docs":"WHITEHAT Docs — DeFi Security Intelligence",description:page.description,alternates:{canonical:"https://whitehat.run/docs"+(page.slug?"/"+page.slug:"")},robots:{index:true,follow:true},openGraph:{title:page.title+" | WHITEHAT Docs",description:page.description,url:"https://whitehat.run/docs"+(page.slug?"/"+page.slug:""),type:"website"}};}
const purposes: Record<string, string> = {
  TargetRegistry: "Records first onchain Scout attribution for submitted targets.",
  BuybackVault: "Holds bounty allocations and purchased WHITEHAT tokens.",
  BuybackExecutor: "Controls buyback execution through approved operators and routes.",
  BountyDistributor: "Allocates eligible bounties: 50% to the Scout and 50% to the buyback vault.",
};
function Contracts() {
  return <div className="docs-table-wrap" tabIndex={0} aria-label="Production contract directory">
    <table><caption>Robinhood Chain Mainnet / 4663</caption>
      <thead><tr><th scope="col">Contract / purpose</th><th scope="col">Address / explorer</th></tr></thead>
      <tbody>{Object.entries(deployment.contracts).map(([name, contract]) => <tr key={name}>
        <th scope="row">{name}<span className="docs-cell-detail">{purposes[name]}</span></th>
        <td><CopyAddress address={contract.address} /><a href={"https://robinhoodchain.blockscout.com/address/" + contract.address} target="_blank" rel="noopener noreferrer">View on mainnet explorer ↗</a></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
export function DocsArticle({page}:{page:DocPage}){const index=docPages.indexOf(page);return <article><header className="docs-heading"><p className="eyebrow">DOCUMENTATION / {page.group.toUpperCase()}</p><h1>{page.title}</h1><p>{page.description}</p><span className="preview-tag">PUBLIC BETA / HUMAN REVIEW REQUIRED</span></header><nav className="docs-toc" aria-label="On this page"><p className="eyebrow">ON THIS PAGE</p>{page.sections.map(s=><a key={s.title} href={"#"+anchor(s.title)}>{s.title}</a>)}</nav>{page.sections.map(s=><section key={s.title} id={anchor(s.title)}><h2>{s.title}</h2>{s.text?.map(t=><p key={t}>{t}</p>)}{((page.slug==="contracts"&&s.title==="$WHITEHAT")||(page.slug==="token"&&s.title==="$WHITEHAT Production CA"))&&<ProductionToken/>}{s.pipeline&&<AgentPipeline/>}{s.steps&&<ol className="docs-flow">{s.steps.map(t=><li key={t}>{t}</li>)}</ol>}{s.rows&&<div className="docs-table-wrap" tabIndex={0} aria-label={s.title}><table><caption>{s.title}</caption><tbody>{s.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th scope="row" key={j}>{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}{s.links&&<div className="docs-related">{s.links.map(([label,slug])=><Link key={slug} href={"/docs/"+slug}>{label} →</Link>)}</div>}{page.slug==="contracts"&&s.title==="Robinhood Chain Mainnet"&&<Contracts/>}</section>)}{page.slug==="links"&&<ul className="docs-official">{[["WHITEHAT website","https://whitehat.run"],...socialLinks,["$WHITEHAT on Pons",deployment.productionToken.ponsUrl],["$WHITEHAT mainnet token",deployment.productionToken.explorerUrl],["Robinhood Chain mainnet explorer","https://robinhoodchain.blockscout.com"],["Robinhood Chain Testnet explorer","https://explorer.testnet.chain.robinhood.com"]].map(([name,url])=><li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{name} ↗</a></li>)}</ul>}<footer className="docs-pagination">{index>0&&<Link href={"/docs"+(docPages[index-1].slug?"/"+docPages[index-1].slug:"")}>← {docPages[index-1].title}</Link>}{index<docPages.length-1&&<Link href={"/docs/"+docPages[index+1].slug}>{docPages[index+1].title} →</Link>}</footer></article>;}
