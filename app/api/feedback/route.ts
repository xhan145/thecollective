import { NextResponse } from "next/server";
import { z } from "zod";
import { proofTypeLabels } from "@/lib/media/proofMedia";
import { createMockAiFeedback } from "@/lib/aiFeedback";

const schema = z.object({
  pathTitle: z.string().optional(),
  promptTitle: z.string().optional(),
  promptInstruction: z.string().optional(),
  proofType: z.enum(["text", "image", "video", "audio", "document", "screenshot", "link", "checklist"]),
  textResponse: z.string().optional(),
  mediaMetadata: z.unknown().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  linkUrl: z.string().optional(),
  reflection: z.string().min(1),
  feedbackRequest: z.string().optional(),
  visibility: z.enum(["private", "feedback-only", "reviewers", "path", "public"]).optional()
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback request." }, { status: 400 });
  }

  const input = parsed.data;
  const proofLabel = proofTypeLabels[input.proofType].toLowerCase();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(createMockAiFeedback(input, proofLabel));
  }

  // TODO v9/v10: send safe media-derived text only after image/video/audio/document extraction pipelines exist.
  // This route intentionally sends metadata and reflection only, not raw binary uploads.
  return NextResponse.json({
    summary: `OpenAI key detected. ${proofLabel} proof metadata is ready for a live feedback implementation.`,
    whatWorked: "The request includes proof context, reflection, and metadata without uploading large files to the model.",
    whatCouldImprove: "Wire this route to the Responses API after the media extraction plan is implemented.",
    nextStep: "Keep demo fallback active until the full multimodal safety and storage flow is ready.",
    reflectionQuestion: "What media details would make feedback more accurate without exposing unnecessary private data?",
    riskLevel: "low",
    confidenceScore: 0.68,
    mediaNotes: "Metadata-only mode is active. TODO v9/v10: image analysis, audio transcription, video transcript/thumbnail analysis, and document text extraction."
  });
}
