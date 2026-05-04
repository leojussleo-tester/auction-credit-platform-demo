import Badge from './Badge'
import { canJoinRoom, formatDateTime, getPendingPolicyText, money, timeLeft } from '../utils/policies'
import { useAuction } from '../context/AuctionContext'

export default function RoomCard({ room, compact = false }) {
  const { currentUser, currentMemberLevel, followedRooms, toggleFollowRoom } = useAuction()
  const followed = followedRooms.some((item) => item.id === room.id)
  const eligibility = canJoinRoom(currentUser, room)

  return (
    <article className="glass-card overflow-hidden transition hover:-translate-y-1 hover:border-auction-gold/30">
      <div className="relative h-56 overflow-hidden">
        <img src={room.image} alt={room.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge>{room.roomLevel}</Badge>
          <Badge>{room.status}</Badge>
        </div>
        <button
          onClick={() => toggleFollowRoom(room.id)}
          className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-xs font-black text-white backdrop-blur-md hover:border-auction-gold/50"
        >
          {followed ? '★ Followed' : '☆ Follow'}
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-black text-white">{room.title}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-auction-gold">Ends: {timeLeft(room.endTime, room.status)}</p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-black/25 p-3">
            <p className="text-slate-500">Current price</p>
            <p className="font-black text-white">{money(room.currentHighestBid)}</p>
          </div>
          <div className="rounded-2xl bg-black/25 p-3">
            <p className="text-slate-500">Min increment</p>
            <p className="font-black text-white">{money(room.minIncrement)}</p>
          </div>
        </div>
        {!compact ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Join Condition</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {eligibility.allowed ? getPendingPolicyText(currentMemberLevel, room.roomLevel) : eligibility.reason}
              </p>
              <p className="mt-2 text-xs text-slate-500">Start: {formatDateTime(room.startTime)} · End: {formatDateTime(room.endTime)}</p>
            </div>
          </>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <a href={`#/room/${room.id}`} className="btn-primary flex-1">
            Join Room
          </a>
          <a href="#/bid" className="btn-secondary">
            Bid Page
          </a>
        </div>
      </div>
    </article>
  )
}
