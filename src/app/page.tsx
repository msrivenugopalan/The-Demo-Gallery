import { AuthPanel } from "@/components/auth-panel";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_35%,_#eef2ff)] p-6">
      <div className="w-full max-w-5xl rounded-[32px] border border-slate-200 bg-white/70 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur-sm">
        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              The Dream Gallery
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              A polished photo-sharing experience for event teams to upload memories, publish customer
              galleries, and protect each gallery with a PIN.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Admins</p>
                <p className="mt-1 text-xl font-bold leading-none text-slate-900">1</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Team Members</p>
                <p className="mt-1 text-xl font-bold leading-none text-slate-900">1</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Published Galleries</p>
                <p className="mt-1 text-xl font-bold leading-none text-slate-900">0</p>
              </div>
            </div>
          </div>

          <AuthPanel />
        </div>
      </div>
    </main>
  );
}
