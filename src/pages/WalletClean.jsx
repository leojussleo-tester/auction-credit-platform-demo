import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import PolicyBox from '../components/PolicyBox'
import { useAuction } from '../context/AuctionContext'
import { formatDateTime, money } from '../utils/policies'

const DEPOSIT_KEY = 'auction-credit-deposit-requests-v1'
const WITHDRAW_KEY = 'auction-credit-withdraw-requests-v1'
const AC_TO_VND = 1000
const BANK = {
  bank: 'Techcom Bank',
  bankCode: '970407',
  account: '797979292929',
  holder: 'LE HONG PHUC',
}

function loadStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function vnd(value) { return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ` }
function makeCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return `${chars[Math.floor(Math.random() * 26)]}${chars[Math.floor(Math.random() * 26)]}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`
}
function qrUrl(request) {
  return `https://img.vietqr.io/image/${request.bankCode || BANK.bankCode}-${request.bankAccount || BANK.account}-compact2.png?amount=${Number(request.vndAmount || 0)}&addInfo=${encodeURIComponent(request.transactionCode || '')}&accountName=${encodeURIComponent(request.accountHolder || BANK.holder)}`
}
function tone(status) {
  if (status === 'Approved') return 'Approved'
  if (status === 'Rejected') return 'Rejected'
  if (status === 'Pending Admin Review' || status === 'Pending Review') return 'Pending'
  return 'default'
}

function CenterModal({ children }) {
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-3 backdrop-blur-md"><div className="glass-card max-h-[86vh] w-full max-w-[680px] overflow-y-auto p-4 md:p-6">{children}</div></div>
}

function DepositModal({ request, mode, error, success, onClose, onFile, onSubmit }) {
  if (!request) return null
  const locked = mode === 'detail' || ['Pending Admin Review', 'Approved', 'Rejected'].includes(request.status) || success
  return <CenterModal>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-auction-gold">Deposit Request</p>
        <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">Thông tin chuyển khoản</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Quét VietQR, chuyển đúng số tiền + mã GD, upload bill rồi gửi yêu cầu nạp.</p>
      </div>
      <button onClick={onClose} className="btn-secondary shrink-0 !px-3 !py-2 !text-xs">Đóng</button>
    </div>
    {success ? <div className="mt-3 rounded-2xl border border-emerald-300/40 bg-emerald-500/15 p-3 text-xs font-bold leading-5 text-emerald-100">Đã gửi yêu cầu nạp. Vui lòng đợi Admin xử lý, thời gian xử lý tối đa 15 phút.</div> : null}
    {error ? <div className="mt-3 rounded-2xl border border-rose-400/50 bg-rose-500/15 p-3 text-xs font-bold leading-5 text-rose-100">{error}</div> : null}
    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
      <div className="soft-card p-4">
        <div className="flex flex-wrap gap-2"><Badge tone={tone(request.status)}>{request.status}</Badge><Badge>{request.transactionCode}</Badge></div>
        <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <p>Nạp: <strong className="text-auction-gold">{money(request.creditAmount)}</strong></p>
          <p>Số tiền: <strong className="text-white">{vnd(request.vndAmount)}</strong></p>
          <p>Bank: <strong className="text-white">{request.bank}</strong></p>
          <p>STK: <strong className="text-white">{request.bankAccount}</strong></p>
          <p className="sm:col-span-2">Chủ TK: <strong className="text-white">{request.accountHolder}</strong></p>
          <p className="sm:col-span-2">Mã GD / Nội dung CK: <strong className="text-auction-gold">{request.transactionCode}</strong></p>
        </div>
        <label className="mt-4 block">
          <span className={`label ${error ? '!text-rose-200' : ''}`}>Upload bill chuyển khoản bắt buộc</span>
          <input className={`field !py-2 ${error ? '!border-rose-400 !bg-rose-500/10' : ''}`} type="file" accept="image/*" disabled={locked} onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {request.billName ? <p className="mt-2 text-xs text-slate-300">Bill: <strong className="text-white">{request.billName}</strong></p> : <p className="mt-2 text-xs text-slate-400">Chưa có bill đính kèm.</p>}
        <p className="mt-2 text-[11px] leading-5 text-slate-400">Created {formatDateTime(request.createdAt)}{request.submittedAt ? ` · Sent ${formatDateTime(request.submittedAt)}` : ''}{request.reviewedAt ? ` · Reviewed ${formatDateTime(request.reviewedAt)}` : ''}</p>
        {request.reviewNote ? <p className="mt-3 rounded-2xl bg-black/30 p-3 text-xs text-slate-300">Admin note: {request.reviewNote}</p> : null}
        {mode === 'create' ? <button className="btn-primary mt-4 w-full !py-2.5" disabled={success} onClick={onSubmit}>Gửi yêu cầu nạp</button> : null}
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 text-center">
        <img src={qrUrl(request)} alt={`VietQR ${request.transactionCode}`} className="mx-auto w-[180px] max-w-full rounded-2xl bg-white p-2" />
        <p className="mt-2 text-[11px] leading-5 text-slate-300">VietQR Techcom Bank, STK, số tiền và mã GD.</p>
      </div>
    </div>
  </CenterModal>
}

function WithdrawModal({ open, form, available, error, success, onClose, onChange, onSubmit }) {
  if (!open) return null
  return <CenterModal>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-auction-gold">Withdraw</p>
        <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">Rút Credit → VNĐ</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Chỉ được rút từ Available Credit. Pending Credit không được tính.</p>
      </div>
      <button onClick={onClose} className="btn-secondary shrink-0 !px-3 !py-2 !text-xs">Đóng</button>
    </div>
    <div className="mt-4 flex flex-wrap gap-2"><Badge tone="default">Available: {money(available)}</Badge><Badge tone="default">1 AC = 1.000 VNĐ</Badge></div>
    {success ? <div className="mt-3 rounded-2xl border border-emerald-300/40 bg-emerald-500/15 p-3 text-xs font-bold leading-5 text-emerald-100">Đã gửi yêu cầu rút. Admin sẽ duyệt hoặc từ chối.</div> : null}
    {error ? <div className="mt-3 rounded-2xl border border-rose-400/50 bg-rose-500/15 p-3 text-xs font-bold leading-5 text-rose-100">{error}</div> : null}
    <form onSubmit={onSubmit} className="mt-4 soft-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="label">Credit muốn rút</span><input className="field !py-2.5" type="number" min="1" max={available} value={form.amount} onChange={(e) => onChange('amount', Number(e.target.value))} /></label>
        <label><span className="label">Tạm tính VNĐ</span><input className="field !py-2.5" readOnly value={vnd(Number(form.amount || 0) * AC_TO_VND)} /></label>
        <label><span className="label">Ngân hàng</span><input className="field !py-2.5" value={form.bankName} onChange={(e) => onChange('bankName', e.target.value)} /></label>
        <label><span className="label">Số tài khoản</span><input className="field !py-2.5" value={form.bankAccount} onChange={(e) => onChange('bankAccount', e.target.value)} /></label>
        <label className="sm:col-span-2"><span className="label">Tên chủ tài khoản</span><input className="field !py-2.5" value={form.accountName} onChange={(e) => onChange('accountName', e.target.value)} /></label>
        <label className="sm:col-span-2"><span className="label">Ghi chú</span><textarea className="field min-h-20" value={form.note} onChange={(e) => onChange('note', e.target.value)} /></label>
      </div>
      <button className="btn-primary mt-4 w-full !py-2.5" type="submit">Gửi yêu cầu rút</button>
    </form>
  </CenterModal>
}

export default function WalletClean() {
  const { state, currentUser, currentMemberLevel, updateCurrentUser } = useAuction()
  const [amount, setAmount] = useState(2000)
  const [depositRequests, setDepositRequests] = useState(() => loadStore(DEPOSIT_KEY))
  const [withdrawRequests, setWithdrawRequests] = useState(() => loadStore(WITHDRAW_KEY))
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [deposit, setDeposit] = useState(null)
  const [depositMode, setDepositMode] = useState('create')
  const [depositError, setDepositError] = useState('')
  const [depositSuccess, setDepositSuccess] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({ amount: 1000, bankName: 'Demo Bank', bankAccount: currentUser.phone || '', accountName: currentUser.name, note: '' })

  const userDeposits = depositRequests.filter((r) => r.userId === currentUser.id)
  const userWithdraws = withdrawRequests.filter((r) => r.userId === currentUser.id)
  const activeBids = useMemo(() => state.rooms.flatMap((room) => room.bids.map((bid) => ({ ...bid, roomTitle: room.title, roomId: room.id }))).filter((bid) => bid.userId === currentUser.id && ['active', 'paid', 'failed'].includes(bid.status)), [state.rooms, currentUser.id])

  function notify(text, type = 'success') { setMessage(text); setMessageType(type) }
  function startDeposit() {
    const creditAmount = Number(amount)
    if (!creditAmount || creditAmount <= 0) return notify('Số credit cần nạp phải lớn hơn 0.', 'error')
    setDeposit({ id: `dep-${Date.now()}`, userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, creditAmount, vndAmount: creditAmount * AC_TO_VND, bank: BANK.bank, bankCode: BANK.bankCode, bankAccount: BANK.account, accountHolder: BANK.holder, transactionCode: makeCode(), status: 'Waiting Bill', billName: '', createdAt: new Date().toISOString(), billUploadedAt: null, submittedAt: null, reviewedAt: null, reviewNote: '' })
    setDepositMode('create'); setDepositError(''); setDepositSuccess(false)
  }
  function uploadDeposit(file) {
    if (!file || !deposit) return
    setDeposit({ ...deposit, status: 'Bill Uploaded', billName: file.name || `bill-${deposit.transactionCode}.png`, billUploadedAt: new Date().toISOString() })
    setDepositError('')
  }
  function submitDeposit() {
    if (!deposit) return
    if (!deposit.billName) return setDepositError('Vui lòng bổ sung bill chuyển khoản trước khi gửi yêu cầu nạp.')
    const submitted = { ...deposit, status: 'Pending Admin Review', submittedAt: new Date().toISOString() }
    const next = [submitted, ...depositRequests]
    setDepositRequests(next); saveStore(DEPOSIT_KEY, next); setDeposit(submitted); setDepositSuccess(true); notify('Đã gửi yêu cầu nạp. Vui lòng đợi Admin xử lý tối đa 15 phút.')
  }
  function openDepositDetail(r) { setDeposit(r); setDepositMode('detail'); setDepositError(''); setDepositSuccess(false) }
  function closeDeposit() { setDeposit(null); setDepositError(''); setDepositSuccess(false) }

  function changeWithdraw(field, value) { setWithdrawForm((prev) => ({ ...prev, [field]: value })) }
  function openWithdraw() { setWithdrawOpen(true); setWithdrawError(''); setWithdrawSuccess(false) }
  function closeWithdraw() { setWithdrawOpen(false); setWithdrawError(''); setWithdrawSuccess(false) }
  function submitWithdraw(e) {
    e.preventDefault()
    const value = Number(withdrawForm.amount)
    if (!value || value <= 0) { setWithdrawError('Số Credit muốn rút phải lớn hơn 0.'); return notify('Số Credit muốn rút phải lớn hơn 0.', 'error') }
    if (value > currentUser.wallet.available) { setWithdrawError('Không đủ Available Credit để rút. Pending Credit không được tính.'); return notify('Không đủ Available Credit để rút.', 'error') }
    const request = { id: `wd-${Date.now()}`, userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, amount: value, vndAmount: value * AC_TO_VND, bankName: withdrawForm.bankName, bankAccount: withdrawForm.bankAccount, accountName: withdrawForm.accountName, note: withdrawForm.note, status: 'Pending Review', createdAt: new Date().toISOString(), reviewedAt: null, reviewNote: '' }
    const next = [request, ...withdrawRequests]
    setWithdrawRequests(next); saveStore(WITHDRAW_KEY, next)
    updateCurrentUser({ wallet: { available: currentUser.wallet.available - value, pending: currentUser.wallet.pending + value }, transactions: [{ id: `tx-wd-${Date.now()}`, type: 'Withdrawal Pending', amount: -value, time: new Date().toISOString(), note: `Request withdraw ${money(value)} → ${vnd(value * AC_TO_VND)}` }, ...(currentUser.transactions || [])] })
    setWithdrawSuccess(true); setWithdrawError(''); notify('Đã gửi yêu cầu rút Credit → VNĐ.')
  }

  return <div className="space-y-6">
    <DepositModal request={deposit} mode={depositMode} error={depositError} success={depositSuccess} onClose={closeDeposit} onFile={uploadDeposit} onSubmit={submitDeposit} />
    <WithdrawModal open={withdrawOpen} form={withdrawForm} available={currentUser.wallet.available} error={withdrawError} success={withdrawSuccess} onClose={closeWithdraw} onChange={changeWithdraw} onSubmit={submitWithdraw} />

    <div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">My Wallet / Ví của tôi</p><h1 className="page-title mt-2">Auction Credit wallet</h1><p className="muted mt-3 max-w-3xl">Nạp Credit bằng VietQR trong pop-up. Rút Credit bằng form pop-up gọn để tiết kiệm không gian.</p></div>
    {message ? <div className={`rounded-2xl border p-4 text-sm ${messageType === 'error' ? 'border-rose-400/50 bg-rose-500/15 text-rose-100' : 'border-auction-neon/30 bg-auction-neon/10 text-emerald-100'}`}>{message}</div> : null}

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatCard label="Available Credit" value={money(currentUser.wallet.available)} hint="Chỉ số dư này được dùng để rút" /><StatCard label="Pending Credit" value={money(currentUser.wallet.pending)} hint="Không được tính vào số dư rút" accent /><StatCard label="Total Credit" value={money(currentUser.wallet.available + currentUser.wallet.pending)} hint="Available + Pending" /><StatCard label="Current Member" value={currentMemberLevel} hint={`${currentUser.score} score points`} /></section>

    <section className="grid gap-6 xl:grid-cols-[420px_1fr]"><div className="glass-card p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Top Up / Nạp Credit</p><h2 className="mt-2 text-2xl font-black text-white">Tạo yêu cầu nạp Credit</h2></div><Badge tone="default">Techcom Bank</Badge></div><label className="mt-6 block"><span className="label">Số Credit cần nạp</span><input className="field" type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label><div className="mt-4 rounded-2xl border border-auction-gold/20 bg-auction-gold/10 p-4 text-sm text-slate-200"><p>Quy đổi: <strong className="text-white">{money(amount)}</strong> = <strong className="text-auction-gold">{vnd(Number(amount || 0) * AC_TO_VND)}</strong></p><p className="mt-1 text-xs text-slate-400">Bấm tạo để mở pop-up VietQR và upload bill.</p></div><button onClick={startDeposit} className="btn-primary mt-4 w-full">Tạo thông tin chuyển khoản</button><PolicyBox title="Top Up Approval Policy" type="gold">Yêu cầu chỉ gửi tới Admin sau khi upload bill và bấm Gửi yêu cầu nạp trong pop-up.</PolicyBox></div><div className="glass-card p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Deposit Requests</p><h2 className="mt-2 text-2xl font-black text-white">Lịch sử yêu cầu nạp</h2><p className="muted mt-2">Hiện 3 giao dịch gần nhất. Kéo trong khung để xem thêm.</p></div><Badge>{userDeposits.length} requests</Badge></div><div className="max-h-[390px] space-y-3 overflow-y-auto pr-2">{userDeposits.length ? userDeposits.map((r) => <button key={r.id} onClick={() => openDepositDetail(r)} className="soft-card block w-full p-4 text-left transition hover:-translate-y-0.5 hover:border-auction-gold/50"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><Badge tone={tone(r.status)}>{r.status}</Badge><Badge>{r.transactionCode}</Badge></div><p className="mt-2 font-black text-white">{money(r.creditAmount)} / {vnd(r.vndAmount)}</p><p className="mt-1 text-xs text-slate-400">Sent {r.submittedAt ? formatDateTime(r.submittedAt) : formatDateTime(r.createdAt)}</p></div><span className="text-2xl text-auction-gold">›</span></div></button>) : <p className="muted">Chưa có yêu cầu đã gửi.</p>}</div></div></section>

    <section className="grid gap-6 xl:grid-cols-2"><div className="glass-card p-6"><h2 className="text-2xl font-black text-white">Current Active Bids</h2><div className="mt-5 space-y-3">{activeBids.length ? activeBids.map((bid) => <div key={bid.id} className="soft-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><a href={`#/room/${bid.roomId}`} className="font-black text-white hover:text-auction-gold">{bid.roomTitle}</a><p className="mt-1 text-sm text-slate-400">Bid {money(bid.amount)} · Pending {money(bid.pendingAmount)}</p></div><Badge tone={tone(bid.status)}>{bid.status}</Badge></div></div>) : <p className="muted">No current active bids.</p>}</div></div><div className="glass-card p-6"><h2 className="text-2xl font-black text-white">Bid Win History</h2><div className="mt-5 space-y-3">{(currentUser.winHistory || []).length ? currentUser.winHistory.map((win) => <div key={win.id} className="soft-card p-4"><p className="font-black text-white">{win.roomTitle}</p><p className="mt-1 text-sm text-slate-400">Paid {money(win.amount)} · {formatDateTime(win.paidAt)}</p></div>) : <p className="muted">No win history yet.</p>}</div></div></section>

    <section className="glass-card p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Withdraw</p><h2 className="mt-2 text-2xl font-black text-white">Rút Credit → VNĐ</h2><p className="muted mt-2">Form rút nằm trong pop-up. Chỉ rút từ Available Credit.</p></div><button onClick={openWithdraw} className="btn-primary">Rút Credit</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="soft-card p-4"><p className="text-sm text-slate-300">Available có thể rút</p><p className="mt-1 text-2xl font-black text-white">{money(currentUser.wallet.available)}</p></div><div className="soft-card p-4"><p className="text-sm text-slate-300">Pending không thể rút</p><p className="mt-1 text-2xl font-black text-auction-gold">{money(currentUser.wallet.pending)}</p></div></div></section>
    <section className="glass-card p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Withdrawal Requests</p><h2 className="mt-2 text-2xl font-black text-white">Lịch sử yêu cầu rút</h2></div><Badge>{userWithdraws.length} requests</Badge></div><div className="space-y-3">{userWithdraws.length ? userWithdraws.map((r) => <div key={r.id} className="soft-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-white">{money(r.amount)} → {vnd(r.vndAmount)}</p><p className="mt-1 text-sm text-slate-300">{r.bankName} · {r.bankAccount} · {r.accountName}</p><p className="mt-1 text-xs text-slate-400">Created {formatDateTime(r.createdAt)}{r.reviewedAt ? ` · Reviewed ${formatDateTime(r.reviewedAt)}` : ''}</p></div><Badge tone={tone(r.status)}>{r.status}</Badge></div>{r.reviewNote ? <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-slate-300">Admin note: {r.reviewNote}</p> : null}</div>) : <p className="muted">Chưa có yêu cầu rút nào.</p>}</div></section>
  </div>
}
