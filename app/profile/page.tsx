import { redirect } from "next/navigation";

// Profile was renamed to Passport. Keep the old route working by redirecting.
// Sub-routes (/profile/saved, /profile/learning) are unaffected.
export default function ProfilePage() {
  redirect("/passport");
}
