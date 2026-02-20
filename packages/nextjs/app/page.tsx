"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { data: ideaCount } = useScaffoldReadContract({
    contractName: "StealMyIdea",
    functionName: "ideaCount",
  });

  return (
    <div className="flex flex-col items-center grow bg-base-100">
      <div className="flex flex-col items-center justify-center px-6 pt-20 pb-16 max-w-3xl text-center">
        <div className="mb-2 text-primary/40 text-sm tracking-widest uppercase">
          proof-of-authorship protocol
        </div>
        <h1 className="text-4xl md:text-6xl font-bold terminal-text glow-text mb-4 leading-tight">
          Here&apos;s my idea.
        </h1>
        <p className="text-xl md:text-2xl text-base-content/80 mb-2">
          If you build it, I have proof I published it first.
        </p>
        <p className="text-sm amber-text mb-10">
          Timestamped. Immutable. On Polkadot.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/write"
            className="btn terminal-border text-primary hover:bg-primary/10 font-mono text-base px-8"
          >
            $ write --idea
          </Link>
          <Link
            href={ideaCount && Number(ideaCount) > 0 ? `/verify/${Number(ideaCount)}` : "/ideas"}
            className="btn border border-secondary/50 text-secondary hover:bg-secondary/10 font-mono text-base px-8"
          >
            $ verify --proof
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md px-6 py-8 text-center">
        <div className="terminal-border rounded-lg p-6">
          <div className="text-5xl font-bold terminal-text glow-text mb-2">
            {ideaCount !== undefined ? Number(ideaCount).toString() : "—"}
          </div>
          <div className="text-base-content/50 text-sm">
            ideas proven on-chain
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl px-6 py-12">
        <h2 className="text-center text-lg amber-text mb-8 tracking-wider uppercase">
          How it works
        </h2>
        <div className="flex flex-col gap-6">
          <Step
            command="write"
            description="Write your idea locally. It never leaves your machine."
          />
          <Step
            command="prove"
            description="Publish a cryptographic proof on Polkadot. Only the hash goes on-chain."
          />
          <Step
            command="share"
            description="Share your proof link. Anyone can verify you published first."
          />
        </div>
      </div>

      <div className="w-full max-w-2xl px-6 pb-20 text-center">
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-6">
          <p className="text-accent font-bold text-lg mb-1">
            💰 Attach a bounty
          </p>
          <p className="text-base-content/50 text-sm m-0">
            Think someone should build your idea? Attach native tokens as a bounty.
            <br />
            Release it when someone delivers.
          </p>
        </div>
      </div>
    </div>
  );
};

const Step = ({ command, description }: { command: string; description: string }) => (
  <div className="flex items-start gap-4">
    <div className="terminal-border rounded px-3 py-2 bg-base-200 shrink-0">
      <span className="text-primary font-mono text-sm">$ {command}</span>
    </div>
    <p className="text-base-content/70 text-sm m-0 pt-2">
      {description}
    </p>
  </div>
);

export default Home;
