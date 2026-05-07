import { useState } from 'react'
import Badge from '../components/Badge'
import AdminDashboard from './AdminDashboard'
import { useAuction } from '../context/AuctionContext'
import { formatDateTime, money } from '../utils/policies'

const SELLER_ROOM_REQUESTS_KEY = 'auction-credit-seller-room-requests-v1'
const ROOM_GALLERIES_KEY = 'auction-credit-room-galleries-v1'

function loadRequests() {
  try { return JSON.parse(localStorage.getItem(SELLER_ROOM_REQUESTS_KEY) || '[]') } catch { return [] }
}
function saveRequests(value) { localStorage.setItem(SELLER_ROOM_REQUESTS_KEY, JSON.stringify(value)) }
function loadGalleries() {
  try { return JSON.parse(localStorage.getItem(ROOM_GALLERIES_KEY) || '{}') } catch { return {} }
}
function saveGallery(title, productName, images = []) {
  const galleries = loadGalleries()
  const safe = images.slice(0, 5)
  if (title) galleries[title] = safe
  if (productName) galleries[productName] = safe
  localStorage.setItem(ROOM_GALLERIES_KEY, JSON.stringify(galleries))
}
function localToIso(value) {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export default function AdminDashboardV2() {
  const { adminCreateRoom } = useAuction()
  const [requests, setRequests] = useState(loadRequests)
  const [message, setMessage] = useState('')
  const pendingRequests = requests.filter((item) => item.status === 'Pending Admin Review')

  function updateRequest(id, patch) {
    const next = requests.map((item) => item.id === id ? { ...item, ...patch } : item)
    setRequests(next)
    saveRequests(next)
  }

  function approveRequest(request) {
    const roomTitle = request.title || request.productName
    const startTime = localToIso(request.desiredStartTime)
    const endTime = new Date(new Date(startTime).getTime() + Number(request.durationMinutes || 60) * 60 * 1000).toISOString()
    saveGallery(roomTitle, request.productName, request.images || [])
    adminCreateRoom({
      sellerId: request.sellerId,
      productId: '',
      title: roomTitle,
      productName: request.productName,
      image: request.primaryImage,
      description: `${request.description || ''}\n\nThông tin sản xuất: ${request.productionInfo || 'N/A'}\nSản phẩm kèm theo: ${request.includedItems || 'N/A'}`,
      condition: request.condition,
      roomLevel: request.roomLevel,
      status: new Date(startTime).getTime() <= Date.now() ? 'Live' : 'Upcoming',
      startingPrice: request.startingPrice,
      minIncrement: request.minIncrement,
      startTime,
      endTime,
      hasPassword: request.hasPassword,
      roomPassword: request.roomPassword,
    })
    updateRequest(request.id, { status: 'Approved', reviewedAt: new Date().toISOString(), reviewNote: 'Admin approved and created auction room.' })
    setMessage(`Đã duyệt yêu cầu và tạo room: ${roomTitle}`)
  }

  function rejectRequest(request) {
    updateRequest(request.id, { status: 'Rejected', reviewedAt: new Date().toISOString(), reviewNote: 'Admin rejected seller room request.' })
    setMessage(`Đã từ chối yêu cầu: ${request.title || request.productName}`)
  }

  return <div className="space-y-6">
    <section className="glass-card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Seller Room Requests</p>
          <h2 className="mt-2 text-2xl font-black text-white">Duyệt yêu cầu tạo phòng từ Seller</h2>
          <p className="muted mt-2">Admin bắt buộc xem được ảnh sản phẩm seller gửi trước khi duyệt hoặc từ chối.</p>
        </div>
        <Badge>{pendingRequests.length} pending</Badge>
      </div>
      {message ? <div className="mb-4 rounded-2xl border border-auction-neon/30 bg-auction-neon/10 p-4 text-sm text-emerald-100">{message}</div> : null}
      <div className="space-y-4">
        {pendingRequests.length ? pendingRequests.map((request) => <div key={request.id} className="soft-card p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div>
              <div className="flex flex-wrap items-center gap-2"><Badge tone="Pending">Pending Admin Review</Badge><Badge>{request.roomLevel}</Badge>{request.hasPassword ? <Badge>PASS</Badge> : <Badge>NO PASS</Badge>}</div>
              <h3 className="mt-3 text-xl font-black text-white">{request.title || request.productName}</h3>
              <p className="mt-1 text-sm text-slate-300">Seller: <strong className="text-white">{request.sellerName}</strong> · {request.sellerEmail}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{request.description}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                <p>Giá khởi điểm: <strong className="text-auction-gold">{money(request.startingPrice)}</strong></p>
                <p>Bước giá: <strong className="text-white">{money(request.minIncrement)}</strong></p>
                <p>Thời lượng: <strong className="text-white">{request.durationMinutes} phút</strong></p>
                <p>Mở dự kiến: <strong className="text-white">{request.desiredStartTime || 'N/A'}</strong></p>
                <p className="sm:col-span-2">Thông tin sản xuất: <strong className="text-white">{request.productionInfo || 'N/A'}</strong></p>
                <p className="sm:col-span-2">Tình trạng: <strong className="text-white">{request.condition}</strong></p>
                <p className="sm:col-span-2">Kèm theo: <strong className="text-white">{request.includedItems || 'Không có'}</strong></p>
              </div>
              <p className="mt-2 text-xs text-slate-400">Created {formatDateTime(request.createdAt)}</p>
              <div className="mt-4 flex flex-wrap gap-2"><button className="btn-secondary !px-3 !py-2" onClick={() => approveRequest(request)}>Approve & Create Room</button><button className="btn-danger !px-3 !py-2" onClick={() => rejectRequest(request)}>Reject</button></div>
            </div>
            <div>
              <p className="label">Ảnh sản phẩm seller gửi</p>
              <div className="grid grid-cols-2 gap-2">
                {request.images?.map((image) => <a key={image.name} href={image.dataUrl} target="_blank" rel="noreferrer"><img src={image.dataUrl} alt={image.name} className="h-32 w-full rounded-2xl object-cover" /></a>)}
              </div>
              <p className="mt-2 text-xs text-slate-400">Bấm ảnh để xem lớn.</p>
            </div>
          </div>
        </div>) : <p className="muted">Không có yêu cầu tạo phòng từ seller đang chờ.</p>}
      </div>
    </section>
    <section className="glass-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Platform Exclusive</p><h2 className="mt-2 text-2xl font-black text-white">Tạo room độc quyền của sàn</h2></div>
        <Badge tone="default">Admin-only</Badge>
      </div>
      <p className="muted">Form tạo room bên dưới dùng cho sản phẩm độc quyền của sàn. Seller không dùng form này nữa.</p>
    </section>
    <AdminDashboard />
  </div>
}
