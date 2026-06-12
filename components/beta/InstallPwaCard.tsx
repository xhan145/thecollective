"use client";

import { Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, Badge } from "./ui";

export function InstallPwaCard() {
  const [standalone, setStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone));
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
  }, []);

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFF1C7] text-[#F2A900]">
          <Smartphone size={22} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold text-[#111111]">Install Collective</h2>
            <Badge tone={standalone ? "green" : "gold"}>{standalone ? "Installed" : "iPhone Safari"}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">
            Add Collective to your Home Screen for the closed beta. It opens like an app, while staying web-first.
          </p>
        </div>
      </div>
      {!standalone && (
        <ol className="mt-4 space-y-2 text-sm leading-6 text-[#38322A]">
          <li className="rounded-2xl bg-[#FFF8EE] p-3">1. Open this page in Safari on your iPhone.</li>
          <li className="rounded-2xl bg-[#FFF8EE] p-3">
            2. Tap the Share button <Share className="mx-1 inline-block align-[-3px]" size={16} /> at the bottom of Safari.
          </li>
          <li className="rounded-2xl bg-[#FFF8EE] p-3">3. Choose Add to Home Screen, then tap Add.</li>
        </ol>
      )}
      {!isIos && !standalone && <p className="mt-3 text-xs leading-5 text-[#6E6E6E]">On Android, use your browser menu and choose Install app when available.</p>}
    </Card>
  );
}
