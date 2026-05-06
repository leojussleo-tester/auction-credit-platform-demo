import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import PolicyBox from '../components/PolicyBox'
import { useAuction } from '../context/AuctionContext'
import { formatDateTime, money } from '../utils/policies'

const WITHDRAW_KEY = 'auction-credit-withdraw-requests-v1'
const DEPOSIT_KEY = 'auction-credit-deposit-requests-v1'
const AC_TO_VND = 1000
const BANK_INFO = {
  bank: 'ACB - Auction Credit Demo',
  account: '6868686868',
  holder: 'AUCTION CREDIT PLATFORM',
}

function loadStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function vnd(value) { return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ` }
function txCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const a = letters[Math.floor(Math.random() * letters.length)]
  const b = letters[Math.floor(Math.random() * letters.length)]
  const nums = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
  return `${a}${b}${nums}`
}
function qrUrl(request) {
  const text = `BANK:${BANK_INFO.bank}\nSTK:${BANK_INFO.account}\nNAME:${BANK_INFO.holder}\nAMOUNT:${request.vndAmount}\nCONTENT:${request.transactionCode}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}`
}

export default function Wallet() {
  const { state, currentUser, currentMemberLevel, updateCurrentUser } = useAuction()
  const [amount, setAmount] = useState(2000)
  const [depositRequests, setDepositRequests] = useState(() => loadStore(DEPOSIT_KEY))
  const [withdrawForm, setWithdrawForm] = useState({ amount: 1000, bankName: 'Demo Bank', bankAccount: currentUser.phone || '', accountName: currentUser.name, note: '' })
  const [withdrawRequests, setWithdrawRequests] = useState(() => loadStore(WITHDRAW_KEY))
  const [message, setMessage] = useState('')

  const userDepositRequests = depositRequests.filter((request) => request.userId === currentUser.id)
  const userWithdrawRequests = withdrawRequests.filter((request) => request.userId === currentUser.id)

  const activeBids = useMemo(() => {
    return state.rooms
      .flatMap((room) => room.bids.map((bid) => ({ ...bid, roomTitle: room.title, roomId: room.id, roomStatus: room.status })))
      .filter((bid) => bid.userId === currentUser.id && ['active', 'paid', 'failed'].includes(bid.status))
  }, [state.rooms, currentUser.id])

  function createDepositRequest() {
    const creditAmount = Number(amount)
    if (!creditAmount || creditAmount <= 0) {
      setMessage('Số credit cần nạp phải lớn hơn 0.')
      return
    }
    const request = {
      id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      creditAmount,
      vndAmount: creditAmount * AC_TO_VND,
      bank: BANK_INFO.bank,
      bankAccount: BANK_INFO.account,
      accountHolder: BANK_INFO.holder,
      transactionCode: txCode(),
      status: 'Waiting Bill',
      billName: '',
      billNote: '',
      createdAt: new Date().toISOString(),
      submittedAt: null,
      reviewedAt: null,
      reviewNote: '',
    }
    const next = [request, ...depositRequests]
    setDepositRequests(next)
    saveStore(DEPOSIT_KEY, next)
    setMessage('Đã tạo thông tin chuyển khoản. Vui lòng chuyển khoản đúng mã GD và upload bill.')
  }

  function submitDepositBill(requestId, file) {
    const next = depositRequests.map((request) => request.id === requestId ? {
      ...request,
      status: 'Pending Admin Review',
      billName: file?.name || `bill-${request.transactionCode}.png`,
      submittedAt: new Date().toISOString(),
    } : request)
    setDepositRequests(next)
    saveStore(DEPOSIT_KEY, next)
    setMessage('Đã gửi bill lên hệ thống. Admin sẽ kiểm tra giao dịch và mã GD.')
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
    saveStore(WITHDRAW_KEY, nextRequests)

    updateCurrentUser({
      wallet: { available: currentUser.wallet.available - withdrawAmount, pending: currentUser.wallet.pending + withdrawAmount },
      transactions: [{ id: `tx-wd-${Date.now()}`, type: 'Withdrawal Pending', amount: -withdrawAmount, time: new Date().toISOString(), note: `Request withdraw ${money(withdrawAmount)} → ${vnd(withdrawAmount * AC_TO_VND)}` }, ...(currentUser.transactions || [])],
    })

    setMessage('Đã gửi yêu cầu rút Credit → VNĐ. Admin sẽ duyệt hoặc từ chối.')
    setWithdrawForm((prev) => ({ ...prev, amount: 1000, note: '' }))
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">My Wallet / Ví của tôi</p>
        <h1 className="page-title mt-2">Auction Credit wallet</h1>
        <p className="muted mt-3 max-w-3xl">Nạp Credit bằng chuyển khoản mock, upload bill để Admin kiểm tra mã GD, duyệt thì Credit mới chảy vào tài khoản.</p>
      </div>

      {message ? <div className="rounded-2xl border border-auction-neon/30 bg-auction-neon/10 p-4 text-sm text-emerald-100">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available Credit" value={money(currentUser.wallet.available)} hint="Credit có thể dùng để pending, bid hoặc yêu cầu rút" />
        <StatCard label="Pending Credit" value={money(currentUser.wallet.pending)} hint="Credit đang bị giữ do bid hoặc withdrawal review" accent />
        <StatCard label="Total Credit" value={money(currentUser.wallet.available + currentUser.wallet.pending)} hint="Available + Pending" />
        <StatCard label="Current Member" value={currentMemberLevel} hint={`${currentUser.score} score points`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Top Up / Nạp Credit</p>
              <h2 className="mt-2 text-2xl font-black text-white">Tạo yêu cầu nạp Credit</h2>
            </div>
            <Badge tone="default">Bank Transfer</Badge>
          </div>
          <label className="mt-6 block">
            <span className="label">Số Credit cần nạp</span>
            <input className="field" type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </label>
          <div className="mt-4 rounded-2xl border border-auction-gold/20 bg-auction-gold/10 p-4 text-sm text-slate-200">
            <p>Quy đổi: <strong className="text-white">{money(amount)}</strong> = <strong className="text-auction-gold">{vnd(Number(amount || 0) * AC_TO_VND)}</strong></p>
            <p className="mt-1 text-xs text-slate-400">Credit chỉ cộng vào ví sau khi Admin duyệt bill.</p>
          </div>
          <button onClick={createDepositRequest} className="btn-primary mt-4 w-full">Tạo thông tin chuyển khoản</button>
          <PolicyBox title="Top Up Approval Policy" type="gold">Mem/Seller chuyển khoản đúng Bank, STK và Mã GD. Sau đó upload bill. Admin check giao dịch + mã GD rồi duyệt hoặc từ chối.</PolicyBox>
        </div>

        <div className="glass-card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Deposit Requests</p>
              <h2 className="mt-2 text-2xl font-black text-white">Thông tin chuyển khoản & upload bill</h2>
            </div>
            <Badge>{userDepositRequests.length} requests</Badge>
          </div>
          <div className="space-y-4">
            {userDepositRequests.length ? userDepositRequests.map((request) => (
              <div key={request.id} className="soft-card p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2"><Badge tone={request.status === 'Approved' ? 'Approved' : request.status === 'Rejected' ? 'Rejected' : 'Pending'}>{request.status}</Badge><Badge>{request.transactionCode}</Badge></div>
                    <p className="font-black text-white">Nạp {money(request.creditAmount)} · {vnd(request.vndAmount)}</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                      <p>Bank: <strong className="text-white">{request.bank}</strong></p>
                      <p>STK: <strong className="text-white">{request.bankAccount}</strong></p>
                      <p>Chủ TK: <strong className="text-white">{request.accountHolder}</strong></p>
                      <p>Mã GD: <strong className="text-auction-gold">{request.transactionCode}</strong></p>
                    </div>
                    <label className="mt-4 block">
                      <span className="label">Upload bill chuyển khoản</span>
                      <input className="field" type="file" accept="image/*" disabled={request.status === 'Approved' || request.status === 'Rejected'} onChange={(e) => submitDepositBill(request.id, e.target.files?.[0])} />
                    </label>
                    {request.billName ? <p className="mt-2 text-sm text-slate-300">Bill: <strong className="text-white">{request.billName}</strong></p> : null}
                    <p className="mt-2 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}{request.submittedAt ? ` · Bill sent ${formatDateTime(request.submittedAt)}` : ''}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-center">
                    <img src={qrUrl(request)} alt={`QR ${request.transactionCode}`} className="mx-auto rounded-2xl bg-white p-2" />
                    <p className="mt-3 text-xs leading-5 text-slate-300">QR chứa Bank, STK, số tiền và mã GD.</p>
                  </div>
                </div>
              </div>
            )) : <p className="muted">Chưa có yêu cầu nạp nào. Nhập số Credit và bấm tạo thông tin chuyển khoản.</p>}
          </div>
        </div>
      </section>

      <section className="glass-card p-6">
        <form onSubmit={submitWithdraw}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Withdraw</p><h2 className="mt-2 text-2xl font-black text-white">Rút Credit → VNĐ</h2><p className="muted mt-2">Member/Seller gửi yêu cầu, Admin sẽ duyệt hoặc từ chối.</p></div>
            <Badge tone="default">1 AC = {AC_TO_VND.toLocaleString('vi-VN')} VNĐ</Badge>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label><span className="label">Credit muốn rút</span><input className="field" type="number" min="1" max={currentUser.wallet.available} value={withdrawForm.amount} onChange={(e) => updateWithdraw('amount', Number(e.target.value))} /></label>
            <label><span className="label">Tạm tính VNĐ</span><input className="field" readOnly value={vnd(Number(withdrawForm.amount || 0) * AC_TO_VND)} /></label>
            <label><span className="label">Ngân hàng</span><input className="field" value={withdrawForm.bankName} onChange={(e) => updateWithdraw('bankName', e.target.value)} /></label>
            <label><span className="label">Số tài khoản</span><input className="field" value={withdrawForm.bankAccount} onChange={(e) => updateWithdraw('bankAccount', e.target.value)} /></label>
            <label className="md:col-span-2"><span className="label">Tên chủ tài khoản</span><input className="field" value={withdrawForm.accountName} onChange={(e) => updateWithdraw('accountName', e.target.value)} /></label>
            <label className="md:col-span-2"><span className="label">Ghi chú</span><textarea className="field min-h-24" value={withdrawForm.note} onChange={(e) => updateWithdraw('note', e.target.value)} /></label>
          </div>
          <button className="btn-primary mt-5 w-full" type="submit">Send Withdrawal Request</button>
        </form>
      </section>

      <section className="glass-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Withdrawal Requests</p><h2 className="mt-2 text-2xl font-black text-white">Lịch sử yêu cầu rút</h2></div><Badge>{userWithdrawRequests.length} requests</Badge></div>
        <div className="space-y-3">
          {userWithdrawRequests.length ? userWithdrawRequests.map((request) => <div key={request.id} className="soft-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-white">{money(request.amount)} → {vnd(request.vndAmount)}</p><p className="mt-1 text-sm text-slate-300">{request.bankName} · {request.bankAccount} · {request.accountName}</p><p className="mt-1 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}{request.reviewedAt ? ` · Reviewed ${formatDateTime(request.reviewedAt)}` : ''}</p></div><Badge tone={request.status === 'Approved' ? 'Approved' : request.status === 'Rejected' ? 'Rejected' : 'Pending'}>{request.status}</Badge></div>{request.reviewNote ? <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-slate-300">Admin note: {request.reviewNote}</p> : null}</div>) : <p className="muted">Chưa có yêu cầu rút nào.</p>}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-6"><h2 className="text-2xl font-black text-white">Current Active Bids</h2><div className="mt-5 space-y-3">{activeBids.length ? activeBids.map((bid) => <div key={bid.id} className="soft-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><a href={`#/room/${bid.roomId}`} className="font-black text-white hover:text-auction-gold">{bid.roomTitle}</a><p className="mt-1 text-sm text-slate-400">Bid {money(bid.amount)} · Pending {money(bid.pendingAmount)}</p></div><Badge tone={bid.status === 'active' ? 'Live' : bid.status === 'paid' ? 'Paid' : 'Rejected'}>{bid.status}</Badge></div></div>) : <p className="muted">No current active bids.</p>}</div></div>
        <div className="glass-card p-6"><h2 className="text-2xl font-black text-white">Bid Win History</h2><div className="mt-5 space-y-3">{(currentUser.winHistory || []).length ? currentUser.winHistory.map((win) => <div key={win.id} className="soft-card p-4"><p className="font-black text-white">{win.roomTitle}</p><p className="mt-1 text-sm text-slate-400">Paid {money(win.amount)} · {formatDateTime(win.paidAt)}</p></div>) : <p className="muted">No win history yet.</p>}</div></div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-2xl font-black text-white">Transaction History</h2>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="py-3">Type</th><th>Amount</th><th>Time</th><th>Note</th></tr></thead><tbody className="divide-y divide-white/10">{(currentUser.transactions || []).map((tx) => <tr key={tx.id} className="text-slate-300"><td className="py-4"><Badge tone={tx.type === 'Penalty' ? 'Rejected' : tx.type === 'Refund' ? 'Approved' : 'default'}>{tx.type}</Badge></td><td className={tx.amount < 0 ? 'font-black text-rose-200' : 'font-black text-emerald-200'}>{money(tx.amount)}</td><td>{formatDateTime(tx.time)}</td><td>{tx.note}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  )
}
