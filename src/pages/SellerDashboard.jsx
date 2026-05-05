import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import PolicyBox from '../components/PolicyBox'
import StatCard from '../components/StatCard'
import { useAuction } from '../context/AuctionContext'
import { formatDateTime, money } from '../utils/policies'

const emptyForm = {
  name: '',
  description: '',
  image: '',
  startingPrice: 500,
  minIncrement: 50,
  desiredRoomLevel: 'Basic',
  condition: '',
  verificationNote: '',
}

export default function SellerDashboard() {
  const { state, currentUser, submitSellerProduct } = useAuction()
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')

  const sellerProducts = useMemo(
    () => state.sellerProducts.filter((product) => product.sellerId === currentUser.id),
    [state.sellerProducts, currentUser.id]
  )

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function onSubmit(event) {
    event.preventDefault()
    const result = submitSellerProduct(form)
    setMessage(result.message)
    if (result.ok) setForm(emptyForm)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Seller Dashboard</p>
          <h1 className="page-title mt-2">Seller listing flow</h1>
          <p className="muted mt-3 max-w-3xl">Seller không tự tạo account. Admin phải cấp quyền seller trước, sau đó seller mới gửi sản phẩm để admin xác minh và tạo room.</p>
        </div>
        <Badge tone={currentUser.sellerEnabled ? 'Approved' : 'Pending'}>{currentUser.sellerEnabled ? 'Seller Enabled' : 'Seller Locked'}</Badge>
      </div>

      {message ? <div className={`rounded-2xl border p-4 text-sm ${message.includes('must') ? 'border-rose-300/30 bg-rose-500/10 text-rose-100' : 'border-auction-neon/30 bg-auction-neon/10 text-emerald-100'}`}>{message}</div> : null}

      {!currentUser.sellerEnabled ? (
        <PolicyBox title="Seller Permission Required" type="danger">
          Tài khoản hiện tại chưa được cấp quyền seller. Vào Admin Dashboard → User Management → Grant Seller để test flow seller đúng policy.
        </PolicyBox>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Submitted Products" value={sellerProducts.length} />
        <StatCard label="Platform Fee" value="10%" hint="Khấu trừ trước khi release settlement" />
        <StatCard label="Seller Wallet" value={money(currentUser.wallet.available)} hint="Settlement demo cộng vào wallet seller" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <form onSubmit={onSubmit} className="glass-card p-6">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Submit Product</p>
            <h2 className="mt-2 text-2xl font-black text-white">Gửi sản phẩm đấu giá</h2>
          </div>

          <fieldset disabled={!currentUser.sellerEnabled} className="space-y-4">
            <label>
              <span className="label">Tên sản phẩm</span>
              <input className="field" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </label>
            <label>
              <span className="label">Mô tả</span>
              <textarea className="field min-h-28" value={form.description} onChange={(e) => update('description', e.target.value)} required />
            </label>
            <label>
              <span className="label">Ảnh demo URL</span>
              <input className="field" value={form.image} onChange={(e) => update('image', e.target.value)} placeholder="Optional image URL" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="label">Giá khởi điểm</span>
                <input className="field" type="number" min="1" value={form.startingPrice} onChange={(e) => update('startingPrice', e.target.value)} required />
              </label>
              <label>
                <span className="label">Bước giá tối thiểu</span>
                <input className="field" type="number" min="1" value={form.minIncrement} onChange={(e) => update('minIncrement', e.target.value)} required />
              </label>
            </div>
            <label>
              <span className="label">Room muốn tham gia</span>
              <select className="field" value={form.desiredRoomLevel} onChange={(e) => update('desiredRoomLevel', e.target.value)}>
                <option>Basic</option><option>Pro</option><option>VIP</option>
              </select>
            </label>
            <label>
              <span className="label">Tình trạng sản phẩm</span>
              <input className="field" value={form.condition} onChange={(e) => update('condition', e.target.value)} required />
            </label>
            <label>
              <span className="label">Ghi chú xác minh</span>
              <textarea className="field min-h-24" value={form.verificationNote} onChange={(e) => update('verificationNote', e.target.value)} />
            </label>
            <button className="btn-primary w-full py-3.5 text-base" type="submit">Submit Product for Verification</button>
          </fieldset>
        </form>

        <div className="glass-card p-6">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Policy</p>
            <h2 className="mt-2 text-2xl font-black text-white">Seller Rules</h2>
          </div>
          <div className="grid gap-3">
            {[
              ['Access Control', 'Admin cấp quyền seller: Seller không tự mở dashboard bán hàng.'],
              ['Product Verification', 'Sản phẩm phải Pending → Verified trước khi tạo room và mở bán.'],
              ['Platform Fee', 'Platform khấu trừ 10% trước khi release settlement về ví seller.'],
              ['Settlement Rule', 'Chỉ khi winner paid + admin xác nhận hoàn tất thì settlement mới được release.'],
            ].map(([title, content]) => (
              <div key={title} className="rounded-2xl border border-white/15 bg-slate-900/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">◆ {title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-2xl font-black text-white">Danh sách sản phẩm đã gửi</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr><th className="py-3">Product</th><th>Verification</th><th>Room</th><th>Fee</th><th>Commission</th><th>Settlement</th><th>Created</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sellerProducts.map((product) => (
                <tr key={product.id} className="text-slate-300">
                  <td className="py-4"><strong className="text-white">{product.name}</strong><p className="text-xs text-slate-500">{money(product.startingPrice)} · +{money(product.minIncrement)}</p></td>
                  <td><Badge>{product.verificationStatus}</Badge></td>
                  <td>{product.roomId ? <a className="text-auction-gold hover:underline" href={`#/room/${product.roomId}`}>{product.roomId}</a> : product.desiredRoomLevel}</td>
                  <td>{money(product.registrationFee)}</td>
                  <td>{(product.commissionRate * 100).toFixed(0)}%</td>
                  <td><Badge tone="default">{product.settlementStatus}</Badge></td>
                  <td>{formatDateTime(product.createdAt)}</td>
                </tr>
              ))}
              {!sellerProducts.length ? <tr><td className="py-5 text-slate-400" colSpan="7">No seller products for current user.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
