"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { keccak256, toBytes, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface LocalIdea {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  publishedId?: number;
  txHash?: string;
}

const STORAGE_KEY = "steal-my-ideas";

function loadIdeas(): LocalIdea[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveIdeas(ideas: LocalIdea[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

const WritePage: NextPage = () => {
  const router = useRouter();
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useScaffoldWriteContract({ contractName: "StealMyIdea", disableSimulate: true });
  const { data: ideaCount, refetch: refetchIdeaCount } = useScaffoldReadContract({
    contractName: "StealMyIdea",
    functionName: "ideaCount",
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bountyAmount, setBountyAmount] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [publishState, setPublishState] = useState<"idle" | "signing" | "confirming" | "done" | "error">("idle");
  const [publishedId, setPublishedId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const contentHash = content.trim() ? keccak256(toBytes(content.trim())) : null;

  useEffect(() => {
    if (!draftId) {
      const newId = crypto.randomUUID();
      setDraftId(newId);
    }
  }, [draftId]);

  const saveDraft = useCallback(() => {
    if (!draftId || !title.trim()) return;
    const ideas = loadIdeas();
    const existingIdx = ideas.findIndex(i => i.id === draftId);
    const now = Date.now();
    const idea: LocalIdea = {
      id: draftId,
      title: title.trim(),
      content: content.trim(),
      createdAt: existingIdx >= 0 ? ideas[existingIdx].createdAt : now,
      updatedAt: now,
    };
    if (existingIdx >= 0) {
      ideas[existingIdx] = { ...ideas[existingIdx], ...idea };
    } else {
      ideas.unshift(idea);
    }
    saveIdeas(ideas);
  }, [draftId, title, content]);

  const handlePublish = async () => {
    if (!contentHash || !title.trim() || !address) return;

    setPublishState("signing");
    setErrorMsg("");

    try {
      const value = bountyAmount ? parseEther(bountyAmount) : BigInt(0);

      const result = await writeContractAsync({
        functionName: "publishIdea",
        args: [contentHash, title.trim()],
        value,
      });

      setPublishState("confirming");

      saveDraft();

      const { data: latestCount } = await refetchIdeaCount();
      const actualId = latestCount ? Number(latestCount) : 1;

      const ideas = loadIdeas();
      const idx = ideas.findIndex(i => i.id === draftId);
      if (idx >= 0) {
        ideas[idx].txHash = result as string;
        ideas[idx].publishedId = actualId;
        saveIdeas(ideas);
      }

      setPublishState("done");
      setPublishedId(actualId);
    } catch (err: unknown) {
      setPublishState("error");
      setErrorMsg(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  if (publishState === "done" && publishedId) {
    return (
      <div className="flex flex-col items-center grow bg-base-100 pt-20 px-6">
        <div className="max-w-lg w-full text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-2xl font-bold terminal-text glow-text mb-4">
            Proof published!
          </h1>
          <p className="text-base-content/60 mb-8">
            Your idea&apos;s hash is now immutably recorded on Polkadot.
          </p>
          <div className="terminal-border rounded-lg p-4 mb-8 text-left">
            <div className="text-xs text-base-content/40 mb-1">content hash</div>
            <div className="text-primary text-xs font-mono break-all">{contentHash}</div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/verify/${publishedId}`)}
              className="btn terminal-border text-primary hover:bg-primary/10 font-mono"
            >
              $ verify --proof
            </button>
            <button
              onClick={() => {
                setTitle("");
                setContent("");
                setBountyAmount("");
                setDraftId(null);
                setPublishState("idle");
                setPublishedId(null);
              }}
              className="btn border border-base-300 text-base-content/60 hover:bg-base-300/20 font-mono"
            >
              $ write --new
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center grow bg-base-100 pt-10 px-6">
      <div className="max-w-2xl w-full">
        <h1 className="text-2xl font-bold terminal-text mb-1">
          {">"} Write your idea
        </h1>
        <p className="text-base-content/40 text-sm mb-8">
          Everything stays local until you choose to publish a proof.
        </p>

        <div className="flex flex-col gap-6">
          <div>
            <label className="text-xs text-base-content/40 mb-1 block">title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="My revolutionary idea..."
              className="input input-bordered w-full bg-base-200 border-base-300 text-base-content font-mono focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-base-content/40 mb-1 block">content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe your idea in detail. This content NEVER goes on-chain — only the hash does."
              rows={8}
              className="textarea textarea-bordered w-full bg-base-200 border-base-300 text-base-content font-mono focus:border-primary resize-y"
            />
          </div>

          {contentHash && (
            <div className="terminal-border rounded-lg p-4">
              <div className="text-xs text-base-content/40 mb-1">keccak256 hash (real-time)</div>
              <div className="text-primary text-xs font-mono break-all">{contentHash}</div>
            </div>
          )}

          <div>
            <label className="text-xs text-base-content/40 mb-1 block">
              bounty <span className="text-base-content/20">(optional, in native tokens)</span>
            </label>
            <input
              type="number"
              value={bountyAmount}
              onChange={e => setBountyAmount(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.001"
              className="input input-bordered w-full bg-base-200 border-base-300 text-base-content font-mono focus:border-secondary max-w-xs"
            />
            {bountyAmount && Number(bountyAmount) > 0 && (
              <p className="text-secondary text-xs mt-1">
                💰 {bountyAmount} tokens will be locked as bounty
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={saveDraft}
              disabled={!title.trim()}
              className="btn border border-base-300 text-base-content/60 hover:bg-base-300/20 font-mono"
            >
              $ save --draft
            </button>
            <button
              onClick={handlePublish}
              disabled={!contentHash || !title.trim() || !address || isPending || publishState === "signing" || publishState === "confirming"}
              className="btn terminal-border text-primary hover:bg-primary/10 font-mono flex-1"
            >
              {publishState === "signing" && "Waiting for signature..."}
              {publishState === "confirming" && "Confirming on-chain..."}
              {(publishState === "idle" || publishState === "error") && "$ publish --prove"}
            </button>
          </div>

          {!address && (
            <p className="text-warning text-xs">
              ⚠ Connect your wallet to publish
            </p>
          )}

          {publishState === "error" && (
            <div className="rounded-lg border border-error/30 bg-error/5 p-3">
              <p className="text-error text-xs m-0 font-mono">{errorMsg || "Transaction failed"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritePage;
