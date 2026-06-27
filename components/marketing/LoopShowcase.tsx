"use client";

import { motion } from "framer-motion";
import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function LoopShowcase() {
  return (
    <Section id="how" bg="surface">
      <h2 className="text-center font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">The loop</h2>
      <p className="mx-auto mt-3 max-w-[560px] text-center text-[15px] leading-7 text-[#6E6E6E]">A calm cycle that compounds — not an endless feed to scroll.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {MARKETING.loop.map((step, i) => (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] p-4 text-center"
          >
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[#FFF1C7] text-sm font-black text-[#B07A00]">{i + 1}</div>
            <p className="mt-3 font-display text-base font-bold text-[#111111]">{step.title}</p>
            <p className="mt-1 text-[12px] leading-5 text-[#6E6E6E]">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
