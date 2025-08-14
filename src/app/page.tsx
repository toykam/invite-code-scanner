import ScanComponent from "@/components/Scanner";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 pt-24">
      <h1>Event Invite Scanner</h1>
      <ScanComponent />
    </div>
  );
}
