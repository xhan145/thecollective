import { AppShell } from "@/components/AppShell";
import { feedOperatingPrinciples, mediaProofScoringNotes } from "@/lib/feedAlgorithm";

export default function FeedSystemPage() {
  return (
    <AppShell title="Feed System" subtitle="The homepage algorithm is a core product moat, not decoration.">
      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="text-xl font-black">The feed's job</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">The feed lets users enter passively, then keeps nudging them toward action. Every card should answer: what can this person try, prove, learn, or contribute next?</p>
        </div>
        <div className="card p-5">
          <h2 className="text-xl font-black">Ranking formula</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Score = relevance + usefulness + actionability + proof strength + trust weight + recency + low-friction boost + mode boost - passive penalty.</p>
        </div>
        <div className="card p-5">
          <h2 className="text-xl font-black">Flow rule</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">A good scroll session: I relate to someone, see how they practiced, try a small action, submit proof, get feedback, and return tomorrow.</p>
        </div>
        {feedOperatingPrinciples().map((p, i) => (
          <div key={p} className="card p-4">
            <p className="text-xs font-black text-purple2">Principle {i + 1}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{p}</p>
          </div>
        ))}
        <div className="card p-5">
          <h2 className="text-xl font-black">Media proof signals</h2>
          <div className="mt-3 space-y-2">
            {mediaProofScoringNotes().map((note) => (
              <p key={note} className="rounded-2xl bg-white/[0.04] p-3 text-xs leading-5 text-slate-300">{note}</p>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
