import Link from "next/link";
import { CollectiveMark } from "@/components/beta/Brand";
import { ButtonLink, Card } from "@/components/beta/ui";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-[430px] place-items-center bg-bg px-5 text-content">
      <Card className="p-7 text-center">
        <CollectiveMark className="mx-auto h-[76px] w-[158px]" />
        <h1 className="mt-5 text-display">Page not found.</h1>
        <p className="mt-2 text-body leading-6 text-muted">This beta route is not available. Your local progress is still safe.</p>
        <ButtonLink href="/home" className="mt-5 w-full">Back home</ButtonLink>
        <Link href="/install" className="mt-3 block rounded-full px-4 py-3 text-body font-semibold text-muted">Install guide</Link>
      </Card>
    </main>
  );
}
