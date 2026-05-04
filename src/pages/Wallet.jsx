import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import PolicyBox from '../components/PolicyBox'
import { useAuction } from '../context/AuctionContext'
import { formatDateTime, getMemberUpgradeHint, money } from '../utils/policies'

export default function Wallet() {
  const { state, currentUser, currentMemberLevel, topUpCredit } = useAuction()
  const [amount, setAmount] = useState(2000)
  const [message, setMessage] = useState('')

  const activeBids = useMemo(() => {
    return state.rooms
      .flatMap((room) => room.bids.map((bid) => ({ ...bid, roomTitle: room.title, roomId: room.id, roomStatus: room.status })))
      .filter((bid) => bid.userId === currentUser.id && ['active', 'paid', 'failed'].includes(bid.status))
  }, [state.rooms, currentUser.id])

  function onTopUp() {
    const result = topUpCredit(amount)
    setMessage(result.message)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">My Wallet</p>
        <h1 className="page-title mt-2">Auction Credit wallet</h1>
        <p className="muted mt-3 max-w-3xl">Theo dõi Available Credit, Pending Credit, bid đang active, win history và transaction history.</p>
      </div>

      {message ? <div className="rounded-2xl border border-auction-neon/30 bg-auction-neon/10 p-4 text-sm text-emerald-100">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available Credit" value={money(currentUser.wallet.available)} hint="Credit có thể dùng để pending hoặc thanh toán phần còn lại" />
        <StatCard label="Pending Credit" value={money(currentUser.wallet.pending)} hint="Credit đang bị giữ do active / winning bid" accent />
        <StatCard label="Total Credit" value={money(currentUser.wallet.available + currentUser.wallet.pending)} hint="Available + Pending" />
        <StatCard label="Current Member" value={currentMemberLevel} hint={`${currentUser.score} score points`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Top Up</p>
              <h2 className="mt-2 text-2xl font-black text-white">Top Up Demo Credit</h2>
            </div>
            <Badge tone="default">Mock</Badge>
          </div>
          <label className="mt-6 block">
            <span className="label">Amount</span>
            <input className="field" type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </label>
          <button onClick={onTopUp} className="btn-primary mt-4 w-full">Top Up Demo Credit</button>
          <PolicyBox title="Credit Pending Policy" type="gold">
            Top up không thanh toán thật. Credit chỉ là số dư nội bộ để demo giữ quyền tham gia đấu giá.
          </PolicyBox>
        </div>

        <div className="glass-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Member Progress</p>
              <h2 className="mt-2 text-2xl font-black text-white">Scoring & upgrade</h2>
            </div>
            <Badge>{currentMemberLevel}</Badge>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="soft-card p-4"><p className="text-slate-500">Score</p><p className="text-2xl font-black">{currentUser.score}</p></div>
            <div className="soft-card p-4"><p className="text-slate-500">Paid Wins</p><p className="text-2xl font-black">{currentUser.winsPaid}</p></div>
            <div className="soft-card p-4"><p className="text-slate-500">Total Won</p><p className="text-2xl font-black">{money(currentUser.totalWonValue)}</p></div>
          </div>
          <p className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-slate-300">{getMemberUpgradeHint(currentUser)}</p>
          <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
            <div className="rounded-2xl bg-white/[0.04] p-4"><strong className="text-white">+10</strong><br />Win bid & paid</div>
            <div className="rounded-2xl bg-white/[0.04] p-4"><strong className="text-white">+5</strong><br />Completed, no dispute</div>
            <div className="rounded-2xl bg-white/[0.04] p-4"><strong className="text-white">-30</strong><br />Failed payment</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-black text-white">Current Active Bids</h2>
          <div className="mt-5 space-y-3">
            {activeBids.length ? activeBids.map((bid) => (
              <div key={bid.id} className="soft-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <a href={`#/room/${bid.roomId}`} className="font-black text-white hover:text-auction-gold">{bid.roomTitle}</a>
                    <p className="mt-1 text-sm text-slate-400">Bid {money(bid.amount)} · Pending {money(bid.pendingAmount)}</p>
                  </div>
                  <Badge tone={bid.status === 'active' ? 'Live' : bid.status === 'paid' ? 'Paid' : 'Rejected'}>{bid.status}</Badge>
                </div>
              </div>
            )) : <p className="muted">No current active bids.</p>}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-black text-white">Bid Win History</h2>
          <div className="mt-5 space-y-3">
            {(currentUser.winHistory || []).length ? currentUser.winHistory.map((win) => (
              <div key={win.id} className="soft-card p-4">
                <p className="font-black text-white">{win.roomTitle}</p>
                <p className="mt-1 text-sm text-slate-400">Paid {money(win.amount)} · {formatDateTime(win.paidAt)}</p>
              </div>
            )) : <p className="muted">No win history yet.</p>}
          </div>
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-2xl font-black text-white">Transaction History</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr><th className="py-3">Type</th><th>Amount</th><th>Time</th><th>Note</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {(currentUser.transactions || []).map((tx) => (
                <tr key={tx.id} className="text-slate-300">
                  <td className="py-4"><Badge tone={tx.type === 'Penalty' ? 'Rejected' : tx.type === 'Refund' ? 'Approved' : 'default'}>{tx.type}</Badge></td>
                  <td className={tx.amount < 0 ? 'font-black text-rose-200' : 'font-black text-emerald-200'}>{money(tx.amount)}</td>
                  <td>{formatDateTime(tx.time)}</td>
                  <td>{tx.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
