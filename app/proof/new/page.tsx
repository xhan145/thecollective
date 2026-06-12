import { redirect } from "next/navigation";

export default function NewProofRedirectPage() {
  redirect("/artist/upload");
}
