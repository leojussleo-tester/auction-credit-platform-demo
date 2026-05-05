import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import PolicyBox from '../components/PolicyBox'
import StatCard from '../components/StatCard'
import { useAuction } from '../context/AuctionContext'
import { calculateMemberLevel, formatDateTime, money } from '../utils/policies'

const WITHDRAW_KEY = 'auction-credit-withdraw-requests-v1'

function loadWithdrawRequests() {
  try {
    return JSON.parse(localStorage.getItem(WITHDRAW_KEY) || '[]')
  } catch {
    return []
  }
}

function saveWithdrawRequests(requests) {
  localStorage.setItem(WITHDRAW_KEY, JSON.stringify(requests))
}

function vnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`
}

export default function AdminDashboard() {
  const {
    state,
    adminUpdateUser,
    adminUpdateProduct,
    adminCreateRoom,
    adminUpdateRoom,
    adminMarkWinnerPaid,
    adminMarkFailedPayment,
    adminApplyPenalty,
    adminReleaseSettlement,
  } = useAuction()
  const verifiedProducts = state.sellerProducts.filter((product) => product.verificationStatus === 'Verified')
  const sellerUsers = state.users.filter((user) => user.sellerEnabled)
  const [message, setMessage] = useState('')
  const [withdrawRequests, setWithdrawRequests] = useState(loadWithdrawRequests)
  const [roomForm, setRoomForm] = useState({
    productId: verifiedProducts[0]?.id || '',
    sellerId: sellerUsers[0]?.id || '',
    title: '',
    roomLevel: 'Basic',
    status: 'Upcoming',
    startingPrice: 500,
    minIncrement: 50,
  })

  const totalPending = useMemo(() => state.users.reduce((sum, user) => sum + Number(user.wallet.pending || 0), 0), [state.users])
  const awaitingPayment = state.rooms.filter((room) => room.paymentStatus === 'Awaiting Winner Payment' || room.bids.some((bid) => bid.status === 'active')).length
  const pendingWithdraws = withdrawRequests.filter((request) => request.status === 'Pending Review')

  function flash(resultOrMessage) {
    if (typeof resultOrMessage === 'string') setMessage(resultOrMessage)
    else setMessage(resultOrMessage.message)
  }

  function createRoom(event) {
    event.preventDefault()
    adminCreateRoom(roomForm)
    flash('Room created. Check Bid Page.')
  }

  function winnerName(room) {
    const user = state.users.find((item) => item.id === room.winnerUserId)
    return user?.name || 'No winner yet'
  }

  function reviewWithdraw(requestId, decision) {
    const request = withdrawRequests.find((item) => item.id === requestId)
    if (!request || request.status !== 'Pending Review') {
      flash('Request not found or already reviewed.')
      return
    }
    const user = state.users.find((item) => item.id === request.userId)
    if (!user) {
      flash('Requester not found.')
      return
    }

    const now = new Date().toISOString()
    const nextRequests = withdrawRequests.map((item) => (
      item.id === requestId
        ? { ...item, status: decision, reviewedAt: now, reviewNote: decision === 'Approved' ? 'Admin approved payout mock.' : 'Admin rejected and returned credit.' }
        : item
    ))
    setWithdrawRequests(nextRequests)
    saveWithdrawRequests(nextRequests)

    const currentTransactions = user.transactions || []
    if (decision === 'Approved') {
      adminUpdateUser(user.id, {
        wallet: {
          available: user.wallet.available,
          pending: Math.max(0, user.wallet.pending - request.amount),
        },
        transactions: [
          {
            id: `tx-wd-approved-${Date.now()}`,
            type: 'Withdrawal Approved',
            amount: -request.amount,
            time: now,
            note: `Admin approved payout ${money(request.amount)} → ${vnd(request.vndAmount)}`,
          },
          ...currentTransactions,
        ],
      })
      flash(`Approved withdrawal for ${request.userName}.`)
    } else {
      adminUpdateUser(user.id, {
        wallet: {
          available: user.wallet.available + request.amount,
          pending: Math.max(0, user.wallet.pending - request.amount),
        },
        transactions: [
          {
            id: `tx-wd-rejected-${Date.now()}`,
            type: 'Withdrawal Rejected',
            amount: request.amount,
            time: now,
            note: `Admin rejected withdrawal and returned ${money(request.amount)}`,
          },
          ...currentTransactions,
        ],
      })
      flash(`Rejected withdrawal for ${request.userName}. Credit returned.`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Admin Dashboard</p>
        <h1 className="page-title mt-2">Control center</h1>
        <p className="muted mt-3 max-w-3xl">Quản lý user, KYC, seller permission, product verification, room setup, winner paid/failed, penalty, seller settlement và yêu cầu rút Credit → VNĐ.</p>
      </div>

      {message ? <div className="rounded-2xl border border-auction-neon/30 bg-auction-neon/10 p-4 text-sm text-emerald-100">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Users" value={state.users.length} />
        <StatCard label="Rooms" value={state.rooms.length} />
        <StatCard label="Total Pending" value={money(totalPending)} accent />
        <StatCard label="Winner Actions" value={awaitingPayment} hint="Active / awaiting payment rooms" />
        <StatCard label="Withdraw Review" value={pendingWithdraws.length} hint="Credit → VNĐ requests" />
      </section>

      <PolicyBox title="Admin Demo Flow">
        Test nhanh: vào Bid Room để đặt bid → vào Admin Dashboard để Set Ended → Mark as Paid hoặc Failed Payment → Release Seller Settlement nếu Paid. Yêu cầu rút Credit → VNĐ nằm ở phần Withdraw Requests.
      </PolicyBox>

      <section className="glass-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Withdraw Requests</p>
            <h2 className="mt-2 text-2xl font-black text-white">Duyệt rút Credit → VNĐ</h2>
            <p className="muted mt-2">Member/Seller gửi yêu cầu ở Wallet. Admin kiểm tra cheat/hack rồi Approve hoặc Reject.</p>
          </div>
          <Badge>{pendingWithdraws.length} pending</Badge>
        </div>

        <div className="space-y-3">
          {withdrawRequests.length ? withdrawRequests.map((request) => (
            <div key={request.id} className="soft-card p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-black text-white">{request.userName}</p>
                    <Badge>{request.userRole === 'seller' ? 'SELLER' : 'MEMBER'}</Badge>
                    <Badge tone={request.status === 'Approved' ? 'Approved' : request.status === 'Rejected' ? 'Rejected' : 'Pending'}>{request.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">Amount: <strong className="text-auction-gold">{money(request.amount)}</strong> → <strong className="text-white">{vnd(request.vndAmount)}</strong></p>
                  <p className="mt-1 text-sm text-slate-300">Bank: {request.bankName} · {request.bankAccount} · {request.accountName}</p>
                  <p className="mt-1 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}{request.reviewedAt ? ` · Reviewed ${formatDateTime(request.reviewedAt)}` : ''}</p>
                  {request.note ? <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-slate-300">User note: {request.note}</p> : null}
                  {request.reviewNote ? <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-slate-300">Admin note: {request.reviewNote}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button className="btn-secondary !px-3 !py-2" disabled={request.status !== 'Pending Review'} onClick={() => reviewWithdraw(request.id, 'Approved')}>Approve</button>
                  <button className="btn-danger !px-3 !py-2" disabled={request.status !== 'Pending Review'} onClick={() => reviewWithdraw(request.id, 'Rejected')}>Reject</button>
                </div>
              </div>
            </div>
          )) : <p className="muted">Chưa có yêu cầu rút Credit → VNĐ nào.</p>}
        </div>
      </section>

      <section className="glass-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">User Management</p>
            <h2 className="mt-2 text-2xl font-black text-white">KYC / Seller / Member Override</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr><th className="py-3">User</th><th>KYC</th><th>Seller</th><th>Level</th><th>Score</th><th>Pending</th><th>Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {state.users.map((user) => (
                <tr key={user.id} className="text-slate-300 align-top">
                  <td className="py-4"><strong className="text-white">{user.name}</strong><p className="text-xs text-slate-500">{user.email}</p></td>
                  <td><Badge>{user.kycStatus}</Badge></td>
                  <td><Badge tone={user.sellerEnabled ? 'Approved' : 'Pending'}>{user.sellerEnabled ? 'Granted' : 'Locked'}</Badge></td>
                  <td><Badge>{calculateMemberLevel(user)}</Badge><p className="mt-1 text-xs text-slate-500">Override: {user.memberLevelOverride || 'None'}</p></td>
                  <td className="font-black text-white">{user.score}</td>
                  <td className="font-black text-auction-gold">{money(user.wallet.pending)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateUser(user.id, { kycStatus: 'Approved' })}>Approve KYC</button>
                      <button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateUser(user.id, { kycStatus: 'Rejected' })}>Reject</button>
                      <button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateUser(user.id, { sellerEnabled: !user.sellerEnabled })}>{user.sellerEnabled ? 'Revoke Seller' : 'Grant Seller'}</button>
                      <select className="field !w-36 !px-3 !py-2" value={user.memberLevelOverride || ''} onChange={(e) => adminUpdateUser(user.id, { memberLevelOverride: e.target.value || null })}>
                        <option value="">Auto Level</option>
                        <option value="Classic">Classic</option>
                        <option value="Pro">Pro</option>
                        <option value="VIP">VIP</option>
                      </select>
                      <button className="btn-danger !px-3 !py-2" onClick={() => adminApplyPenalty(user.id)}>Penalty -30</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="glass-card p-6">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Product Verification</p>
            <h2 className="mt-2 text-2xl font-black text-white">Duyệt sản phẩm seller gửi</h2>
          </div>
          <div className="space-y-3">
            {state.sellerProducts.map((product) => (
              <div key={product.id} className="soft-card p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-white">{product.name}</p>
                    <p className="mt-1 text-sm text-slate-400">Seller: {state.users.find((user) => user.id === product.sellerId)?.name || product.sellerId}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.verificationNote || 'No verification note'}</p>
                  </div>
                  <Badge>{product.verificationStatus}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateProduct(product.id, { verificationStatus: 'Verified' })}>Verified</button>
                  <button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateProduct(product.id, { verificationStatus: 'Pending' })}>Pending</button>
                  <button className="btn-danger !px-3 !py-2" onClick={() => adminUpdateProduct(product.id, { verificationStatus: 'Rejected' })}>Rejected</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={createRoom} className="glass-card p-6">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Create Auction Room</p>
            <h2 className="mt-2 text-2xl font-black text-white">Tạo room đấu giá</h2>
          </div>
          <div className="space-y-4">
            <label><span className="label">Verified Product</span><select className="field" value={roomForm.productId} onChange={(e) => setRoomForm({ ...roomForm, productId: e.target.value })}><option value="">Manual / No Product</option>{verifiedProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label><span className="label">Seller</span><select className="field" value={roomForm.sellerId} onChange={(e) => setRoomForm({ ...roomForm, sellerId: e.target.value })}>{sellerUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
            <label><span className="label">Room Title</span><input className="field" value={roomForm.title} onChange={(e) => setRoomForm({ ...roomForm, title: e.target.value })} placeholder="Optional if product selected" /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className="label">Room Level</span><select className="field" value={roomForm.roomLevel} onChange={(e) => setRoomForm({ ...roomForm, roomLevel: e.target.value })}><option>Basic</option><option>Pro</option><option>VIP</option></select></label>
              <label><span className="label">Status</span><select className="field" value={roomForm.status} onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}><option>Upcoming</option><option>Live</option><option>Ended</option></select></label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className="label">Starting Price</span><input className="field" type="number" value={roomForm.startingPrice} onChange={(e) => setRoomForm({ ...roomForm, startingPrice: e.target.value })} /></label>
              <label><span className="label">Min Increment</span><input className="field" type="number" value={roomForm.minIncrement} onChange={(e) => setRoomForm({ ...roomForm, minIncrement: e.target.value })} /></label>
            </div>
            <button className="btn-primary w-full" type="submit">Create Room</button>
          </div>
        </form>
      </section>

      <section className="glass-card p-6">
        <div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Room Operations</p><h2 className="mt-2 text-2xl font-black text-white">Set level/status & xử lý winner</h2></div>
        <div className="space-y-4">
          {state.rooms.map((room) => {
            const activeBid = room.bids.find((bid) => bid.status === 'active')
            const paidBid = room.bids.find((bid) => bid.status === 'paid')
            return (
              <div key={room.id} className="soft-card p-4">
                <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
                  <div><div className="flex flex-wrap gap-2"><Badge>{room.roomLevel}</Badge><Badge>{room.status}</Badge><Badge tone="default">{room.paymentStatus}</Badge><Badge tone="default">{room.settlementStatus}</Badge></div><a href={`#/room/${room.id}`} className="mt-3 block text-xl font-black text-white hover:text-auction-gold">{room.title}</a><p className="mt-1 text-sm text-slate-400">Winner: {winnerName(room)} · Highest: {money(room.currentHighestBid)}</p><p className="mt-1 text-xs text-slate-500">Start {formatDateTime(room.startTime)} · End {formatDateTime(room.endTime)}</p></div>
                  <div className="flex flex-wrap items-start gap-2"><select className="field !w-32 !px-3 !py-2" value={room.roomLevel} onChange={(e) => adminUpdateRoom(room.id, { roomLevel: e.target.value })}><option>Basic</option><option>Pro</option><option>VIP</option></select><select className="field !w-36 !px-3 !py-2" value={room.status} onChange={(e) => adminUpdateRoom(room.id, { status: e.target.value })}><option>Upcoming</option><option>Live</option><option>Ended</option></select><button className="btn-secondary !px-3 !py-2" onClick={() => flash(adminMarkWinnerPaid(room.id))} disabled={!activeBid}>Mark as Paid</button><button className="btn-danger !px-3 !py-2" onClick={() => flash(adminMarkFailedPayment(room.id))} disabled={!activeBid}>Failed Payment</button><button className="btn-secondary !px-3 !py-2" onClick={() => flash(adminReleaseSettlement(room.id))} disabled={!paidBid || room.settlementStatus === 'Released'}>Release Settlement</button></div>
                </div>
                {paidBid ? <div className="mt-4 rounded-2xl border border-auction-gold/20 bg-auction-gold/10 p-4 text-sm text-slate-200">Paid amount {money(paidBid.amount)} · Platform fee 10% = {money(Math.ceil(paidBid.amount * room.commissionRate))} · Seller settlement = {money(paidBid.amount - Math.ceil(paidBid.amount * room.commissionRate))}</div> : null}
              </div>
            )
          })}
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-2xl font-black text-white">Activity Log</h2>
        <div className="mt-5 space-y-3">
          {state.activityLog.map((log) => <div key={log.id} className="soft-card p-4 text-sm text-slate-300"><span className="font-mono text-xs text-slate-500">{formatDateTime(log.time)}</span> · {log.message}</div>)}
        </div>
      </section>
    </div>
  )
}
