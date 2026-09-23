import {docPages} from "./content";
import {DocsArticle,docsMetadata} from "./article";
export const metadata=docsMetadata(docPages[0]);
export default function Docs(){return <DocsArticle page={docPages[0]}/>;}
