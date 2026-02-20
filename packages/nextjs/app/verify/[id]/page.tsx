"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import type { NextPage } from "next";
import { keccak256, toBytes, formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";

const VerifyPage: NextPage = () => {
  const params = useParams();
  const id = params.id as string;
  const ideaId = BigInt(id || "0");
  const [verifyText, setVerifyText] = useState("");

  const { data: ideaData, isLoading, error } = useScaffoldReadContract({
    contractName: "StealMyIdea",
    functionName: "getIdea",
    args: [ideaId],
  });

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const userHash = verifyText.trim() ? keccak256(toBytes(verifyText.trim())) : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center grow bg-base-100 pt-20 px-6">
        <div className="text-primary terminal-text">Loading proof...</div>
      </div>
    );
  }

  if (error || !ideaData || !ideaData[1] || ideaData[1] === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="flex flex-col items-center grow bg-base-100 pt-20 px-6">
        <div className="max-w-lg w-full text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-error mb-2">Idea not found</h1>
          <p className="text-base-content/40 text-sm">
            No proof exists for ID #{id}. Check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  const [contentHash, author, timestamp, bounty, title, bountyClaimed] = ideaData;
  const publishDate = new Date(Number(timestamp) * 1000);
  const bountyValue = bounty;
  const hasBounty = bountyValue > BigInt(0);
  const hashMatch = userHash ? userHash === contentHash : null;

  return (
    <div className="flex flex-col items-center grow bg-base-100 pt-10 px-6">
      <div className="max-w-2xl w-full">

        {/* Section 1: The Claim */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-base-content/30 font-mono">PROOF #{id}</div>
            <button
              onClick={copyUrl}
              className="btn btn-xs border border-base-300 text-base-content/40 hover:bg-base-300/20 font-mono"
            >
              copy link
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold terminal-text glow-text mb-3">
            {title}
          </h1>

          <div className="flex items-center gap-2 text-base-content/60 text-sm flex-wrap mb-1">
            <span>Published by</span>
            <Address address={author} />
          </div>
          <div className="text-base-content/60 text-sm mb-3">
            on{" "}
            <span className="text-secondary">
              {publishDate.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
            </span>
          </div>
          <p className="text-base-content/40 text-xs m-0">
            This page is cryptographic proof that the author had this idea before the timestamp above.
          </p>
        </div>

        {/* Section 2: Interactive Verifier */}
        <div
          className={`rounded-lg p-5 mb-6 transition-colors ${
            hashMatch === true
              ? "border-2 border-primary bg-primary/5"
              : hashMatch === false
                ? "border-2 border-error bg-error/5"
                : "terminal-border"
          }`}
        >
          <h2 className="text-xs amber-text mb-3 uppercase tracking-wider m-0">
            Verify this proof
          </h2>

          <textarea
            value={verifyText}
            onChange={e => setVerifyText(e.target.value)}
            placeholder="Paste the original idea text here to verify authorship..."
            rows={4}
            className="textarea textarea-bordered w-full bg-base-200/50 border-base-300 text-base-content font-mono text-sm focus:border-primary resize-y mb-3"
          />

          {hashMatch === null && (
            <div className="flex items-center gap-2 text-base-content/30 text-xs">
              <span>⏳</span>
              <span>
                Paste the author&apos;s original text above to check if it
                matches the on-chain hash
              </span>
            </div>
          )}

          {hashMatch === true && (
            <div className="flex items-start gap-3 text-primary">
              <span className="text-2xl leading-none mt-0.5">✓</span>
              <div>
                <div className="font-bold text-sm">
                  Hash matches — authorship verified
                </div>
                <div className="text-xs text-primary/60 mt-1">
                  This text produces the same hash recorded on Polkadot. The
                  author provably published this idea before{" "}
                  {publishDate.toLocaleString("en-US", { dateStyle: "long" })}.
                </div>
              </div>
            </div>
          )}

          {hashMatch === false && (
            <div className="flex items-start gap-3 text-error">
              <span className="text-2xl leading-none mt-0.5">✕</span>
              <div>
                <div className="font-bold text-sm">Hash does not match</div>
                <div className="text-xs text-error/60 mt-1">
                  This text does not match the on-chain proof. Make sure you
                  have the exact original text — even a single extra space
                  changes the hash.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bounty */}
        {hasBounty && (
          <div className="terminal-border rounded-lg p-4 mb-6">
            <div className="text-xs text-base-content/40 mb-1">
              bounty {bountyClaimed ? "(claimed)" : "(available)"}
            </div>
            <div
              className={`text-lg font-bold ${
                bountyClaimed
                  ? "text-base-content/30 line-through"
                  : "text-secondary"
              }`}
            >
              💰 {formatEther(bountyValue)} tokens
            </div>
          </div>
        )}

        {/* Section 3: Raw Proof Data (collapsible) */}
        <details className="group mb-6">
          <summary className="text-xs text-base-content/30 cursor-pointer hover:text-base-content/50 font-mono mb-3 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Raw proof data
          </summary>
          <div className="flex flex-col gap-3 mt-2">
            <RawField label="on-chain hash (keccak256)" value={contentHash} />
            {userHash && (
              <RawField
                label="your text → keccak256"
                value={userHash}
                color={hashMatch === true ? "primary" : hashMatch === false ? "error" : undefined}
              />
            )}
            <RawField label="author" value={typeof author === "string" ? author : ""} />
            <RawField label="unix timestamp" value={Number(timestamp).toString()} />
          </div>
        </details>

        {/* Section 4: How It Works */}
        <div className="rounded-lg bg-base-200/50 border border-base-300 p-4 mb-10">
          <h3 className="text-xs amber-text mb-3 uppercase tracking-wider m-0">
            How this proof works
          </h3>
          <div className="flex flex-col gap-2 text-xs text-base-content/50">
            <Step n="1">
              The author wrote their idea locally — the content never left their machine
            </Step>
            <Step n="2">
              A <code className="text-primary/80 text-[11px]">keccak256</code> hash
              was published on Polkadot — an immutable, timestamped fingerprint
            </Step>
            <Step n="3">
              Anyone with the original text can verify it matches — proving the
              author had this idea before the timestamp
            </Step>
          </div>
        </div>
      </div>
    </div>
  );
};

const RawField = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "primary" | "error";
}) => (
  <div className="border border-base-300 rounded-lg p-3">
    <div className="text-[10px] text-base-content/30 mb-1">{label}</div>
    <div
      className={`text-xs font-mono break-all ${
        color === "primary"
          ? "text-primary"
          : color === "error"
            ? "text-error"
            : "text-base-content/70"
      }`}
    >
      {value}
    </div>
  </div>
);

const Step = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-2">
    <span className="text-primary shrink-0">{n}.</span>
    <span>{children}</span>
  </div>
);

export default VerifyPage;
