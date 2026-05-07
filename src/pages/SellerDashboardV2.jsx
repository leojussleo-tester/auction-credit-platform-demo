import { useMemo, useState } from 'react'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import { useAuction } from '../context/AuctionContext'
import { formatDateTime, money } from '../utils/policies'
import { readImageFiles } from '../utils/imageFiles'

const SELLER_ROOM_REQUESTS_KEY = 'auction-credit-seller-room-requests-v1'
const MIN_DURATION = 15
const MAX_DURATION = 1440

const blankForm = {
  productName: '',
  description: '',
  condition: '',
  includedItems: '',
  productionInfo: '',
  title: '',
  roomLevel: 'Basic',
  startingPrice: 500,
  minIncrement: 50,
  durationMinutes: 60,
  desiredStartTime: '',
  hasPassword: false,
  roomPassword: '',
}

function loadRequests() {
  try { return JSON.parse(localStorage.getItem(SELLER_ROOM_REQUESTS_KEY) || '[]') } catch { return [] }
}
function saveRequests(value) { localStorage.setItem(SELLER_ROOM_REQUESTS_KEY, JSON.stringify(value)) }
function toLocalInputValue(date = new Date(Date.now() + 15 * 60 * 1000)) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
function clampDuration(value) {
  return Math.max(MIN_DURATION, Math.min(MAX_DURATION, Number(value || 60)))
}

export default function SellerDashboardV2() {
  const { currentUser, state } = useAuction()
  const [requests, setRequests] = useState(loadRequests)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...blankForm, desiredStartTime: toLocalInputValue() })
  const [images, setImages] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const ownRequests = useMemo(() => requests.filter((item) => item.sellerId === currentUser.id), [requests, currentUser.id])
  const sellerRooms = state.rooms.filter((room) => room.sellerId === currentUser.id)

  function update(field, value) { setForm((prev) => ({ ...prev, [field]: value })) }
  async function onImagesChange(files) {
    const loaded = await readImageFiles(files)
    setImages(loaded.slice(0, 5))
    setError('')
  }
  function resetForm() {
    setForm({ ...blankForm, desiredStartTime: toLocalInputValue() })
    setImages([])
    setError('')
  }
  function submitRequest(event) {
    event.preventDefault()
    if (!currentUser.sellerEnabled) return setError('Tài khoản seller chưa được Admin cấp quyền.')
    if (images.length < 3 || images.length > 5) return setError('Bắt buộc upload từ 3 đến 5 ảnh chụp sản phẩm.')
    if (form.hasPassword && !form.roomPassword.trim()) return setError('Vui lòng nhập mật khẩu phòng hoặc chọn Không mật khẩu.')
    const durationMinutes = clampDuration(form.durationMinutes)
    const request = {
      id: `seller-room-${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      sellerEmail: currentUser.email,
      status: 'Pending Admin Review',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewNote: '',
      ...form,
      title: form.title.trim() || form.productName.trim(),
      productName: form.productName.trim(),
      durationMinutes,
      images,
      primaryImage: images[0]?.dataUrl,
      hasPassword: Boolean(form.hasPassword),
      roomPassword: form.hasPassword ? form.roomPassword.trim() : '',
    }
    const next = [request, ...requests]
    setRequests(next)
    saveRequests(next)
    setMessage('Đã gửi yêu cầu tạo phòng cho Admin. Admin sẽ xem ảnh sản phẩm và duyệt/từ chối.')
    setModalOpen(false)
    resetForm()
  }

  return <div className="space-y-6">
    {modalOpen ? <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-3 backdrop-blur-md"><div className="glass-card max-h-[88vh] w-full max-w-4xl overflow-y-auto p-5 md:p-7"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Seller Room Request</p><h2 className="mt-2 text-3xl font-black text-white">Tạo phòng đấu giá</h2><p className="muted mt-2">Gửi yêu cầu tạo phòng kèm thông tin sản phẩm. Admin sẽ duyệt hoặc từ chối.</p></div><button className="btn-secondary" onClick={() => setModalOpen(false)}>Đóng</button></div>{error ? <div className="mt-4 rounded-2xl border border-rose-400/50 bg-rose-500/15 p-3 text-sm font-bold text-rose-100">{error}</div> : null}<form onSubmit={submitRequest} className="mt-5 grid gap-5 lg:grid-cols-2"><div className="space-y-4"><p className="label text-auction-gold">Thông tin sản phẩm</p><label><span className="label">Tên sản phẩm</span><input className="field" required value={form.productName} onChange={(e) => update('productName', e.target.value)} /></label><label><span className="label">Mô tả sản phẩm</span><textarea className="field min-h-24" required value={form.description} onChange={(e) => update('description', e.target.value)} /></label><label><span className="label">Thông tin sản xuất</span><input className="field" value={form.productionInfo} onChange={(e) => update('productionInfo', e.target.value)} placeholder="Brand / year / series..." /></label><label><span className="label">Tình trạng sản phẩm</span><input className="field" required value={form.condition} onChange={(e) => update('condition', e.target.value)} /></label><label><span className="label">Sản phẩm kèm theo</span><input className="field" value={form.includedItems} onChange={(e) => update('includedItems', e.target.value)} /></label><label><span className="label">Ảnh sản phẩm bắt buộc, 3 - 5 ảnh</span><input className={`field ${error.includes('3 đến 5') ? '!border-rose-400 !bg-rose-500/10' : ''}`} type="file" accept="image/*" multiple onChange={(e) => onImagesChange(e.target.files)} /></label><div className="grid grid-cols-3 gap-2">{images.map((image) => <img key={image.name} src={image.dataUrl} alt={image.name} className="h-24 rounded-2xl object-cover" />)}</div></div><div className="space-y-4"><p className="label text-auction-gold">Tạo phòng</p><label><span className="label">Tên phòng</span><input className="field" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Để trống sẽ dùng tên sản phẩm" /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Room Level</span><select className="field" value={form.roomLevel} onChange={(e) => update('roomLevel', e.target.value)}><option>Basic</option><option>Pro</option><option>VIP</option></select></label><label><span className="label">Thời lượng, phút</span><input className="field" type="number" min={MIN_DURATION} max={MAX_DURATION} value={form.durationMinutes} onChange={(e) => update('durationMinutes', clampDuration(e.target.value))} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Giá khởi điểm</span><input className="field" type="number" min="1" value={form.startingPrice} onChange={(e) => update('startingPrice', e.target.value)} /></label><label><span className="label">Bước giá tối thiểu</span><input className="field" type="number" min="1" value={form.minIncrement} onChange={(e) => update('minIncrement', e.target.value)} /></label></div><label><span className="label">Ngày giờ dự kiến mở</span><input className="field" type="datetime-local" value={form.desiredStartTime} onChange={(e) => update('desiredStartTime', e.target.value)} /></label><div className="rounded-3xl border border-white/10 bg-black/25 p-4"><span className="label">Mật khẩu phòng</span><div className="grid gap-3 sm:grid-cols-2"><label className="soft-card flex items-center gap-3 p-4"><input type="radio" checked={!form.hasPassword} onChange={() => setForm({ ...form, hasPassword: false, roomPassword: '' })} /><span className="font-black text-white">Không mật khẩu</span></label><label className="soft-card flex items-center gap-3 p-4"><input type="radio" checked={form.hasPassword} onChange={() => setForm({ ...form, hasPassword: true })} /><span className="font-black text-white">Có mật khẩu</span></label></div>{form.hasPassword ? <label className="mt-3 block"><span className="label">Tạo mật khẩu</span><input className="field" value={form.roomPassword} onChange={(e) => update('roomPassword', e.target.value)} /></label> : null}</div><button className="btn-primary w-full" type="submit">Gửi yêu cầu</button></div></form></div></div> : null}

    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Seller Dashboard</p><h1 className="page-title mt-2">Seller listing flow</h1><p className="muted mt-3 max-w-3xl">Seller bấm tạo room đấu giá để gửi yêu cầu kèm 3-5 ảnh sản phẩm. Admin sẽ xem ảnh và duyệt.</p></div><button className="btn-primary" disabled={!currentUser.sellerEnabled} onClick={() => setModalOpen(true)}>Tạo room đấu giá</button></div>
    {message ? <div className="rounded-2xl border border-auction-neon/30 bg-auction-neon/10 p-4 text-sm text-emerald-100">{message}</div> : null}
    {!currentUser.sellerEnabled ? <div className="rounded-2xl border border-rose-400/40 bg-rose-500/15 p-4 text-sm text-rose-100">Tài khoản hiện tại chưa được cấp quyền seller.</div> : null}

    <section className="grid gap-4 md:grid-cols-3"><StatCard label="Room Requests" value={ownRequests.length} /><StatCard label="Seller Rooms" value={sellerRooms.length} /><StatCard label="Seller Wallet" value={money(currentUser.wallet.available)} /></section>

    <section className="glass-card p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Seller Requests</p><h2 className="mt-2 text-2xl font-black text-white">Yêu cầu tạo phòng đã gửi</h2></div><Badge>{ownRequests.length} requests</Badge></div><div className="space-y-3">{ownRequests.length ? ownRequests.map((request) => <div key={request.id} className="soft-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-white">{request.title}</p><p className="mt-1 text-sm text-slate-300">{money(request.startingPrice)} · +{money(request.minIncrement)} · {request.durationMinutes} phút</p><p className="mt-1 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}</p></div><Badge tone={request.status === 'Approved' ? 'Approved' : request.status === 'Rejected' ? 'Rejected' : 'Pending'}>{request.status}</Badge></div><div className="mt-3 flex gap-2 overflow-x-auto">{request.images?.map((image) => <img key={image.name} src={image.dataUrl} alt={image.name} className="h-20 w-20 rounded-2xl object-cover" />)}</div>{request.reviewNote ? <p className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-slate-300">Admin note: {request.reviewNote}</p> : null}</div>) : <p className="muted">Chưa có yêu cầu tạo phòng.</p>}</div></section>
  </div>
}
