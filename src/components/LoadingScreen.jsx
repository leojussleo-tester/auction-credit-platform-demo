export default function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#05070b] px-5 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-auction-gold/30 bg-black/60 p-8 text-center shadow-luxury backdrop-blur-2xl">
        <div className="mx-auto grid h-16 w-16 animate-pulse place-items-center rounded-3xl border border-auction-gold/40 bg-auction-gold/15 text-2xl">✦</div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-auction-gold">Login loading</p>
        <h1 className="mt-3 text-3xl font-black text-white">Verifying account...</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">Đang kiểm tra role, KYC mock và quyền truy cập demo.</p>
      </div>
    </main>
  )
}
