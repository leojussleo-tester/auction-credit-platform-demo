import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import PolicyBox from '../components/PolicyBox'
import { useAuction } from '../context/AuctionContext'
import { formatDateTime, getMemberUpgradeHint, money } from '../utils/policies'

const WITHDRAW_KEY = 'auction-credit-withdraw-requests-v1'
const AC_TO_VND = 1000

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

export default function Wallet() {
  const { state, currentUser, currentMemberLevel, topUpCredit, updateCurrentUser } = useAuction()
  const [amount, setAmount] = useState(2000)
  const [withdrawForm, setWithdrawForm] = useState({ amount: 1000, bankName: 'Demo Bank', bankAccount: currentUser.phone || '', accountName: currentUser.name, note: '' })
  const [withdrawRequests, setWithdrawRequests] = useState(loadWithdrawRequests)
  const [message, setMessage] = useState('')

  const userWithdrawRequests = withdrawRequests.filter((request) => request.userId === currentUser.id)

  const activeBids = useMemo(() => {
    return state.rooms
      .flatMap((room) => room.bids.map((bid) => ({ ...bid, roomTitle: room.title, roomId: room.id, roomStatus: room.status })))
      .filter((bid) => bid.userId === currentUser.id && ['active', 'paid', 'failed'].includes(bid.status))
  }, [state.rooms, currentUser.id])

  function onTopUp() {
    const result = topUpCredit(amount)
    setMessage(result.message)
  }

  function updateWithdraw(field, value) {
    setWithdrawForm((prev) => ({ ...prev, [field]: value }))
  }

  function submitWithdraw(event) {
    event.preventDefault()
    const withdrawAmount = Number(withdrawForm.amount)
    if (!withdrawAmount || withdrawAmount <= 0) {
      setMessage('Withdrawal amount must be greater than 0.')
      return
    }
    if (withdrawAmount > currentUser.wallet.available) {
      setMessage('Available Credit không đủ để tạo yêu cầu rút.')
      return
    }

    const request = {
      id: `wd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      amount: withdrawAmount,
      vndAmount: withdrawAmount * AC_TO_VND,
      bankName: withdrawForm.bankName,
      bankAccount: withdrawForm.bankAccount,
      accountName: withdrawForm.accountName,
      note: withdrawForm.note,
      status: 'Pending Review',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewNote: '',
    }

    const nextRequests = [request, ...withdrawRequests]
    setWithdrawRequests(nextRequests)
    saveWithdrawRequests(nextRequests)

    updateCurrentUser({
      wallet: {
        available: currentUser.wallet.available - withdrawAmount,
        pending: currentUser.wallet.pending + withdrawAmount,
      },
      transactions: [
        {
          id: `tx-wd-${Date.now()}`,
          type: 'Withdrawal Pending',
          amount: -withdrawAmount,
          time: new Date().toISOString(),
          note: `Request withdraw ${money(withdrawAmount)} → ${vnd(withdrawAmount * AC_TO_VND)}`,
        },
        ...(currentUser.transactions || []),
      ],
    })

    setMessage('Đã gửi yêu cầu rút Credit → VNĐ. Admin sẽ duyệt hoặc từ chối.')
    setWithdrawForm((prev) => ({ ...prev, amount: 1000, note: '' }))
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">My Wallet</p>
        <h1 className="page-title mt-2">Auction Credit wallet</h1>
        <p className="muted mt-3 max-w-3xl">Theo dõi Available Credit, Pending Credit, bid đang active, win history, transaction history và yêu cầu rút Credit về VNĐ.</p>
      </div>

      {message ? <div className="rounded-2xl border border-auction-neon/30 bg-auction-neon/10 p-4 text-sm text-emerald-100">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available Credit" value={money(currentUser.wallet.available)} hint="Credit có thể dùng để pending, bid hoặc yêu cầu rút" />
        <StatCard label="Pending Credit" value={money(currentUser.wallet.pending)} hint="Credit đang bị giữ do bid hoặc withdrawal review" accent />
        <StatCard label="Total Credit" value={money(currentUser.wallet.available + currentUser.wallet.pending)} hint="Available + Pending" />
        <StatCard label="Current Member" value={currentMemberLevel} hint={`${currentUser.score} score points`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Top Up</p>
              <h2 className="mt-2 text-2xl font-black text-white">Top Up Demo Credit</h2>
            </div>
            <Badge tone="default">Mock</Badge>
          </div>
          <label className="mt-6 block">
            <span className="label">Amount</span>
            <input className="field" type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </label>
          <button onClick={onTopUp} className="btn-primary mt-4 w-full">Top Up Demo Credit</button>
          <PolicyBox title="Credit Pending Policy" type="gold">
            Top up không thanh toán thật. Credit chỉ là số dư nội bộ để demo giữ quyền tham gia đấu giá.
          </PolicyBox>
        </div>

        <form onSubmit={submitWithdraw} className="glass-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Withdraw</p>
              <h2 className="mt-2 text-2xl font-black text-white">Rút Credit → VNĐ</h2>
              <p className="muted mt-2">Member/Seller gửi yêu cầu, Admin sẽ duyệt hoặc từ chối.</p>
            </div>
            <Badge tone="default">1 AC = {AC_TO_VND.toLocaleString('vi-VN')} VNĐ</Badge>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label>
              <span className="label">Credit muốn rút</span>
              <input className="field" type="number" min="1" max={currentUser.wallet.available} value={withdrawForm.amount} onChange={(e) => updateWithdraw('amount', Number(e.target.value))} />
            </label>
            <label>
              <span className="label">Tạm tính VNĐ</span>
              <input className="field" readOnly value={vnd(Number(withdrawForm.amount || 0) * AC_TO_VND)} />
            </label>
            <label>
              <span className="label">Ngân hàng</span>
              <input className="field" value={withdrawForm.bankName} onChange={(e) => updateWithdraw('bankName', e.target.value)} />
            </label>
            <label>
              <span className="label">Số tài khoản</span>
              <input className="field" value={withdrawForm.bankAccount} onChange={(e) => updateWithdraw('bankAccount', e.target.value)} />
            </label>
            <label className="md:col-span-2">
              <span className="label">Tên chủ tài khoản</span>
              <input className="field" value={withdrawForm.accountName} onChange={(e) => updateWithdraw('accountName', e.target.value)} />
            </label>
            <label className="md:col-span-2">
              <span className="label">Ghi chú</span>
              <textarea className="field min-h-24" value={withdrawForm.note} onChange={(e) => updateWithdraw('note', e.target.value)} placeholder="Ví dụ: rút doanh thu seller / rút credit member" />
            </label>
          </div>
          <button className="btn-primary mt-5 w-full" type="submit">Send Withdrawal Request</button>
        </form>
      </section>

      <section className="glass-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Withdrawal Requests</p>
            <h2 className="mt-2 text-2xl font-black text-white">Lịch sử yêu cầu rút</h2>
          </div>
          <Badge>{userWithdrawRequests.length} requests</Badge>
        </div>
        <div className="space-y-3">
          {userWithdrawRequests.length ? userWithdrawRequests.map((request) => (
            <div key={request.id} className="soft-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-white">{money(request.amount)} → {vnd(request.vndAmount)}</p>
                  <p className="mt-1 text-sm text-slate-300">{request.bankName} · {request.bankAccount} · {request.accountName}</p>
                  <p className="mt-1 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}{request.reviewedAt ? ` · Reviewed ${formatDateTime(request.reviewedAt)}` : ''}</p>
                </div>
                <Badge tone={request.status === 'Approved' ? 'Approved' : request.status === 'Rejected' ? 'Rejected' : 'Pending'}>{request.status}</Badge>
              </div>
              {request.reviewNote ? <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-slate-300">Admin note: {request.reviewNote}</p> : null}
            </div>
          )) : <p className="muted">Chưa có yêu cầu rút nào.</p>}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-black text-white">Current Active Bids</h2>
          <div className="mt-5 space-y-3">
            {activeBids.length ? activeBids.map((bid) => (
              <div key={bid.id} className="soft-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <a href={`#/room/${bid.roomId}`} className="font-black text-white hover:text-auction-gold">{bid.roomTitle}</a>
                    <p className="mt-1 text-sm text-slate-400">Bid {money(bid.amount)} · Pending {money(bid.pendingAmount)}</p>
                  </div>
                  <Badge tone={bid.status === 'active' ? 'Live' : bid.status === 'paid' ? 'Paid' : 'Rejected'}>{bid.status}</Badge>
                </div>
              </div>
            )) : <p className="muted">No current active bids.</p>}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-black text-white">Bid Win History</h2>
          <div className="mt-5 space-y-3">
            {(currentUser.winHistory || []).length ? currentUser.winHistory.map((win) => (
              <div key={win.id} className="soft-card p-4">
                <p className="font-black text-white">{win.roomTitle}</p>
                <p className="mt-1 text-sm text-slate-400">Paid {money(win.amount)} · {formatDateTime(win.paidAt)}</p>
              </div>
            )) : <p className="muted">No win history yet.</p>}
          </div>
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-2xl font-black text-white">Transaction History</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr><th className="py-3">Type</th><th>Amount</th><th>Time</th><th>Note</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {(currentUser.transactions || []).map((tx) => (
                <tr key={tx.id} className="text-slate-300">
                  <td className="py-4"><Badge tone={tx.type === 'Penalty' ? 'Rejected' : tx.type === 'Refund' ? 'Approved' : 'default'}>{tx.type}</Badge></td>
                  <td className={tx.amount < 0 ? 'font-black text-rose-200' : 'font-black text-emerald-200'}>{money(tx.amount)}</td>
                  <td>{formatDateTime(tx.time)}</td>
                  <td>{tx.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
