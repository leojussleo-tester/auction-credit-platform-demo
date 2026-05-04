import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Crown, Gavel, ShieldCheck, Sparkles, UserRound, WalletCards } from 'lucide-react';

const initialLots = [
  {
    id: 1,
    title: 'Porsche 911 Street Edition',
    room: 'VIP',
    seller: 'Trip Plug Garage',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    currentBid: 1280,
    step: 40,
    endsIn: '00:14:22',
    status: 'Live',
  },
  {
    id: 2,
    title: 'Supra 7-Eleven Collector Lot',
    room: 'PRO',
    seller: 'Leo Diecast',
    image: 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80',
    currentBid: 760,
    step: 30,
    endsIn: '01:08:10',
    status: 'Live',
  },
  {
    id: 3,
    title: 'Basic Room Starter Pack',
    room: 'BASIC',
    seller: 'Community Seller',
    image: 'https://images.unsplash.com/photo-1511407397940-d57f68e81203?auto=format&fit=crop&w=1200&q=80',
    currentBid: 260,
    step: 20,
    endsIn: '03:21:44',
    status: 'Upcoming',
  },
];

const memberPolicy = {
  CLASSIC: { pending: '100%', color: 'bg-slate-900 text-white' },
  PRO: { pending: '50%', color: 'bg-indigo-600 text-white' },
  VIP: { pending: '<30% / no pending', color: 'bg-amber-400 text-slate-950' },
};

function formatToken(value) {
  return `${value.toLocaleString('en-US')} TC`;
}

export default function App() {
  const [wallet, setWallet] = useState(() => Number(localStorage.getItem('wallet') || 2400));
  const [member, setMember] = useState(() => localStorage.getItem('member') || 'PRO');
  const [lots, setLots] = useState(() => {
    const saved = localStorage.getItem('lots');
    return saved ? JSON.parse(saved) : initialLots;
  });
  const [activity, setActivity] = useState(() => {
    const saved = localStorage.getItem('activity');
    return saved ? JSON.parse(saved) : ['KYC verified', 'Wallet topped up 2,400 TC', 'PRO member access enabled'];
  });

  useEffect(() => localStorage.setItem('wallet', wallet), [wallet]);
  useEffect(() => localStorage.setItem('member', member), [member]);
  useEffect(() => localStorage.setItem('lots', JSON.stringify(lots)), [lots]);
  useEffect(() => localStorage.setItem('activity', JSON.stringify(activity)), [activity]);

  const stats = useMemo(() => {
    const live = lots.filter((lot) => lot.status === 'Live').length;
    const highest = Math.max(...lots.map((lot) => lot.currentBid));
    return { live, highest };
  }, [lots]);

  const bid = (lotId) => {
    setLots((current) =>
      current.map((lot) => {
        if (lot.id !== lotId) return lot;
        const nextBid = lot.currentBid + lot.step;
        const pendingRate = member === 'CLASSIC' ? 1 : member === 'PRO' ? 0.5 : 0.3;
        const pending = Math.ceil(lot.step * pendingRate);
        if (wallet < pending) return lot;
        setWallet((value) => value - pending);
        setActivity((items) => [`Bid ${formatToken(nextBid)} on ${lot.title}. Pending ${formatToken(pending)}.`, ...items].slice(0, 6));
        return { ...lot, currentBid: nextBid, status: 'Live' };
      }),
    );
  };

  const topUp = () => {
    setWallet((value) => value + 1000);
    setActivity((items) => ['Demo top-up added 1,000 TC to internal wallet.', ...items].slice(0, 6));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden px-5 py-8 sm:px-10 lg:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,.35),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,.22),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <nav className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-200">Auction Web MVP</p>
              <h1 className="text-xl font-black sm:text-2xl">Auction Credit Platform</h1>
            </div>
            <button onClick={topUp} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-glow">
              Top up demo
            </button>
          </nav>

          <div className="grid gap-6 py-10 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-indigo-100">
                <Sparkles size={16} /> Buyer / Seller / Admin prototype
              </div>
              <h2 className="max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
                Bid with internal credits, member tiers, room access and KYC flow.
              </h2>
              <p className="mt-5 max-w-2xl text-lg text-slate-300">
                Local demo using React, Vite, Tailwind and localStorage. No real payment, no real backend, ready for Codex to edit.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Stat icon={<WalletCards />} label="Wallet" value={formatToken(wallet)} />
                <Stat icon={<Gavel />} label="Live rooms" value={stats.live} />
                <Stat icon={<Crown />} label="Highest bid" value={formatToken(stats.highest)} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Current member</p>
                  <h3 className="text-3xl font-black">{member}</h3>
                </div>
                <BadgeCheck className="text-emerald-300" size={42} />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {Object.keys(memberPolicy).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setMember(tier)}
                    className={`rounded-2xl px-3 py-3 text-sm font-bold transition ${member === tier ? memberPolicy[tier].color : 'bg-white/10 text-slate-300'}`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-3xl bg-slate-950/70 p-4 text-sm text-slate-300">
                Pending policy: <span className="font-bold text-white">{memberPolicy[member].pending}</span> of bid step is locked when joining or bidding.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-12 sm:px-10 lg:grid-cols-[1fr_360px] lg:px-16">
        <div className="grid gap-5">
          {lots.map((lot) => (
            <article key={lot.id} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
              <div className="grid md:grid-cols-[260px_1fr]">
                <img src={lot.image} alt="" className="h-64 w-full object-cover md:h-full" />
                <div className="p-5 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-100">{lot.room} ROOM</span>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-100">{lot.status}</span>
                    <span className="text-sm text-slate-400">Ends in {lot.endsIn}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-black">{lot.title}</h3>
                  <p className="mt-1 text-slate-400">Seller: {lot.seller}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <Mini label="Current bid" value={formatToken(lot.currentBid)} />
                    <Mini label="Step" value={formatToken(lot.step)} />
                    <Mini label="Access" value={lot.room === 'VIP' ? 'PRO / VIP' : 'All member'} />
                  </div>
                  <button onClick={() => bid(lot.id)} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-amber-400 px-5 py-4 font-black text-slate-950">
                    Place demo bid
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-5">
          <Panel title="KYC + Wallet Flow" icon={<ShieldCheck />}>
            <Step text="Create account" />
            <Step text="Light KYC: phone + ID" />
            <Step text="Top up internal Toy Credit" />
            <Step text="Bid rooms unlock by member tier" />
          </Panel>

          <Panel title="Admin / Activity" icon={<UserRound />}>
            <div className="space-y-3">
              {activity.map((item, index) => (
                <div key={index} className="rounded-2xl bg-white/10 p-3 text-sm text-slate-200">{item}</div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="mb-3 text-indigo-200">{icon}</div>
      <p className="text-sm text-slate-300">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-white/10 p-3 text-amber-200">{icon}</div>
        <h3 className="text-xl font-black">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Step({ text }) {
  return <div className="mb-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-200">✓ {text}</div>;
}
