import Link from "next/link";
import type { Direction, Feedback, Practice, ProofWithMeta } from "@/lib/types";
import { Card, Tag } from "./ui";
import { MarkHelpfulButton } from "./MarkHelpfulButton";

export function DirectionCard({
  direction,
  current = false,
}: {
  direction: Direction;
  current?: boolean;
}) {
  return (
    <Link href={`/direction/${direction.slug}`} className="block">
      <Card className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-soft text-base font-bold text-ink">
          {direction.title.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{direction.title}</p>
          <p className="truncate text-sm text-muted">{direction.description}</p>
        </div>
        {current ? <Tag>Current</Tag> : <span className="text-muted">›</span>}
      </Card>
    </Link>
  );
}

export function PracticeCard({
  practice,
  remixProofId,
}: {
  practice: Practice;
  remixProofId?: string;
}) {
  const href = remixProofId
    ? `/practice/${practice.id}?remix=${remixProofId}`
    : `/practice/${practice.id}`;
  return (
    <Card>
      <p className="font-bold text-ink">{practice.title}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <Tag>{practice.estimated_minutes} min</Tag>
        <span className="text-xs text-muted">One small step</span>
      </div>
      <Link
        href={href}
        className="mt-3 block rounded-2xl bg-goldBright py-2.5 text-center text-sm font-bold text-white"
      >
        Try this practice
      </Link>
    </Card>
  );
}

export function ProofCard({
  proof,
  showFeedbackCta = true,
}: {
  proof: ProofWithMeta;
  showFeedbackCta?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-muted">
          {proof.author_name ?? "A member"}
        </p>
        {proof.feedback_count === 0 ? (
          <Tag>Needs feedback</Tag>
        ) : (
          <span className="text-xs text-muted">
            {proof.feedback_count} feedback
          </span>
        )}
      </div>
      <p className="mt-1 font-bold text-ink">
        {proof.practice_title ?? proof.title}
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{proof.body}</p>
      {proof.proof_type !== "text" ? (
        <span className="mt-2 inline-block rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold capitalize text-muted">
          {proof.proof_type}
        </span>
      ) : null}
      <div className="mt-3 flex gap-2">
        <Link
          href={`/proof/${proof.id}`}
          className="flex-1 rounded-2xl border border-line bg-card py-2 text-center text-sm font-semibold text-ink"
        >
          View proof
        </Link>
        {showFeedbackCta ? (
          <Link
            href={`/feedback/give/${proof.id}`}
            className="flex-1 rounded-2xl bg-goldBright py-2 text-center text-sm font-bold text-white"
          >
            Give feedback
          </Link>
        ) : null}
      </div>
      {proof.practice_id ? (
        <Link
          href={`/practice/${proof.practice_id}?remix=${proof.id}`}
          className="mt-2 block text-center text-sm font-semibold text-gold"
        >
          Try this practice
        </Link>
      ) : null}
    </Card>
  );
}

export function FeedbackCard({
  feedback,
  canMarkHelpful = false,
  giverName,
}: {
  feedback: Feedback;
  canMarkHelpful?: boolean;
  giverName?: string | null;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted">{giverName ?? "A member"}</p>
        {feedback.is_marked_helpful ? <Tag>Helpful ✓</Tag> : null}
      </div>
      <FeedbackField label="What worked" value={feedback.what_worked} />
      <FeedbackField label="Could be clearer" value={feedback.could_be_clearer} />
      <FeedbackField label="One useful next step" value={feedback.next_step} />
      <FeedbackField label="Encouragement" value={feedback.encouragement} />
      {canMarkHelpful && !feedback.is_marked_helpful ? (
        <MarkHelpfulButton feedbackId={feedback.id} />
      ) : null}
    </Card>
  );
}

function FeedbackField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="mt-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  );
}
