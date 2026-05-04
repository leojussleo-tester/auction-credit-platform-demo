import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import PolicyBox from '../components/PolicyBox'
import StatCard from '../components/StatCard'
import { useAuction } from '../context/AuctionContext'
import {
  calculatePendingAmount,
  canJoinRoom,
  formatDateTime,
  getPendingPolicyText,
  money,
  timeLeft,
} from '../utils/policies'

export default function BidRoom({ roomId }) {
  const { state, currentUser, currentMemberLevel, placeBid } = useAuction()
  const room = state.rooms.find((item) => item.id === roomId)
  const [bidAmount, setBidAmount] = useState(room ? room.currentHighestBid + room.minIncrement : 0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [message, setMessage] = useState('')

  const eligibility = room ? canJoinRoom(currentUser, room) : { allowed: false, reason: 'Room not found' }
  const pendingAmount = room ? calculatePendingAmount(bidAmount, currentMemberLevel, room.roomLevel) : 0
  const minimumBid = room ? (room.currentHighestBid || room.startingPrice) + room.minIncrement : 0

  const sortedBids = useMemo(() => {
    if (!room) return []
    return [...room.bids].sort((a, b) => new Date(b.time) - new Date(a.time))
  }, [room])

  if (!room) {
    return (
      <div className="glass-card p-8">
        <h1 className="page-title">Room not found</h1>
        <a href="#/bid" className="btn-primary mt-6">Back to Bid Page</a>
      </div>
    )
  }

  function quickBid(multiplier) {
    setBidAmount(room.currentHighestBid + room.minIncrement * multiplier)
  }

  function onConfirmBid() {
    const result = placeBid(room.id, bidAmount)
    setMessage(result.message)
    setConfirmOpen(false)
  }

  return (
    <div className="space-y-6">
      <a href="#/bid" className="text-sm font-bold text-auction-gold hover:underline">← Back to Bid Page</a>

      {message ? (
        <div className={`rounded-2xl border p-4 text-sm ${message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('cannot') || message.toLowerCase().includes('only') ? 'border-rose-300/30 bg-rose-500/10 text-rose-100' : 'border-auction-neon/30 bg-auction-neon/10 text-emerald-100'}`}>
          {message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card overflow-hidden">
          <div className="relative h-[360px] overflow-hidden">
            <img src={room.image} alt={room.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <Badge>{room.roomLevel}</Badge>
              <Badge>{room.status}</Badge>
              <Badge>{room.verificationStatus}</Badge>
            </div>
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">{timeLeft(room.endTime, room.status)}</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white">{room.productName}</h1>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div>
              <h2 className="text-2xl font-black text-white">Product Description</h2>
              <p className="mt-3 leading-7 text-slate-300">{room.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="soft-card p-4"><p className="text-slate-500">Seller Info</p><p className="mt-2 font-black text-white">{room.sellerName}</p></div>
              <div className="soft-card p-4"><p className="text-slate-500">Product Condition</p><p className="mt-2 font-black text-white">{room.condition}</p></div>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="glass-card p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <StatCard label="Starting Price" value={money(room.startingPrice)} />
              <StatCard label="Highest Bid" value={money(room.currentHighestBid)} accent />
              <StatCard label="Min Increment" value={money(room.minIncrement)} />
              <StatCard label="Minimum Next Bid" value={money(minimumBid)} />
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Place Bid</p>
                  <p className="mt-2 text-sm text-slate-400">Manual custom bid hoặc bid nhanh theo increment.</p>
                </div>
                <Badge>{currentMemberLevel}</Badge>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <button className="btn-secondary" onClick={() => quickBid(1)}>+ 1x Increment</button>
                <button className="btn-secondary" onClick={() => quickBid(2)}>+ 2x Increment</button>
              </div>

              <label className="mt-4 block">
                <span className="label">Custom Bid Amount</span>
                <input className="field" type="number" min={minimumBid} value={bidAmount} onChange={(e) => setBidAmount(Number(e.target.value))} />
              </label>

              <div className="mt-4 rounded-2xl bg-white/[0.05] p-4 text-sm text-slate-300">
                <div className="flex justify-between gap-3"><span>Bid amount</span><strong className="text-white">{money(bidAmount)}</strong></div>
                <div className="mt-2 flex justify-between gap-3"><span>Pending before confirm</span><strong className="text-auction-gold">{pendingAmount === null ? 'Blocked' : money(pendingAmount)}</strong></div>
                <div className="mt-2 flex justify-between gap-3"><span>Available Credit</span><strong className="text-white">{money(currentUser.wallet.available)}</strong></div>
              </div>

              <button
                className="btn-primary mt-5 w-full"
                disabled={!eligibility.allowed || room.status !== 'Live' || bidAmount < minimumBid || pendingAmount === null || currentUser.wallet.available < pendingAmount}
                onClick={() => setConfirmOpen(true)}
              >
                Confirm Custom Bid
              </button>

              {!eligibility.allowed ? <p className="mt-3 text-sm text-rose-200">{eligibility.reason}</p> : null}
              {room.status !== 'Live' ? <p className="mt-3 text-sm text-yellow-100">Only Live rooms accept bids.</p> : null}
            </div>
          </div>

          <PolicyBox title="Room Pending Policy">
            {getPendingPolicyText(currentMemberLevel, room.roomLevel)} Nếu thắng, pending bị giữ đến khi admin xác nhận thanh toán. Nếu failed payment, user mất toàn bộ pending credit và bị -30 điểm.
          </PolicyBox>
        </aside>
      </section>

      <section className="glass-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Bid History</p>
            <h2 className="mt-2 text-2xl font-black text-white">Live bid ledger</h2>
          </div>
          <Badge tone="default">{sortedBids.length} bids</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr><th className="py-3">User</th><th>Bid Amount</th><th>Pending</th><th>Time</th><th>Status</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sortedBids.map((bid) => (
                <tr key={bid.id} className="text-slate-300">
                  <td className="py-4 font-bold text-white">{bid.username}</td>
                  <td className="font-black text-white">{money(bid.amount)}</td>
                  <td className="text-auction-gold">{money(bid.pendingAmount)}</td>
                  <td>{formatDateTime(bid.time)}</td>
                  <td><Badge tone={bid.status === 'active' ? 'Live' : bid.status === 'paid' ? 'Paid' : bid.status === 'failed' ? 'Rejected' : 'Ended'}>{bid.status}</Badge></td>
                </tr>
              ))}
              {!sortedBids.length ? <tr><td className="py-5 text-slate-400" colSpan="5">No bids yet. Be the first bidder.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={confirmOpen}
        title="Confirm bid before pending credit"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={onConfirmBid}>Confirm Bid</button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="soft-card p-4"><p className="text-slate-500">Bid Price</p><p className="mt-2 text-2xl font-black text-white">{money(bidAmount)}</p></div>
          <div className="soft-card p-4"><p className="text-slate-500">Pending Credit</p><p className="mt-2 text-2xl font-black text-auction-gold">{money(pendingAmount)}</p></div>
          <div className="soft-card p-4"><p className="text-slate-500">Member Level</p><p className="mt-2"><Badge>{currentMemberLevel}</Badge></p></div>
          <div className="soft-card p-4"><p className="text-slate-500">Room Level</p><p className="mt-2"><Badge>{room.roomLevel}</Badge></p></div>
        </div>
        <PolicyBox title="Confirm Bid Policy" type="danger">
          Nếu bạn bị outbid, pending credit sẽ được hoàn lại. Nếu bạn thắng nhưng không thanh toán đủ phần còn lại đúng hạn, toàn bộ pending credit bị mất, tài khoản bị ghi failed payment, -30 điểm và có thể mất quyền vào VIP Room.
        </PolicyBox>
      </Modal>
    </div>
  )
}
