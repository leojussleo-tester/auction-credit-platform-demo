import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/Badge'
import PolicyBox from '../components/PolicyBox'
import StatCard from '../components/StatCard'
import { useAuction } from '../context/AuctionContext'
import { formatDateTime, money } from '../utils/policies'

const WITHDRAW_KEY = 'auction-credit-withdraw-requests-v1'
const DEPOSIT_KEY = 'auction-credit-deposit-requests-v1'
const MIN_DURATION = 15
const MAX_DURATION = 1440

function loadStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function vnd(value) { return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ` }
function toLocalInputValue(date = new Date(Date.now() + 15 * 60 * 1000)) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
function clampDuration(value) {
  const number = Number(value || MIN_DURATION)
  return Math.max(MIN_DURATION, Math.min(MAX_DURATION, number))
}

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
    adminReleaseSettlement,
  } = useAuction()

  const verifiedProducts = state.sellerProducts.filter((product) => product.verificationStatus === 'Verified')
  const sellerUsers = state.users.filter((user) => user.sellerEnabled)
  const [message, setMessage] = useState('')
  const [withdrawRequests, setWithdrawRequests] = useState(() => loadStore(WITHDRAW_KEY))
  const [depositRequests, setDepositRequests] = useState(() => loadStore(DEPOSIT_KEY))
  const [roomForm, setRoomForm] = useState({
    productId: verifiedProducts[0]?.id || '',
    customProductName: '',
    sellerId: sellerUsers[0]?.id || '',
    title: '',
    roomLevel: 'Basic',
    status: 'Upcoming',
    startingPrice: 500,
    minIncrement: 50,
    startTimeLocal: toLocalInputValue(),
    durationMinutes: 60,
    hasPassword: false,
    roomPassword: '',
  })

  const pendingDeposits = depositRequests.filter((request) => request.status === 'Pending Admin Review')
  const pendingWithdraws = withdrawRequests.filter((request) => request.status === 'Pending Review')
  const reviewedDeposits = depositRequests.filter((request) => ['Approved', 'Rejected'].includes(request.status))
  const reviewedWithdraws = withdrawRequests.filter((request) => ['Approved', 'Rejected'].includes(request.status))
  const totalPending = useMemo(() => state.users.reduce((sum, user) => sum + Number(user.wallet?.pending || 0), 0), [state.users])

  useEffect(() => {
    const run = () => {
      const now = Date.now()
      state.rooms.forEach((room) => {
        const start = new Date(room.startTime).getTime()
        const end = new Date(room.endTime).getTime()
        if (room.status === 'Upcoming' && start <= now && end > now) {
          adminUpdateRoom(room.id, { status: 'Live', paymentStatus: 'Open', settlementStatus: 'Waiting Auction End' })
        }
        if (room.status === 'Live' && end <= now) {
          adminUpdateRoom(room.id, { status: 'Ended', paymentStatus: room.winnerUserId ? 'Awaiting Winner Payment' : 'No Winner', settlementStatus: room.winnerUserId ? 'On Hold' : 'Closed' })
        }
      })
    }
    run()
    const timer = window.setInterval(run, 1000)
    return () => window.clearInterval(timer)
  }, [state.rooms, adminUpdateRoom])

  function flash(resultOrMessage) {
    if (typeof resultOrMessage === 'string') setMessage(resultOrMessage)
    else setMessage(resultOrMessage?.message || 'Admin action completed.')
  }
  function setRoomField(field, value) {
    setRoomForm((prev) => ({ ...prev, [field]: value }))
  }

  function createRoom(event) {
    event.preventDefault()
    const durationMinutes = clampDuration(roomForm.durationMinutes)
    const start = new Date(roomForm.startTimeLocal)
    if (Number.isNaN(start.getTime())) return setMessage('Vui lòng chọn ngày giờ mở room hợp lệ.')
    if (roomForm.hasPassword && !roomForm.roomPassword.trim()) return setMessage('Vui lòng nhập mật khẩu phòng hoặc chọn Không mật khẩu.')

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
    const selectedProduct = verifiedProducts.find((product) => product.id === roomForm.productId)
    const customProductName = roomForm.customProductName.trim()
    const title = roomForm.title.trim() || customProductName || selectedProduct?.name || 'New Auction Room'
    const shouldOpenNow = start.getTime() <= Date.now() && end.getTime() > Date.now()

    adminCreateRoom({
      ...roomForm,
      title,
      productName: customProductName || selectedProduct?.name || title,
      productId: roomForm.productId,
      status: shouldOpenNow ? 'Live' : 'Upcoming',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes,
      roomPassword: roomForm.hasPassword ? roomForm.roomPassword.trim() : '',
    })
    setRoomForm((prev) => ({
      ...prev,
      title: '',
      customProductName: '',
      startingPrice: 500,
      minIncrement: 50,
      startTimeLocal: toLocalInputValue(),
      durationMinutes: 60,
      hasPassword: false,
      roomPassword: '',
    }))
    flash(`Đã tạo room ${title}. Mở lúc ${formatDateTime(start.toISOString())}, thời lượng ${durationMinutes} phút.`)
  }

  function reviewDeposit(requestId, decision) {
    const request = depositRequests.find((item) => item.id === requestId)
    if (!request || request.status !== 'Pending Admin Review') return flash('Chỉ xử lý yêu cầu đã được member/seller bấm gửi yêu cầu nạp.')
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
        transactions: [{ id: `tx-dep-approved-${Date.now()}`, type: 'Deposit Approved', amount: request.creditAmount, time: now, note: `Top up approved: ${request.transactionCode} · ${vnd(request.vndAmount)}` }, ...(user.transactions || [])],
      })
      flash(`Đã duyệt nạp ${money(request.creditAmount)} cho ${request.userName}.`)
    } else {
      adminUpdateUser(user.id, {
        transactions: [{ id: `tx-dep-rejected-${Date.now()}`, type: 'Deposit Rejected', amount: 0, time: now, note: `Top up rejected: ${request.transactionCode}. Refund/return payment outside demo.` }, ...(user.transactions || [])],
      })
      flash(`Đã từ chối nạp của ${request.userName}.`)
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
      flash(`Đã duyệt rút của ${request.userName}.`)
    } else {
      adminUpdateUser(user.id, {
        wallet: { available: user.wallet.available + request.amount, pending: Math.max(0, user.wallet.pending - request.amount) },
        transactions: [{ id: `tx-wd-rejected-${Date.now()}`, type: 'Withdrawal Rejected', amount: request.amount, time: now, note: `Admin rejected withdrawal and returned ${money(request.amount)}` }, ...currentTransactions],
      })
      flash(`Đã từ chối rút của ${request.userName}. Credit đã trả về ví khả dụng.`)
    }
  }

  function winnerName(room) {
    const user = state.users.find((item) => item.id === room.winnerUserId)
    return user?.name || 'No winner yet'
  }
  function durationText(room) {
    const minutes = Math.round((new Date(room.endTime).getTime() - new Date(room.startTime).getTime()) / 60000)
    return `${Math.max(0, minutes)} phút`
  }

  function renderDepositCard(request) {
    return <div key={request.id} className="soft-card p-4"><div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start"><div><div className="flex flex-wrap items-center gap-2"><p className="text-lg font-black text-white">{request.userName}</p><Badge>{request.userRole === 'seller' ? 'SELLER' : 'MEMBER'}</Badge><Badge tone="Pending">{request.status}</Badge><Badge>{request.transactionCode}</Badge></div><p className="mt-2 text-sm text-slate-300">Top up: <strong className="text-auction-gold">{money(request.creditAmount)}</strong> → <strong className="text-white">{vnd(request.vndAmount)}</strong></p><p className="mt-1 text-sm text-slate-300">Bank: {request.bank} · STK: {request.bankAccount} · Holder: {request.accountHolder}</p><p className="mt-1 text-sm text-slate-300">Bill: <strong className={request.billName ? 'text-white' : 'text-rose-200'}>{request.billName || 'Chưa upload bill'}</strong></p><p className="mt-1 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}{request.submittedAt ? ` · Submitted ${formatDateTime(request.submittedAt)}` : ''}</p></div><div className="flex flex-wrap gap-2 xl:justify-end"><button className="btn-secondary !px-3 !py-2" onClick={() => reviewDeposit(request.id, 'Approved')}>Approve Top Up</button><button className="btn-danger !px-3 !py-2" onClick={() => reviewDeposit(request.id, 'Rejected')}>Reject / Refund</button></div></div></div>
  }

  function renderWithdrawCard(request) {
    return <div key={request.id} className="soft-card p-4"><div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start"><div><div className="flex flex-wrap items-center gap-2"><p className="text-lg font-black text-white">{request.userName}</p><Badge>{request.userRole === 'seller' ? 'SELLER' : 'MEMBER'}</Badge><Badge tone="Pending">{request.status}</Badge></div><p className="mt-2 text-sm text-slate-300">Amount: <strong className="text-auction-gold">{money(request.amount)}</strong> → <strong className="text-white">{vnd(request.vndAmount)}</strong></p><p className="mt-1 text-sm text-slate-300">Bank: {request.bankName} · {request.bankAccount} · {request.accountName}</p><p className="mt-1 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}</p></div><div className="flex flex-wrap gap-2 lg:justify-end"><button className="btn-secondary !px-3 !py-2" onClick={() => reviewWithdraw(request.id, 'Approved')}>Approve</button><button className="btn-danger !px-3 !py-2" onClick={() => reviewWithdraw(request.id, 'Rejected')}>Reject</button></div></div></div>
  }

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Admin Dashboard</p><h1 className="page-title mt-2">Control center</h1><p className="muted mt-3 max-w-3xl">Admin System chỉ giữ các yêu cầu đang chờ. Lịch sử duyệt / từ chối nằm ở tab riêng.</p></div>
      {message ? <div className="rounded-2xl border border-auction-neon/30 bg-auction-neon/10 p-4 text-sm text-emerald-100">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><StatCard label="Users" value={state.users.length} /><StatCard label="Rooms" value={state.rooms.length} /><StatCard label="Total Pending" value={money(totalPending)} accent /><StatCard label="Deposit Review" value={pendingDeposits.length} hint="Đã gửi bill + yêu cầu" /><StatCard label="Withdraw Review" value={pendingWithdraws.length} hint="Credit → VNĐ" /></section>
      <PolicyBox title="Admin Deposit Flow">Admin chỉ nhận yêu cầu nạp khi user đã upload bill và bấm “Gửi yêu cầu nạp”. Waiting Bill / Bill Uploaded sẽ không hiện trong hàng chờ Admin.</PolicyBox>

      <section className="glass-card p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Deposit Requests</p><h2 className="mt-2 text-2xl font-black text-white">Yêu cầu nạp đang chờ duyệt</h2></div><Badge>{pendingDeposits.length} pending bills</Badge></div><div className="space-y-3">{pendingDeposits.length ? pendingDeposits.map(renderDepositCard) : <p className="muted">Không có yêu cầu nạp đang chờ duyệt.</p>}</div></section>
      <section className="glass-card p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Withdraw Requests</p><h2 className="mt-2 text-2xl font-black text-white">Yêu cầu rút đang chờ duyệt</h2></div><Badge>{pendingWithdraws.length} pending</Badge></div><div className="space-y-3">{pendingWithdraws.length ? pendingWithdraws.map(renderWithdrawCard) : <p className="muted">Không có yêu cầu rút đang chờ duyệt.</p>}</div></section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="glass-card p-6"><div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Product Verification</p><h2 className="mt-2 text-2xl font-black text-white">Duyệt sản phẩm seller gửi</h2></div><div className="space-y-3">{state.sellerProducts.map((product) => <div key={product.id} className="soft-card p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="font-black text-white">{product.name}</p><p className="mt-1 text-sm text-slate-400">Seller: {state.users.find((user) => user.id === product.sellerId)?.name || product.sellerId}</p><p className="mt-1 text-xs text-slate-500">{product.verificationNote || 'No verification note'}</p></div><Badge>{product.verificationStatus}</Badge></div><div className="mt-4 flex flex-wrap gap-2"><button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateProduct(product.id, { verificationStatus: 'Verified' })}>Verified</button><button className="btn-secondary !px-3 !py-2" onClick={() => adminUpdateProduct(product.id, { verificationStatus: 'Pending' })}>Pending</button><button className="btn-danger !px-3 !py-2" onClick={() => adminUpdateProduct(product.id, { verificationStatus: 'Rejected' })}>Rejected</button></div></div>)}</div></div>
        <form onSubmit={createRoom} className="glass-card p-6"><div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Create Auction Room</p><h2 className="mt-2 text-2xl font-black text-white">Tạo room đấu giá</h2><p className="muted mt-2">Cài giờ mở trước, thời lượng 15 phút đến 24 tiếng. Tới giờ room tự chuyển Live.</p></div><div className="space-y-4"><label><span className="label">Verified Product</span><select className="field" value={roomForm.productId} onChange={(e) => setRoomField('productId', e.target.value)}><option value="">Manual / No Product</option>{verifiedProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label><span className="label">Nhập tên sản phẩm thủ công</span><input className="field" value={roomForm.customProductName} onChange={(e) => setRoomField('customProductName', e.target.value)} placeholder="VD: Porsche 911 Premium Diecast" /></label><label><span className="label">Seller</span><select className="field" value={roomForm.sellerId} onChange={(e) => setRoomField('sellerId', e.target.value)}>{sellerUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><label><span className="label">Room Title</span><input className="field" value={roomForm.title} onChange={(e) => setRoomField('title', e.target.value)} placeholder="Để trống sẽ dùng tên sản phẩm" /></label><div className="grid gap-4 md:grid-cols-2"><label><span className="label">Ngày giờ dự kiến mở</span><input className="field" type="datetime-local" value={roomForm.startTimeLocal} onChange={(e) => setRoomField('startTimeLocal', e.target.value)} /></label><label><span className="label">Thời lượng room, phút</span><input className="field" type="number" min={MIN_DURATION} max={MAX_DURATION} value={roomForm.durationMinutes} onChange={(e) => setRoomField('durationMinutes', clampDuration(e.target.value))} /><span className="mt-2 block text-xs text-slate-400">Tối thiểu 15 phút · tối đa 1440 phút / 24 tiếng</span></label></div><div className="grid gap-4 md:grid-cols-2"><label><span className="label">Room Level</span><select className="field" value={roomForm.roomLevel} onChange={(e) => setRoomField('roomLevel', e.target.value)}><option>Basic</option><option>Pro</option><option>VIP</option></select></label><label><span className="label">Status</span><select className="field" value={roomForm.status} onChange={(e) => setRoomField('status', e.target.value)}><option>Upcoming</option><option>Live</option><option>Paused</option><option>Locked</option><option>Ended</option></select></label></div><div className="grid gap-4 md:grid-cols-2"><label><span className="label">Starting Price</span><input className="field" type="number" value={roomForm.startingPrice} onChange={(e) => setRoomField('startingPrice', e.target.value)} /></label><label><span className="label">Min Increment</span><input className="field" type="number" value={roomForm.minIncrement} onChange={(e) => setRoomField('minIncrement', e.target.value)} /></label></div><div className="rounded-3xl border border-white/10 bg-black/25 p-4"><span className="label">Room Password</span><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="soft-card flex items-center gap-3 p-4"><input type="radio" checked={!roomForm.hasPassword} onChange={() => setRoomForm({ ...roomForm, hasPassword: false, roomPassword: '' })} /><span className="font-black text-white">Không mật khẩu</span></label><label className="soft-card flex items-center gap-3 p-4"><input type="radio" checked={roomForm.hasPassword} onChange={() => setRoomForm({ ...roomForm, hasPassword: true })} /><span className="font-black text-white">Có mật khẩu</span></label></div>{roomForm.hasPassword ? <label className="mt-4 block"><span className="label">Tạo mật khẩu phòng</span><input className="field" value={roomForm.roomPassword} onChange={(e) => setRoomField('roomPassword', e.target.value)} placeholder="VD: VIP911 hoặc 123456" /></label> : null}</div><button className="btn-primary w-full" type="submit">Create Room</button></div></form>
      </section>

      <section className="glass-card p-6"><div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Room Operations</p><h2 className="mt-2 text-2xl font-black text-white">Tạm dừng / khoá / xử lý winner</h2></div><div className="space-y-4">{state.rooms.map((room) => { const activeBid = room.bids.find((bid) => bid.status === 'active'); const paidBid = room.bids.find((bid) => bid.status === 'paid'); return <div key={room.id} className="soft-card p-4"><div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]"><div><div className="flex flex-wrap gap-2"><Badge>{room.roomLevel}</Badge><Badge>{room.status}</Badge><Badge tone="default">{room.hasPassword ? `PASS: ${room.roomPassword}` : 'NO PASS'}</Badge><Badge tone="default">{room.paymentStatus}</Badge><Badge tone="default">{durationText(room)}</Badge></div><a href={`#/room/${room.id}`} className="mt-3 block text-xl font-black text-white hover:text-auction-gold">{room.title}</a><p className="mt-1 text-sm text-slate-400">Winner: {winnerName(room)} · Highest: {money(room.currentHighestBid)}</p><p className="mt-1 text-xs text-slate-500">Start {formatDateTime(room.startTime)} · End {formatDateTime(room.endTime)}</p></div><div className="flex flex-wrap items-start gap-2"><select className="field !w-32 !px-3 !py-2" value={room.roomLevel} onChange={(e) => adminUpdateRoom(room.id, { roomLevel: e.target.value })}><option>Basic</option><option>Pro</option><option>VIP</option></select><select className="field !w-36 !px-3 !py-2" value={room.status} onChange={(e) => adminUpdateRoom(room.id, { status: e.target.value })}><option>Upcoming</option><option>Live</option><option>Paused</option><option>Locked</option><option>Ended</option></select><button className="btn-secondary !px-3 !py-2" onClick={() => flash(adminPauseRoom(room.id))}>Pause</button><button className="btn-danger !px-3 !py-2" onClick={() => flash(adminLockRoom(room.id))}>Lock</button><button className="btn-secondary !px-3 !py-2" onClick={() => flash(adminResumeRoom(room.id))}>Resume</button><button className="btn-danger !px-3 !py-2" onClick={() => activeBid ? flash(adminBanMember(activeBid.userId, room.id)) : flash('No active bidder to ban.')} disabled={!activeBid}>Ban highest</button><button className="btn-secondary !px-3 !py-2" onClick={() => flash(adminMarkWinnerPaid(room.id))} disabled={!activeBid}>Mark as Paid</button><button className="btn-danger !px-3 !py-2" onClick={() => flash(adminMarkFailedPayment(room.id))} disabled={!activeBid}>Failed Payment</button><button className="btn-secondary !px-3 !py-2" onClick={() => flash(adminReleaseSettlement(room.id))} disabled={!paidBid || room.settlementStatus === 'Released'}>Release Settlement</button></div></div></div> })}</div></section>
    </div>
  )
}
