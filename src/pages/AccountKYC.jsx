import { useState } from 'react'
import Badge from '../components/Badge'
import PolicyBox from '../components/PolicyBox'
import { useAuction } from '../context/AuctionContext'

export default function AccountKYC() {
  const { currentUser, updateCurrentUser, submitKyc } = useAuction()
  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
  })
  const [fileName, setFileName] = useState(currentUser.kycFileName || '')
  const [message, setMessage] = useState('')

  function onSave(event) {
    event.preventDefault()
    updateCurrentUser(form)
    setMessage('Account profile saved to localStorage.')
  }

  function onSubmitKyc() {
    submitKyc(fileName || 'demo-id-card.png')
    setMessage('KYC submitted. Go to Admin Dashboard to approve / reject.')
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Account + KYC</p>
        <h1 className="page-title mt-2">Demo account verification</h1>
        <p className="muted mt-3 max-w-3xl">User chỉ được tham gia bid khi KYC Approved. Upload CCCD/ID card ở đây chỉ là UI giả lập, không upload file thật.</p>
      </div>

      {message ? <div className="rounded-2xl border border-auction-neon/30 bg-auction-neon/10 p-4 text-sm text-emerald-100">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <form onSubmit={onSave} className="glass-card p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">Create / Edit Demo Account</h2>
              <p className="muted mt-2">Thông tin này lưu localStorage và dùng cho bid history.</p>
            </div>
            <Badge>{currentUser.kycStatus}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="label">Full Name</span>
              <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              <span className="label">Email</span>
              <input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="md:col-span-2">
              <span className="label">Phone Number</span>
              <input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
          </div>

          <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-black/25 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-black text-white">Fake CCCD / ID Card Upload</p>
                <p className="muted mt-1">Chọn file chỉ để lấy tên file demo, không gửi lên server.</p>
              </div>
              <Badge tone="default">UI only</Badge>
            </div>
            <input
              className="field mt-5"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
            />
            <p className="mt-3 text-sm text-slate-400">Selected: <span className="font-bold text-white">{fileName || 'No file selected'}</span></p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" type="submit">Save Account</button>
            <button className="btn-secondary" type="button" onClick={onSubmitKyc}>Submit KYC Demo</button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="glass-card p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">KYC Status</p>
            <div className="mt-4 flex items-center gap-3">
              <Badge>{currentUser.kycStatus}</Badge>
              <span className="text-sm text-slate-400">Current verification</span>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between gap-3"><span>Name</span><strong className="text-white">{currentUser.name}</strong></div>
              <div className="flex justify-between gap-3"><span>Email</span><strong className="text-white">{currentUser.email}</strong></div>
              <div className="flex justify-between gap-3"><span>Phone</span><strong className="text-white">{currentUser.phone}</strong></div>
              <div className="flex justify-between gap-3"><span>ID File</span><strong className="text-white">{currentUser.kycFileName || 'N/A'}</strong></div>
            </div>
          </div>

          <PolicyBox title="KYC Gate">
            Not Submitted / Pending / Rejected không được Join Room. Admin Dashboard có thể Approve KYC để mở quyền bid.
          </PolicyBox>
        </aside>
      </div>
    </div>
  )
}
