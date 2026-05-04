import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import RoomCard from '../components/RoomCard'
import { useAuction } from '../context/AuctionContext'
import { ROOM_LEVELS, ROOM_STATUSES } from '../utils/policies'

export default function BidPage() {
  const { state, currentMemberLevel, currentUser } = useAuction()
  const [level, setLevel] = useState('All')
  const [status, setStatus] = useState('All')

  const rooms = useMemo(() => {
    return state.rooms.filter((room) => {
      const levelOk = level === 'All' || room.roomLevel === level
      const statusOk = status === 'All' || room.status === status
      return levelOk && statusOk
    })
  }, [state.rooms, level, status])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Bid Page</p>
          <h1 className="page-title mt-2">Auction rooms</h1>
          <p className="muted mt-3 max-w-3xl">Filter theo Room Level và trạng thái. Card hiển thị giá hiện tại, bước giá tối thiểu, thời gian còn lại và điều kiện tham gia.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{currentMemberLevel}</Badge>
          <Badge>{currentUser.kycStatus}</Badge>
        </div>
      </div>

      <section className="glass-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="label">Room Level</span>
            <select className="field" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>All</option>
              {ROOM_LEVELS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="label">Status</span>
            <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              {ROOM_STATUSES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
        {!rooms.length ? <div className="glass-card p-8 text-center text-slate-400">No rooms match filters.</div> : null}
      </section>
    </div>
  )
}
