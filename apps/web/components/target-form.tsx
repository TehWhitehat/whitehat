"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useScout } from "./wallet-provider";

const emptyTarget = {
  chain: "Robinhood Chain",
  protocol: "",
  address: "",
  website: "",
  bounty: "",
  notes: "",
};

type TargetDraft = typeof emptyTarget;
type Field = keyof TargetDraft;
type Errors = Partial<Record<Field, string>>;

function isWebUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function TargetForm() {
  const router = useRouter();
  const scout = useScout();
  const [duplicate, setDuplicate] = useState<{ investigationId: string; originatingScout: string } | null>(null);
  const [values, setValues] = useState<TargetDraft>(emptyTarget);
  const [errors, setErrors] = useState<Errors>({});
  const [storageError, setStorageError] = useState("");
  const [opening, setOpening] = useState(false);
  const addressInput = useRef<HTMLInputElement>(null);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (opening) return;
    setStorageError("");
    const target = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])) as TargetDraft;
    const nextErrors: Errors = {};

    if (!/^0x[0-9a-fA-F]{40}$/.test(target.address)) {
      nextErrors.address = "Enter a valid EVM contract address.";
    }
    for (const field of ["website", "bounty"] as const) {
      if (target[field] && !isWebUrl(target[field])) {
        nextErrors[field] = "Enter a valid website URL starting with https:// or http://.";
      }
    }

    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      document.getElementById(`target-${firstError}`)?.focus();
      return;
    }
    if (!scout.wallet) { setStorageError("Connect your wallet and sign in to Whitehat using the header first."); return; }
    setOpening(true);
    try {
      const response = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...target, address: target.address.toLowerCase() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.duplicate) { setDuplicate(result); setOpening(false); return; }
      router.push(`/investigations/${result.investigationId}`);
    } catch (cause) {
      setOpening(false);
      setStorageError(cause instanceof Error ? cause.message : "Submission could not be saved. Retry shortly.");
    }
  }

  return (
    <form className="min-w-0 border border-line bg-panel" onSubmit={submit} noValidate aria-labelledby="target-details">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5 sm:px-8"><h2 id="target-details" className="intake-label">TARGET DETAILS</h2><span className="font-mono text-[9px] tracking-widest text-muted">OFFCHAIN TARGET INTAKE</span></div>
      <div className="space-y-6 p-6 sm:p-8">
        <p className="text-xs leading-5 text-muted">Contract address is required. All other text fields are optional.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div><label className="intake-label" htmlFor="target-chain">CHAIN</label><select id="target-chain" name="chain" className="intake-control" value={values.chain} onChange={(event) => update("chain", event.target.value)}><option>Robinhood Chain</option><option>Robinhood Chain Testnet</option></select></div>
          <div><label className="intake-label" htmlFor="target-protocol">PROTOCOL NAME</label><input id="target-protocol" name="protocol" className="intake-control" placeholder="e.g. Nova Finance" maxLength={160} value={values.protocol} onChange={(event) => update("protocol", event.target.value)} /></div>
        </div>
        <div>
          <label className="intake-label" htmlFor="target-address">CONTRACT ADDRESS <span className="ml-1 text-mint" aria-hidden="true">*</span></label>
          <input ref={addressInput} id="target-address" name="address" className="intake-control font-mono" placeholder="0x..." required autoComplete="off" autoCapitalize="none" spellCheck={false} value={values.address} onChange={(event) => update("address", event.target.value)} aria-invalid={Boolean(errors.address)} aria-describedby={`address-help${errors.address ? " address-error" : ""}`} />
          <p id="address-help" className="mt-2 text-xs leading-5 text-muted">0x followed by 40 hexadecimal characters. Format check only.</p>
          {errors.address && <p id="address-error" role="alert" className="intake-error">{errors.address}</p>}
        </div>
        <div>
          <label className="intake-label" htmlFor="target-website">PROTOCOL WEBSITE</label>
          <input id="target-website" name="website" className="intake-control" type="url" placeholder="https://..." maxLength={2048} autoCapitalize="none" spellCheck={false} value={values.website} onChange={(event) => update("website", event.target.value)} aria-invalid={Boolean(errors.website)} aria-describedby={errors.website ? "website-error" : undefined} />
          {errors.website && <p id="website-error" role="alert" className="intake-error">{errors.website}</p>}
        </div>
        <div>
          <label className="intake-label" htmlFor="target-bounty">BOUNTY OR SECURITY PROGRAM</label>
          <input id="target-bounty" name="bounty" className="intake-control" type="url" placeholder="https://..." maxLength={2048} autoCapitalize="none" spellCheck={false} value={values.bounty} onChange={(event) => update("bounty", event.target.value)} aria-invalid={Boolean(errors.bounty)} aria-describedby={`bounty-help${errors.bounty ? " bounty-error" : ""}`} />
          <p id="bounty-help" className="mt-2 text-xs leading-5 text-muted">If known, provide the protocol&apos;s official security or bounty program.</p>
          {errors.bounty && <p id="bounty-error" role="alert" className="intake-error">{errors.bounty}</p>}
        </div>
        <div><label className="intake-label" htmlFor="target-notes">SCOUT NOTES</label><textarea id="target-notes" name="notes" className="intake-control min-h-32 resize-y" rows={4} placeholder="Why do you think Whitehat should investigate this protocol?" maxLength={4000} value={values.notes} onChange={(event) => update("notes", event.target.value)} /></div>
        <div className="border-t border-line pt-6">
          <p className="mb-5 text-xs leading-5 text-muted">A signed-in Scout is required. Submissions are stored offchain; the original Scout cannot be overwritten by later submissions. Bounty eligibility remains subject to review.</p>
          {duplicate && <div role="status" className="mb-5 border border-line p-4 text-xs leading-6"><p className="text-mint">TARGET ALREADY REGISTERED</p><p className="break-all">Original Scout: {duplicate.originatingScout}</p><p>DATABASE RECORD RETAINED / OPEN INVESTIGATION FOR ONCHAIN STATUS</p><button type="button" className="mt-3 text-mint underline" onClick={() => router.push(`/investigations/${duplicate.investigationId}`)}>OPEN EXISTING INVESTIGATION</button></div>}
          {storageError && <p role="alert" className="intake-error mb-5">{storageError}</p>}
          <button type="submit" disabled={opening} className="button button-primary w-full cursor-pointer disabled:cursor-wait disabled:opacity-60 sm:w-auto">{opening ? "OPENING INVESTIGATION" : "SUBMIT TARGET"} <span aria-hidden="true">↗</span></button>
        </div>
      </div>
    </form>
  );
}

