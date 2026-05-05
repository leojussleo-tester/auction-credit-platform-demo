export default function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-amber-300" />
        <p className="mt-4 text-lg font-semibold">Verifying account...</p>
      </div>
    </div>
  )
}
