import Badge from '../components/Badge'
import RoomCard from '../components/RoomCard'
import StatCard from '../components/StatCard'
import PolicyBox from '../components/PolicyBox'
import { useAuction } from '../context/AuctionContext'
import { formatDateTime, getMemberUpgradeHint, money } from '../utils/policies'

export default function Home() {
  const { state, currentUser, currentMemberLevel, followedRooms } = useAuction()
  const featuredRooms = state.rooms.slice(0, 3)
  const upcoming = state.rooms.filter((room) => room.status !== 'Ended').slice(0, 4)

  return (
    <div className="space-y-6">
      <section className="glass-card overflow-hidden p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{currentMemberLevel}</Badge>
              <Badge>{currentUser.kycStatus}</Badge>
              <Badge tone="default">Auction Credit / Bid Credit</Badge>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
              Luxury auction MVP with internal credit, pending, refund and settlement flow.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Prototype này mô phỏng đầy đủ flow buyer / seller / admin cho sàn đấu giá dùng Auction Credit nội bộ. Không phải crypto token public, không thanh toán thật, tất cả data lưu bằng localStorage.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="btn-primary" href="#/bid">Enter Bid Floor</a>
              <a className="btn-secondary border-amber-200/30" href="#/wallet">Open Wallet</a>
              <a className="btn-secondary" href="#/admin">Admin Dashboard</a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-300/30 bg-gradient-to-br from-slate-900/90 to-slate-950/80 p-5 shadow-neon">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Member Status</p>
            <div className="mt-4 grid gap-3">
              <StatCard label="Available Credit" value={money(currentUser.wallet.available)} />
              <StatCard label="Pending Credit" value={money(currentUser.wallet.pending)} />
              <StatCard label="Score" value={`${currentUser.score} pts`} hint={getMemberUpgradeHint(currentUser)} accent />
            </div>
          </div>
        </div>
      </section>

      <PolicyBox title="Pending / Payment Policy">
        Nếu bị outbid, pending credit được hoàn lại vào Available Credit. Nếu thắng, pending credit tiếp tục bị giữ đến khi Admin mark Paid. Nếu Failed Payment, user mất toàn bộ pending, bị -30 điểm và có thể bị hạ cấp member.
      </PolicyBox>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Rooms" value={state.rooms.length} hint="Basic / Pro / VIP room levels" />
        <StatCard label="Followed Rooms" value={followedRooms.length} hint="Click Follow/Favorite Room trên card" />
        <StatCard label="Seller Fee" value="10%" hint="Platform fee before seller settlement" />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Featured Rooms</p>
            <h2 className="mt-2 text-2xl font-black text-white">Sản phẩm / room nổi bật</h2>
          </div>
          <a href="#/bid" className="btn-secondary hidden md:inline-flex">View all</a>
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          {featuredRooms.map((room) => <RoomCard key={room.id} room={room} compact />)}
        </div>
      </section>

      <section className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Auction Calendar</p>
            <h2 className="mt-2 text-2xl font-black text-white">Lịch đấu giá sắp tới</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="py-3">Room</th>
                <th>Level</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Current</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {upcoming.map((room) => (
                <tr key={room.id} className="text-slate-300">
                  <td className="py-4 font-bold text-white">{room.title}</td>
                  <td><Badge>{room.roomLevel}</Badge></td>
                  <td><Badge>{room.status}</Badge></td>
                  <td>{formatDateTime(room.startTime)}</td>
                  <td>{formatDateTime(room.endTime)}</td>
                  <td>{money(room.currentHighestBid)}</td>
                  <td><a className="text-auction-gold hover:underline" href={`#/room/${room.id}`}>Join</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
