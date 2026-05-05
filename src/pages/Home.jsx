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
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2"><Badge>{currentMemberLevel}</Badge><Badge>{currentUser.kycStatus}</Badge><Badge tone="default">Private Auction Credit</Badge></div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">Curated collector marketplace with premium credit rails.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">Nền tảng mô phỏng full flow buyer / seller / admin, theo phong cách high-end fintech. Data logic và localStorage vẫn giữ nguyên hoàn toàn.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a className="btn-primary" href="#/bid">Enter Bid Floor</a><a className="btn-secondary" href="#/wallet">Open Wallet</a></div>
          </div>
          <div className="section-card border-auction-gold/20">
            <p className="label text-auction-gold">Portfolio Status</p>
            <div className="mt-4 grid gap-3">
              <StatCard label="Available Credit" value={money(currentUser.wallet.available)} />
              <StatCard label="Pending Credit" value={money(currentUser.wallet.pending)} />
              <StatCard label="Score" value={`${currentUser.score} pts`} hint={getMemberUpgradeHint(currentUser)} accent />
            </div>
          </div>
        </div>
      </section>

      <PolicyBox title="Pending / Payment Policy">Nếu bị outbid, pending credit được hoàn về Available Credit. Nếu thắng, pending bị giữ đến khi admin xử lý paid/failed.</PolicyBox>

      <section className="grid gap-4 md:grid-cols-3"><StatCard label="Rooms" value={state.rooms.length} /><StatCard label="Followed Rooms" value={followedRooms.length} /><StatCard label="Seller Fee" value="10%" /></section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="label text-auction-gold">Featured Collection</p><h2 className="mt-2 text-2xl font-black text-white">Luxury lots nổi bật</h2></div></div>
        <div className="grid gap-5 xl:grid-cols-3">{featuredRooms.map((room) => <RoomCard key={room.id} room={room} compact />)}</div>
      </section>

      <section className="section-card">
        <p className="label text-auction-gold">Auction Calendar</p>
        <h2 className="mt-2 text-2xl font-black text-white">Lịch đấu giá sắp tới</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="py-3">Room</th><th>Level</th><th>Status</th><th>Start</th><th>End</th><th>Current</th><th></th></tr></thead><tbody className="divide-y divide-white/10">{upcoming.map((room) => <tr key={room.id} className="text-slate-300"><td className="py-4 font-bold text-white">{room.title}</td><td><Badge>{room.roomLevel}</Badge></td><td><Badge>{room.status}</Badge></td><td>{formatDateTime(room.startTime)}</td><td>{formatDateTime(room.endTime)}</td><td>{money(room.currentHighestBid)}</td><td><a className="text-auction-gold hover:underline" href={`#/room/${room.id}`}>Join</a></td></tr>)}</tbody></table>
        </div>
      </section>
    </div>
  )
}
