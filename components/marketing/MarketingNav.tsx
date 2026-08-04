"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/beta/ui";
import { CollectiveWordmark } from "@/components/beta/Brand";

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line/70 bg-bg/95 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 lg:px-8">
        <Link href="/" aria-label="Collective home"><CollectiveWordmark /></Link>
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden items-center gap-6 lg:flex">
            <a href="#how" className="text-body font-medium text-secondary hover:text-content">How it works</a>
            <a href="#ai" className="text-body font-medium text-secondary hover:text-content">AI</a>
            <a href="#vision" className="text-body font-medium text-secondary hover:text-content">Vision</a>
          </div>
          <Link href="/auth" className="hidden text-body font-medium text-secondary hover:text-content sm:block">Sign in</Link>
          <ButtonLink href="/auth">Join the closed beta</ButtonLink>
        </div>
      </nav>
    </header>
  );
}
