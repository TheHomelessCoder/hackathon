"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NextPage } from "next";

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

const IdeasPage: NextPage = () => {
  const [ideas, setIdeas] = useState<LocalIdea[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIdeas(loadIdeas());
  }, []);

  const deleteIdea = (id: string) => {
    const updated = ideas.filter(i => i.id !== id);
    saveIdeas(updated);
    setIdeas(updated);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center grow bg-base-100 pt-10 px-6">
      <div className="max-w-2xl w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold terminal-text mb-0">
            {">"} My Ideas
          </h1>
          <Link
            href="/write"
            className="btn btn-sm terminal-border text-primary hover:bg-primary/10 font-mono"
          >
            + new
          </Link>
        </div>

        {ideas.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 opacity-30">📝</div>
            <p className="text-base-content/40 mb-4">No ideas yet.</p>
            <Link
              href="/write"
              className="btn terminal-border text-primary hover:bg-primary/10 font-mono"
            >
              $ write --idea
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ideas.map(idea => (
              <div
                key={idea.id}
                className="terminal-border rounded-lg p-4 hover:bg-base-200/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-base-content mb-1 truncate">
                      {idea.title}
                    </h3>
                    <p className="text-base-content/40 text-xs m-0 line-clamp-2">
                      {idea.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-base-content/20 text-xs">
                        {new Date(idea.updatedAt).toLocaleDateString()}
                      </span>
                      {idea.publishedId ? (
                        <Link
                          href={`/verify/${idea.publishedId}`}
                          className="text-primary text-xs hover:underline"
                        >
                          ✓ proven #{idea.publishedId}
                        </Link>
                      ) : idea.txHash ? (
                        <span className="text-secondary text-xs">⏳ pending</span>
                      ) : (
                        <span className="text-base-content/20 text-xs">draft</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!idea.publishedId && (
                      <button
                        onClick={() => deleteIdea(idea.id)}
                        className="btn btn-xs btn-ghost text-error/50 hover:text-error hover:bg-error/10"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-base-content/20 text-xs">
            All ideas stored locally in your browser. Nothing leaves your machine.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IdeasPage;
