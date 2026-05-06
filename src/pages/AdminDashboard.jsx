import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import PolicyBox from '../components/PolicyBox'
import StatCard from '../components/StatCard'
import { useAuction } from '../context/AuctionContext'
import { calculateMemberLevel, formatDateTime, money } from '../utils/policies'

const WITHDRAW_KEY = 'auction-credit-withdraw-requests-v1'
const DEPOSIT_KEY = 'auction-credit-deposit-requests-v1'

function loadStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function vnd(value) { return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ` }

export default function AdminDashboard() {
  const {
    state,
    adminUpdateUser,
    adminUpdateProduct,
    adminCreateRoom,
    adminUpdateRoom,
    adminPauseRoom,
    adminLockRoom,
    adminResumeRoom,
    adminBanMember,
    adminMarkWinnerPaid,
    adminMarkFailedPayment,
    adminApplyPenalty,
    adminReleaseSettlement,
  } = useAuction()

  const verifiedProducts = state.sellerProducts.filter((product) => product.verificationStatus === 'Verified')
  const sellerUsers = state.users.filter((user) => user.sellerEnabled)
  const [message, setMessage] = useState('')
  const [withdrawRequests, setWithdrawRequests] = useState(() => loadStore(WITHDRAW_KEY))
  const [depositRequests, setDepositRequests] = useState(() => loadStore(DEPOSIT_KEY))
  const [roomForm, setRoomForm] = useState({
    productId: verifiedProducts[0]?.id || '',
    sellerId: sellerUsers[0]?.id || '',
    title: '',
    roomLevel: 'Basic',
    status: 'Upcoming',
    startingPrice: 500,
    minIncrement: 50,
    hasPassword: false,
    roomPassword: '',
  })

  const totalPending = useMemo(() => state.users.reduce((sum, user) => sum + Number(user.wallet?.pending || 0), 0), [state.users])
  const awaitingPayment = state.rooms.filter((room) => room.paymentStatus === 'Awaiting Winner Payment' || room.bids.some((bid) => bid.status === 'active')).length
  const pendingWithdraws = withdrawRequests.filter((request) => request.status === 'Pending Review')
  const pendingDeposits = depositRequests.filter((request) => request.status === 'Pending Admin Review')

  function flash(resultOrMessage) {
    if (typeof resultOrMessage === 'string') setMessage(resultOrMessage)
    else setMessage(resultOrMessage?.message || 'Admin action completed.')
  }

  function setRoomField(field, value) {
    setRoomForm((prev) => ({ ...prev, [field]: value }))
  }

  function createRoom(event) {
    event.preventDefault()
    if (roomForm.hasPassword && !roomForm.roomPassword.trim()) {
      setMessage('Vui lòng nhập mật khẩu phòng hoặc chọn No password.')
      return
    }
    adminCreateRoom({ ...roomForm, roomPassword: roomForm.hasPassword ? roomForm.roomPassword.trim() : '' })
    setRoomForm((prev) => ({ ...prev, title: '', startingPrice: 500, minIncrement: 50, hasPassword: false, roomPassword: '' }))
    flash(roomForm.hasPassword ? 'Room created with password. Check Bid Lobby.' : 'Room created without password. Check Bid Lobby.')
  }

  function winnerName(room) {
    const user = state.users.find((item) => item.id === room.winnerUserId)
    return user?.name || 'No winner yet'
  }

  function reviewDeposit(requestId, decision) {
    const request = depositRequests.find((item) => item.id === requestId)
    if (!request) return flash('Deposit request not found.')
    if (!['Pending Admin Review', 'Waiting Bill'].includes(request.status)) return flash('Deposit request already reviewed.')
    const user = state.users.find((item) => item.id === request.userId)
    if (!user) return flash('Requester not found.')

    const now = new Date().toISOString()
    const nextRequests = depositRequests.map((item) => item.id === requestId ? {
      ...item,
      status: decision,
      reviewedAt: now,
      reviewNote: decision === 'Approved' ? 'Admin checked bank transfer + transaction code.' : 'Admin rejected. Refund manually outside demo if money was transferred.',
    } : item)
    setDepositRequests(nextRequests)
    saveStore(DEPOSIT_KEY, nextRequests)

    if (decision === 'Approved') {
      adminUpdateUser(user.id, {
        wallet: { ...user.wallet, available: Number(user.wallet.available || 0) + Number(request.creditAmount || 0) },
        transactions: [
          { id: `tx-dep-approved-${Date.now()}`, type: 'Deposit Approved', amount: request.creditAmount, time: now, note: `Top up approved: ${request.transactionCode} · ${vnd(request.vndAmount)}` },
          ...(user.transactions || []),
        ],
      })
      flash(`Approved top up ${money(request.creditAmount)} for ${request.userName}.`)
    } else {
      adminUpdateUser(user.id, {
        transactions: [
          { id: `tx-dep-rejected-${Date.now()}`, type: 'Deposit Rejected', amount: 0, time: now, note: `Top up rejected: ${request.transactionCode}. Refund/return payment outside demo.` },
          ...(user.transactions || []),
        ],
      })
      flash(`Rejected top up for ${request.userName}.`)
    }
  }

  function reviewWithdraw(requestId, decision) {
    const request = withdrawRequests.find((item) => item.id === requestId)
    if (!request || request.status !== 'Pending Review') return flash('Request not found or already reviewed.')
    const user = state.users.find((item) => item.id === request.userId)
    if (!user) return flash('Requester not found.')

    const now = new Date().toISOString()
    const nextRequests = withdrawRequests.map((item) => item.id === requestId ? { ...item, status: decision, reviewedAt: now, reviewNote: decision === 'Approved' ? 'Admin approved payout mock.' : 'Admin rejected and returned credit.' } : item)
    setWithdrawRequests(nextRequests)
    saveStore(WITHDRAW_KEY, nextRequests)

    const currentTransactions = user.transactions || []
    if (decision === 'Approved') {
      adminUpdateUser(user.id, {
        wallet: { available: user.wallet.available, pending: Math.max(0, user.wallet.pending - request.amount) },
        transactions: [{ id: `tx-wd-approved-${Date.now()}`, type: 'Withdrawal Approved', amount: -request.amount, time: now, note: `Admin approved payout ${money(request.amount)} → ${vnd(request.vndAmount)}` }, ...currentTransactions],
      })
      flash(`Approved withdrawal for ${request.userName}.`)
    } else {
      adminUpdateUser(user.id, {
        wallet: { available: user.wallet.available + request.amount, pending: Math.max(0, user.wallet.pending - request.amount) },
        transactions: [{ id: `tx-wd-rejected-${Date.now()}`, type: 'Withdrawal Rejected', amount: request.amount, time: now, note: `Admin rejected withdrawal and returned ${money(request.amount)}` }, ...currentTransactions],
      })
      flash(`Rejected withdrawal for ${request.userName}. Credit returned.`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Admin Dashboard</p>
        <h1 className="page-title mt-2">Control center</h1>
        <p className="muted mt-3 max-w-3xl">Quản lý user, room, nạp/rút credit, duyệt bill chuyển khoản, kiểm tra mã GD, tạm dừng/khoá room và ban member vi phạm.</p>
      </div>

      {message ? <div className="rounded-2xl border border-auction-neon/30 bg-auction-neon/10 p-4 text-sm text-emerald-100">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Users" value={state.users.length} />
        <StatCard label="Rooms" value={state.rooms.length} />
        <StatCard label="Total Pending" value={money(totalPending)} accent />
        <StatCard label="Winner Actions" value={awaitingPayment} hint="Active / awaiting payment" />
        <StatCard label="Deposit Review" value={pendingDeposits.length} hint="Bank transfer bills" />
        <StatCard label="Withdraw Review" value={pendingWithdraws.length} hint="Credit → VNĐ" />
      </section>

      <PolicyBox title="Admin Deposit Flow">
        Mem/Seller tạo yêu cầu nạp, chuyển khoản theo Bank/STK/Mã GD, upload bill. Admin kiểm tra giao dịch + mã GD rồi Approve để Credit cộng vào ví, hoặc Reject để hoàn tiền/thủ công ngoài demo.
      </PolicyBox>

      <section className="glass-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Deposit Requests</p>
            <h2 className="mt-2 text-2xl font-black text-white">Duyệt nạp Credit bằng chuyển khoản</h2>
            <p className="muted mt-2">Kiểm tra bill, số tiền, Bank/STK và Mã GD trước khi duyệt.</p>
          </div>
          <Badge>{pendingDeposits.length} pending bills</Badge>
        </div>
        <div className="space-y-3">
          {depositRequests.length ? depositRequests.map((request) => (
            <div key={request.id} className="soft-card p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><p className="text-lg font-black text-white">{request.userName}</p><Badge>{request.userRole === 'seller' ? 'SELLER' : 'MEMBER'}</Badge><Badge tone={request.status === 'Approved' ? 'Approved' : request.status === 'Rejected' ? 'Rejected' : 'Pending'}>{request.status}</Badge><Badge>{request.transactionCode}</Badge></div>
                  <p className="mt-2 text-sm text-slate-300">Top up: <strong className="text-auction-gold">{money(request.creditAmount)}</strong> → <strong className="text-white">{vnd(request.vndAmount)}</strong></p>
                  <p className="mt-1 text-sm text-slate-300">Bank: {request.bank} · STK: {request.bankAccount} · Holder: {request.accountHolder}</p>
                  <p className="mt-1 text-sm text-slate-300">Bill: <strong className="text-white">{request.billName || 'Chưa upload bill'}</strong></p>
                  <p className="mt-1 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}{request.submittedAt ? ` · Submitted ${formatDateTime(request.submittedAt)}` : ''}{request.reviewedAt ? ` · Reviewed ${formatDateTime(request.reviewedAt)}` : ''}</p>
                  {request.reviewNote ? <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-slate-300">Admin note: {request.reviewNote}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <button className="btn-secondary !px-3 !py-2" disabled={!['Pending Admin Review', 'Waiting Bill'].includes(request.status)} onClick={() => reviewDeposit(request.id, 'Approved')}>Approve Top Up</button>
                  <button className="btn-danger !px-3 !py-2" disabled={!['Pending Admin Review', 'Waiting Bill'].includes(request.status)} onClick={() => reviewDeposit(request.id, 'Rejected')}>Reject / Refund</button>
                </div>
              </div>
            </div>
          )) : <p className="muted">Chưa có yêu cầu nạp Credit nào.</p>}
        </div>
      </section>

      <section className="glass-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Withdraw Requests</p><h2 className="mt-2 text-2xl font-black text-white">Duyệt rút Credit → VNĐ</h2><p className="muted mt-2">Member/Seller gửi yêu cầu ở Wallet. Admin kiểm tra rồi Approve hoặc Reject.</p></div><Badge>{pendingWithdraws.length} pending</Badge></div>
        <div className="space-y-3">{withdrawRequests.length ? withdrawRequests.map((request) => <div key={request.id} className="soft-card p-4"><div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start"><div><div className="flex flex-wrap items-center gap-2"><p className="text-lg font-black text-white">{request.userName}</p><Badge>{request.userRole === 'seller' ? 'SELLER' : 'MEMBER'}</Badge><Badge tone={request.status === 'Approved' ? 'Approved' : request.status === 'Rejected' ? 'Rejected' : 'Pending'}>{request.status}</Badge></div><p className="mt-2 text-sm text-slate-300">Amount: <strong className="text-auction-gold">{money(request.amount)}</strong> → <strong className="text-white">{vnd(request.vndAmount)}</strong></p><p className="mt-1 text-sm text-slate-300">Bank: {request.bankName} · {request.bankAccount} · {request.accountName}</p><p className="mt-1 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}{request.reviewedAt ? ` · Reviewed ${formatDateTime(request.reviewedAt)}` : ''}</p></div><div className="flex flex-wrap gap-2 lg:justify-end"><button className="btn-secondary !px-3 !py-2" disabled={request.status !== 'Pending Review'} onClick={() => reviewWithdraw(request.id, 'Approved')}>Approve</button><button className="btn-danger !px-3 !py-2" disabled={request.status !== 'Pending Review'} onClick={() => reviewWithdraw(request.id, 'Rejected')}>Reject</button></div></div></div>) : <p className="muted">Chưa có yêu cầu rút Credit → VNĐ nào.</p>}</div>
      </section>

      <section className="glass-card p-6">
        <div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">User Management</p><h2 className="mt-2 text-2xl font-black text-white">KYC / Seller / Member Override / Ban</h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="py-3">User</th><th>KYC</th><th>Seller</th><th>Level</th><th>Score</th><th>Pending</th><th>Ban</th><th>Actions</th></tr></thead><tbody className="divide-y divide-white/10">{state.users.map((user) => <tr key={user.id} className="text-slate-300 align-top"><td className="py-4"><strong className="text-white">{user.name}</strong><p className="text-xs text-slate-500">{user.email}</p></td><td><Badge>{user.kycStatus}</Badge></td><td><Badge tone={user.sellerEnabled ? 'Approved' : 'Pending'}>{user.sellerEnabled ? 'Granted' : 'Locked'}</Badge></td><td><Badge>{calculateMemberLevel(user)}</Badge><p className="mt-1 text-xs text-slate-500">Override: {user.memberLevelOverride || 'None'}</p></td><td className="font-black text-white">{user.score}</td><td className="font-black text-auction-gold">{money(user.wallet.pending)}</td><td><Badge tone={user.isBanned ? 'Rejected' : 'Approved'}>{user.isBanned ? 'BANNED' : 'OK'}</Badge></td><td><div className="flex flex-wrap gap-2"><button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateUser(user.id, { kycStatus: 'Approved', isBanned: false })}>Approve KYC</button><button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateUser(user.id, { kycStatus: 'Rejected' })}>Reject</button><button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateUser(user.id, { sellerEnabled: !user.sellerEnabled })}>{user.sellerEnabled ? 'Revoke Seller' : 'Grant Seller'}</button><select className="field !w-36 !px-3 !py-2" value={user.memberLevelOverride || ''} onChange={(e) => adminUpdateUser(user.id, { memberLevelOverride: e.target.value || null })}><option value="">Auto Level</option><option value="Classic">Classic</option><option value="Pro">Pro</option><option value="VIP">VIP</option></select><button className="btn-danger !px-3 !py-2" onClick={() => adminApplyPenalty(user.id)}>Penalty -30</button><button className="btn-danger !px-3 !py-2" onClick={() => adminUpdateUser(user.id, { isBanned: true, kycStatus: 'Rejected' })}>Ban mem</button></div></td></tr>)}</tbody></table></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="glass-card p-6"><div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Product Verification</p><h2 className="mt-2 text-2xl font-black text-white">Duyệt sản phẩm seller gửi</h2></div><div className="space-y-3">{state.sellerProducts.map((product) => <div key={product.id} className="soft-card p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="font-black text-white">{product.name}</p><p className="mt-1 text-sm text-slate-400">Seller: {state.users.find((user) => user.id === product.sellerId)?.name || product.sellerId}</p><p className="mt-1 text-xs text-slate-500">{product.verificationNote || 'No verification note'}</p></div><Badge>{product.verificationStatus}</Badge></div><div className="mt-4 flex flex-wrap gap-2"><button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateProduct(product.id, { verificationStatus: 'Verified' })}>Verified</button><button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateProduct(product.id, { verificationStatus: 'Pending' })}>Pending</button><button className="btn-danger !px-3 !py-2" onClick={() => adminUpdateProduct(product.id, { verificationStatus: 'Rejected' })}>Rejected</button></div></div>)}</div></div>

        <form onSubmit={createRoom} className="glass-card p-6"><div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Create Auction Room</p><h2 className="mt-2 text-2xl font-black text-white">Tạo room đấu giá</h2></div><div className="space-y-4"><label><span className="label">Verified Product</span><select className="field" value={roomForm.productId} onChange={(e) => setRoomField('productId', e.target.value)}><option value="">Manual / No Product</option>{verifiedProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label><span className="label">Seller</span><select className="field" value={roomForm.sellerId} onChange={(e) => setRoomField('sellerId', e.target.value)}>{sellerUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><label><span className="label">Room Title</span><input className="field" value={roomForm.title} onChange={(e) => setRoomField('title', e.target.value)} /></label><div className="grid gap-4 md:grid-cols-2"><label><span className="label">Room Level</span><select className="field" value={roomForm.roomLevel} onChange={(e) => setRoomField('roomLevel', e.target.value)}><option>Basic</option><option>Pro</option><option>VIP</option></select></label><label><span className="label">Status</span><select className="field" value={roomForm.status} onChange={(e) => setRoomField('status', e.target.value)}><option>Upcoming</option><option>Live</option><option>Paused</option><option>Locked</option><option>Ended</option></select></label></div><div className="grid gap-4 md:grid-cols-2"><label><span className="label">Starting Price</span><input className="field" type="number" value={roomForm.startingPrice} onChange={(e) => setRoomField('startingPrice', e.target.value)} /></label><label><span className="label">Min Increment</span><input className="field" type="number" value={roomForm.minIncrement} onChange={(e) => setRoomField('minIncrement', e.target.value)} /></label></div><div className="rounded-3xl border border-white/10 bg-black/25 p-4"><span className="label">Room Password</span><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="soft-card flex items-center gap-3 p-4"><input type="radio" checked={!roomForm.hasPassword} onChange={() => setRoomForm({ ...roomForm, hasPassword: false, roomPassword: '' })} /><span className="font-black text-white">Không mật khẩu</span></label><label className="soft-card flex items-center gap-3 p-4"><input type="radio" checked={roomForm.hasPassword} onChange={() => setRoomForm({ ...roomForm, hasPassword: true })} /><span className="font-black text-white">Có mật khẩu</span></label></div>{roomForm.hasPassword ? <label className="mt-4 block"><span className="label">Tạo mật khẩu phòng</span><input className="field" value={roomForm.roomPassword} onChange={(e) => setRoomField('roomPassword', e.target.value)} placeholder="VD: VIP911 hoặc 123456" /></label> : null}</div><button className="btn-primary w-full" type="submit">Create Room</button></div></form>
      </section>

      <section className="glass-card p-6"><div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Room Operations</p><h2 className="mt-2 text-2xl font-black text-white">Tạm dừng / khoá / xử lý winner</h2></div><div className="space-y-4">{state.rooms.map((room) => { const activeBid = room.bids.find((bid) => bid.status === 'active'); const paidBid = room.bids.find((bid) => bid.status === 'paid'); return <div key={room.id} className="soft-card p-4"><div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]"><div><div className="flex flex-wrap gap-2"><Badge>{room.roomLevel}</Badge><Badge>{room.status}</Badge><Badge tone="default">{room.hasPassword ? `PASS: ${room.roomPassword}` : 'NO PASS'}</Badge><Badge tone="default">{room.paymentStatus}</Badge><Badge tone="default">{room.settlementStatus}</Badge></div><a href={`#/room/${room.id}`} className="mt-3 block text-xl font-black text-white hover:text-auction-gold">{room.title}</a><p className="mt-1 text-sm text-slate-400">Winner: {winnerName(room)} · Highest: {money(room.currentHighestBid)}</p><p className="mt-1 text-xs text-slate-500">Start {formatDateTime(room.startTime)} · End {formatDateTime(room.endTime)}</p></div><div className="flex flex-wrap items-start gap-2"><select className="field !w-32 !px-3 !py-2" value={room.roomLevel} onChange={(e) => adminUpdateRoom(room.id, { roomLevel: e.target.value })}><option>Basic</option><option>Pro</option><option>VIP</option></select><select className="field !w-36 !px-3 !py-2" value={room.status} onChange={(e) => adminUpdateRoom(room.id, { status: e.target.value })}><option>Upcoming</option><option>Live</option><option>Paused</option><option>Locked</option><option>Ended</option></select><button className="btn-secondary !px-3 !py-2" onClick={() => flash(adminPauseRoom(room.id))}>Pause</button><button className="btn-danger !px-3 !py-2" onClick={() => flash(adminLockRoom(room.id))}>Lock</button><button className="btn-secondary !px-3 !py-2" onClick={() => flash(adminResumeRoom(room.id))}>Resume</button><button className="btn-danger !px-3 !py-2" onClick={() => activeBid ? flash(adminBanMember(activeBid.userId, room.id)) : flash('No active bidder to ban.')} disabled={!activeBid}>Ban highest</button><button className="btn-secondary !px-3 !py-2" onClick={() => flash(adminMarkWinnerPaid(room.id))} disabled={!activeBid}>Mark as Paid</button><button className="btn-danger !px-3 !py-2" onClick={() => flash(adminMarkFailedPayment(room.id))} disabled={!activeBid}>Failed Payment</button><button className="btn-secondary !px-3 !py-2" onClick={() => flash(adminReleaseSettlement(room.id))} disabled={!paidBid || room.settlementStatus === 'Released'}>Release Settlement</button></div></div></div> })}</div></section>

      <section className="glass-card p-6"><h2 className="text-2xl font-black text-white">Activity Log</h2><div className="mt-5 space-y-3">{state.activityLog.map((log) => <div key={log.id} className="soft-card p-4 text-sm text-slate-300"><span className="font-mono text-xs text-slate-500">{formatDateTime(log.time)}</span> · {log.message}</div>)}</div></section>
    </div>
  )
}
