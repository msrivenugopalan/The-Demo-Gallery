import { AuthPanel } from "@/components/auth-panel";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070b] p-4 sm:p-6">
      <div className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_#1e293b,_#0d1117_45%,_#090d12)] p-4 shadow-[0_30px_80px_rgba(15,23,42,0.8)] sm:p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="space-y-5 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-sky-300">The Dream Gallery</p>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Manage your event gallery with ease.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Upload memories, organize event albums, invite team members, and publish shareable galleries for customers.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Admin access</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Team uploads</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Customer galleries</span>
            </div>
          </div>

          <AuthPanel />
        </div>
      </div>
    </main>
  );
}
