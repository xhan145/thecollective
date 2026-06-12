import { CollectiveMark } from "@/components/beta/Brand";

export default function Loading() {
  return (
    <main className="mx-auto grid min-h-screen max-w-[430px] place-items-center bg-[#FFF8EE] text-[#111111]">
      <div className="text-center">
        <CollectiveMark className="mx-auto h-[76px] w-[158px]" />
        <p className="mt-5 text-sm font-extrabold text-[#6E6E6E]">Loading Collective...</p>
      </div>
    </main>
  );
}
