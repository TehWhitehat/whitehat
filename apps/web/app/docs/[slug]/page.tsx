import {notFound} from "next/navigation";
import {docPages} from "../content";
import {DocsArticle,docsMetadata} from "../article";
export const dynamicParams=false;
export function generateStaticParams(){return docPages.filter(p=>p.slug).map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const page=docPages.find(p=>p.slug===slug);return page?docsMetadata(page):{};}
export default async function Doc({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const page=docPages.find(p=>p.slug===slug);if(!page)notFound();return <DocsArticle page={page}/>;}
