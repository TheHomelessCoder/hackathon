"use client";

import { useParams } from "next/navigation";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";

const VerifyPage: NextPage = () => {
  const params = useParams();
  const id = params.id as string;
  const ideaId = BigInt(id || "0");

  const { data: ideaData, isLoading, error } = useScaffoldReadContract({
    contractName: "StealMyIdea",
    functionName: "getIdea",
    args: [ideaId],
  });

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

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

  return (
    <div className="flex flex-col items-center grow bg-base-100 pt-10 px-6">
      <div className="max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="text-xs text-base-content/40">
            PROOF #{id}
          </div>
          <button
            onClick={copyUrl}
            className="btn btn-xs border border-base-300 text-base-content/60 hover:bg-base-300/20 font-mono"
          >
            copy link
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold terminal-text mb-6">
          {title}
        </h1>

        <div className="flex flex-col gap-4">
          <ProofField label="content hash" value={contentHash} mono />
          <ProofField label="author">
            <Address address={author} />
          </ProofField>
          <ProofField
            label="published"
            value={publishDate.toLocaleString("en-US", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          />
          <ProofField
            label="unix timestamp"
            value={Number(timestamp).toString()}
            mono
          />

          {hasBounty && (
            <div className="terminal-border rounded-lg p-4 mt-2">
              <div className="text-xs text-base-content/40 mb-1">
                bounty {bountyClaimed ? "(claimed)" : "(available)"}
              </div>
              <div className={`text-lg font-bold ${bountyClaimed ? "text-base-content/30 line-through" : "text-secondary"}`}>
                💰 {formatEther(bountyValue)} tokens
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 p-4 rounded-lg bg-base-200 border border-base-300">
          <h3 className="text-xs amber-text mb-2 uppercase tracking-wider">How to verify</h3>
          <ol className="text-base-content/50 text-xs space-y-2 list-decimal list-inside m-0 p-0">
            <li>Ask the author for the original idea text</li>
            <li>Hash it: <code className="text-primary">keccak256(content)</code></li>
            <li>Compare with the on-chain hash above</li>
            <li>If they match → the author published this idea before the timestamp</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

const ProofField = ({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) => (
  <div className="terminal-border rounded-lg p-4">
    <div className="text-xs text-base-content/40 mb-1">{label}</div>
    {children || (
      <div className={`text-base-content text-sm break-all ${mono ? "font-mono text-primary" : ""}`}>
        {value}
      </div>
    )}
  </div>
);

export default VerifyPage;
