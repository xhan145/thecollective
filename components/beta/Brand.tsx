import type { ReactNode } from "react";

export function CollectiveMark({ className = "h-12 w-24", label = "Collective mark" }: { className?: string; label?: string }) {
  return (
    <svg className={className} viewBox="0 0 190 92" role="img" aria-label={label} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M95 8v30" stroke="#F2A900" strokeWidth="12" strokeLinecap="round" />
      <path d="M64 17l18 29" stroke="#F2A900" strokeWidth="10" strokeLinecap="round" />
      <path d="M126 17l-18 29" stroke="#F2A900" strokeWidth="10" strokeLinecap="round" />
      <path d="M38 32l28 18" stroke="#F2A900" strokeWidth="10" strokeLinecap="round" />
      <path d="M152 32l-28 18" stroke="#F2A900" strokeWidth="10" strokeLinecap="round" />
      <path d="M80 41v16" stroke="#FFB000" strokeWidth="7" strokeLinecap="round" />
      <path d="M110 41v16" stroke="#FFB000" strokeWidth="7" strokeLinecap="round" />
      <circle cx="95" cy="48" r="10" fill="#FFB000" />
      <circle cx="64" cy="60" r="9" fill="#FFB000" />
      <circle cx="126" cy="60" r="9" fill="#FFB000" />
      <path d="M38 77c20-13 45-16 67 0" stroke="#F2A900" strokeWidth="9" strokeLinecap="round" />
      <path d="M85 77c22-16 48-16 67 0" stroke="#F2A900" strokeWidth="9" strokeLinecap="round" />
      <path d="M71 78c14-13 34-13 48 0" stroke="#F2A900" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

export function CollectiveMiniMark({ className = "h-8 w-12" }: { className?: string }) {
  return <CollectiveMark className={className} label="Collective" />;
}

export function CollectiveWordmark() {
  return (
    <div className="flex items-center gap-2.5" aria-label="Collective">
      <CollectiveMiniMark className="h-7 w-11" />
      <span className="text-[18px] font-extrabold tracking-tight text-[#111111]">Collective</span>
    </div>
  );
}

export function CollectiveSheetHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <CollectiveMiniMark className="mx-auto h-9 w-14" />
      <h2 className="mt-3 text-[24px] font-extrabold leading-tight text-[#111111]">{title}</h2>
      {subtitle && <p className="mx-auto mt-2 max-w-[300px] text-sm leading-6 text-[#6E6E6E]">{subtitle}</p>}
    </div>
  );
}

export function CollectiveSuccessMark({ children }: { children?: ReactNode }) {
  return (
    <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#FFF1C7] text-[#F2A900] shadow-[0_18px_48px_rgba(242,169,0,0.18)]">
      {children || <span className="text-5xl leading-none">✓</span>}
    </div>
  );
}

export function CollectiveWatermark({ className = "" }: { className?: string }) {
  return <CollectiveMark className={`pointer-events-none opacity-[0.08] ${className}`} label="Collective watermark" />;
}
