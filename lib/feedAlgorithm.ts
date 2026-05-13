import type { DemoUser, FeedItem, FeedMode } from "./types";
const modeWeight: Record<FeedMode, number> = { passive: 0, bridge: 12, active: 24 };
export type RankedFeedItem = FeedItem & { score: number; reason: string };
export function scoreFeedItem(item: FeedItem, user: DemoUser, index: number): RankedFeedItem {
 const relevance = item.pathSlug === user.goal ? 28 : item.pathSlug ? 12 : 8;
 const score = Math.round(relevance + item.usefulness*.22 + item.actionability*.24 + item.proofStrength*.14 + item.trustWeight*.12 + item.recency*.1 + modeWeight[item.mode] + Math.max(0,20-item.friction)*.75 + (item.mode === "passive" && index > 2 ? -8 : 0));
 const reason = item.mode === "active" ? "Shown because it can move you into practice right now." : item.mode === "bridge" ? "Shown because it turns scrolling into a concrete next step." : "Shown as low-pressure inspiration, but still tied to an action.";
 return { ...item, score, reason };
}
export function rankHomeFeed(items: FeedItem[], user: DemoUser): RankedFeedItem[] { return enforcePassiveToActiveFlow(items.map((item, index) => scoreFeedItem(item, user, index)).sort((a,b)=>b.score-a.score)); }
export function enforcePassiveToActiveFlow(items: RankedFeedItem[]) {
 const passive = items.filter(i=>i.mode==="passive"), bridge = items.filter(i=>i.mode==="bridge"), active = items.filter(i=>i.mode==="active"), out: RankedFeedItem[] = [];
 const take = (a: RankedFeedItem[]) => a.shift();
 [take(passive)||take(bridge)||take(active), take(bridge)||take(active)||take(passive), take(active)||take(bridge)||take(passive)].forEach(x=>{ if(x) out.push(x); });
 while(passive.length || bridge.length || active.length){ const lastTwoPassive = out.slice(-2).every(i=>i?.mode==="passive"); const next = lastTwoPassive ? take(active)||take(bridge)||take(passive) : take(bridge)||take(active)||take(passive); if(!next) break; out.push(next); }
 return out;
}
export function feedOperatingPrinciples(){ return ["The homepage may feel scrollable, but every card must point toward practice, proof, feedback, trust, or contribution.","Passive inspiration is allowed only as an entry point, not as the destination.","The feed should interleave relatable proof, low-pressure reflection, and clear action prompts.","The algorithm should reward usefulness, actionability, proof strength, and trust more than raw engagement.","A card wins when it helps someone take a meaningful next step, not when it merely keeps them scrolling."]; }
