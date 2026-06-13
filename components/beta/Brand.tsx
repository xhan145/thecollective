import type { ReactNode } from "react";

// Official Collective mark — wide open C, three people, open book base.
// Single flat gold #F2A900. From Collective_Brand_Kit_LATEST.

export function CollectiveMark({ className = "h-24 w-24", label = "Collective mark" }: { className?: string; label?: string }) {
  return (
    <svg className={className} viewBox="0 0 1024 1024" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id="collectiveMarkMask" maskUnits="userSpaceOnUse">
          <rect width="1024" height="1024" fill="white" />
          <path d="M512 848 C452 748 348 682 226 648" fill="none" stroke="black" strokeWidth="19" strokeLinecap="round" />
          <path d="M512 848 C572 748 676 682 798 648" fill="none" stroke="black" strokeWidth="19" strokeLinecap="round" />
          <path d="M512 848 C442 708 346 628 234 612" fill="none" stroke="black" strokeWidth="13" strokeLinecap="round" />
          <path d="M512 848 C582 708 678 628 790 612" fill="none" stroke="black" strokeWidth="13" strokeLinecap="round" />
          <path d="M512 848 L512 724" fill="none" stroke="black" strokeWidth="14" strokeLinecap="round" />
        </mask>
      </defs>
      <g mask="url(#collectiveMarkMask)" fill="#F2A900" stroke="none">
        <path d="M760 218 A360 360 0 1 0 794 780" fill="none" stroke="#F2A900" strokeWidth="88" strokeLinecap="butt" />
        <path d="M194 644 C326 648 438 728 512 858 C392 842 276 778 194 644 Z" />
        <path d="M830 644 C698 648 586 728 512 858 C632 842 748 778 830 644 Z" />
        <path d="M230 612 C348 626 440 690 512 824 C416 762 324 732 214 714 Z" />
        <path d="M794 612 C676 626 584 690 512 824 C608 762 700 732 810 714 Z" />
        <circle cx="512" cy="310" r="43" />
        <path d="M466 424 Q466 382 508 382 L516 382 Q558 382 558 424 L558 662 Q558 681 544 696 L512 732 L480 696 Q466 681 466 662 Z" />
        <circle cx="405" cy="378" r="39" />
        <path d="M356 492 Q356 450 398 450 L412 450 Q454 450 454 492 L454 662 Q402 630 356 612 Z" />
        <circle cx="619" cy="378" r="39" />
        <path d="M570 492 Q570 450 612 450 L626 450 Q668 450 668 492 L668 612 Q622 630 570 662 Z" />
      </g>
    </svg>
  );
}

export function CollectiveMiniMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" role="img" aria-label="Collective" xmlns="http://www.w3.org/2000/svg">
      <g fill="#F2A900" stroke="none">
        <path d="M384 105 A182 182 0 1 0 394 388" fill="none" stroke="#F2A900" strokeWidth="44" strokeLinecap="butt" />
        <circle cx="256" cy="162" r="23" />
        <rect x="230" y="202" width="52" height="128" rx="26" />
        <circle cx="202" cy="198" r="20" />
        <rect x="176" y="235" width="44" height="100" rx="22" />
        <circle cx="310" cy="198" r="20" />
        <rect x="292" y="235" width="44" height="100" rx="22" />
        <path d="M116 318 C180 318 224 360 256 431 C194 421 139 386 116 318 Z" />
        <path d="M396 318 C332 318 288 360 256 431 C318 421 373 386 396 318 Z" />
      </g>
    </svg>
  );
}

export function CollectiveWordmark() {
  return (
    <div className="flex items-center gap-2.5" aria-label="Collective">
      <CollectiveMiniMark className="h-8 w-8" />
      <span className="text-[18px] font-extrabold tracking-tight text-[#111111]">Collective</span>
    </div>
  );
}

export function CollectiveSheetHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <CollectiveMiniMark className="mx-auto h-10 w-10" />
      <h2 className="mt-3 text-[24px] font-extrabold leading-tight text-[#111111]">{title}</h2>
      {subtitle && <p className="mx-auto mt-2 max-w-[300px] text-sm leading-6 text-[#6E6E6E]">{subtitle}</p>}
    </div>
  );
}

export function CollectiveSuccessMark({ children }: { children?: ReactNode }) {
  return (
    <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#FFF1C7] text-[#F2A900] shadow-[0_18px_48px_rgba(242,169,0,0.18)]">
      {children || <CollectiveMiniMark className="h-12 w-12" />}
    </div>
  );
}

export function CollectiveWatermark({ className = "" }: { className?: string }) {
  return <CollectiveMark className={`pointer-events-none opacity-[0.08] ${className}`} label="Collective watermark" />;
}
