"use client";
import {useState} from "react";
export function CopyAddress({address}:{address:string}){const [status,setStatus]=useState("");return <div className="docs-address"><code>{address}</code><button type="button" aria-label={"Copy address "+address} onClick={async()=>{try{await navigator.clipboard.writeText(address);setStatus("Copied");}catch{setStatus("Select the address to copy");}}}>Copy</button><span role="status">{status}</span></div>;}
