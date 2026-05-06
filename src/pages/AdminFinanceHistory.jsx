import { useState } from 'react'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import { formatDateTime, money } from '../utils/policies'

const WITHDRAW_KEY = 'auction-credit-withdraw-requests-v1'
const DEPOSIT_KEY = 'auction-credit-deposit-requests-v1'

function loadStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function vnd(value) { return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ` }

function DepositHistoryCard({ request }) {
  return (
    <div className="soft-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-lg font-black text-white">{request.userName}</p>
        <Badge>{request.userRole === 'seller' ? 'SELLER' : 'MEMBER'}</Badge>
        <Badge tone={request.status === 'Approved' ? 'Approved' : 'Rejected'}>{request.status}</Badge>
        <Badge>{request.transactionCode}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-300">Top up: <strong className="text-auction-gold">{money(request.creditAmount)}</strong> → <strong className="text-white">{vnd(request.vndAmount)}</strong></p>
      <p className="mt-1 text-sm text-slate-300">Bank: {request.bank} · STK: {request.bankAccount} · Holder: {request.accountHolder}</p>
      <p className="mt-1 text-sm text-slate-300">Bill: <strong className={request.billName ? 'text-white' : 'text-rose-200'}>{request.billName || 'Chưa upload bill'}</strong></p>
      <p className="mt-1 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}{request.submittedAt ? ` · Submitted ${formatDateTime(request.submittedAt)}` : ''}{request.reviewedAt ? ` · Reviewed ${formatDateTime(request.reviewedAt)}` : ''}</p>
      {request.reviewNote ? <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-slate-300">Admin note: {request.reviewNote}</p> : null}
    </div>
  )
}

function WithdrawHistoryCard({ request }) {
  return (
    <div className="soft-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-lg font-black text-white">{request.userName}</p>
        <Badge>{request.userRole === 'seller' ? 'SELLER' : 'MEMBER'}</Badge>
        <Badge tone={request.status === 'Approved' ? 'Approved' : 'Rejected'}>{request.status}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-300">Amount: <strong className="text-auction-gold">{money(request.amount)}</strong> → <strong className="text-white">{vnd(request.vndAmount)}</strong></p>
      <p className="mt-1 text-sm text-slate-300">Bank: {request.bankName} · {request.bankAccount} · {request.accountName}</p>
      <p className="mt-1 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}{request.reviewedAt ? ` · Reviewed ${formatDateTime(request.reviewedAt)}` : ''}</p>
      {request.reviewNote ? <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-slate-300">Admin note: {request.reviewNote}</p> : null}
    </div>
  )
}

export default function AdminFinanceHistory() {
  const [depositRequests] = useState(() => loadStore(DEPOSIT_KEY))
  const [withdrawRequests] = useState(() => loadStore(WITHDRAW_KEY))
  const reviewedDeposits = depositRequests.filter((request) => ['Approved', 'Rejected'].includes(request.status))
  const reviewedWithdraws = withdrawRequests.filter((request) => ['Approved', 'Rejected'].includes(request.status))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Finance Review History</p>
        <h1 className="page-title mt-2">Lịch sử duyệt / từ chối nạp rút</h1>
        <p className="muted mt-3 max-w-3xl">Trang riêng cho Admin xem lại các bill đã xử lý. Mỗi khung chỉ hiện khoảng 3 bill gần nhất, kéo trong khung để xem thêm.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Deposit History" value={reviewedDeposits.length} hint="Approved / Rejected top up" />
        <StatCard label="Withdraw History" value={reviewedWithdraws.length} hint="Approved / Rejected payout" />
        <StatCard label="Total History" value={reviewedDeposits.length + reviewedWithdraws.length} hint="Finance review logs" accent />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Deposit History</p>
              <h2 className="mt-2 text-2xl font-black text-white">Nạp Credit</h2>
            </div>
            <Badge>{reviewedDeposits.length} bills</Badge>
          </div>
          <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
            {reviewedDeposits.length ? reviewedDeposits.map((request) => <DepositHistoryCard key={request.id} request={request} />) : <p className="muted">Chưa có lịch sử nạp.</p>}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Withdraw History</p>
              <h2 className="mt-2 text-2xl font-black text-white">Rút Credit</h2>
            </div>
            <Badge>{reviewedWithdraws.length} bills</Badge>
          </div>
          <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
            {reviewedWithdraws.length ? reviewedWithdraws.map((request) => <WithdrawHistoryCard key={request.id} request={request} />) : <p className="muted">Chưa có lịch sử rút.</p>}
          </div>
        </div>
      </section>
    </div>
  )
}
