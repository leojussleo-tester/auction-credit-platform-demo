import { useEffect, useMemo, useState } from 'react'
import BidRoom from './BidRoom'
import { useAuction } from '../context/AuctionContext'

const ROOM_GALLERIES_KEY = 'auction-credit-room-galleries-v1'

function loadGalleries() {
  try { return JSON.parse(localStorage.getItem(ROOM_GALLERIES_KEY) || '{}') } catch { return {} }
}

export default function BidRoomGallery({ roomId }) {
  const { state } = useAuction()
  const room = state.rooms.find((item) => item.id === roomId)
  const [index, setIndex] = useState(0)
  const [zoomImage, setZoomImage] = useState(null)

  const images = useMemo(() => {
    if (!room) return []
    const galleries = loadGalleries()
    const stored = galleries[room.title] || galleries[room.productName] || []
    const fromStorage = stored.map((item) => ({ src: item.dataUrl || item.src, name: item.name || room.productName })).filter((item) => item.src)
    if (fromStorage.length) return fromStorage
    return [{ src: room.image, name: room.productName || room.title }]
  }, [room])

  useEffect(() => {
    if (images.length <= 1) return undefined
    const timer = window.setInterval(() => setIndex((prev) => (prev + 1) % images.length), 2500)
    return () => window.clearInterval(timer)
  }, [images.length])

  if (!room) return <BidRoom roomId={roomId} />
  const active = images[index] || images[0]

  return <div className="space-y-6">
    {zoomImage ? <div className="fixed inset-0 z-[120] grid place-items-center bg-black/85 p-3 backdrop-blur-md" onClick={() => setZoomImage(null)}><div className="max-h-[92vh] max-w-5xl"><img src={zoomImage.src} alt={zoomImage.name} className="max-h-[88vh] w-auto rounded-3xl object-contain" /><p className="mt-3 text-center text-sm font-bold text-white">Chạm để đóng</p></div></div> : null}
    <section className="glass-card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
        <button className="relative block h-[360px] w-full overflow-hidden text-left" onClick={() => setZoomImage(active)}>
          <img src={active?.src} alt={active?.name} className="h-full w-full object-cover transition duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Product Gallery · Auto Slide</p>
            <h2 className="mt-2 text-3xl font-black text-white">{room.productName || room.title}</h2>
            <p className="mt-2 text-sm text-slate-200">Bấm ảnh để zoom. Chọn thumbnail bên cạnh để xem ảnh khác.</p>
          </div>
        </button>
        <div className="border-t border-white/10 p-4 lg:border-l lg:border-t-0">
          <p className="label">Chọn ảnh sản phẩm</p>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
            {images.map((image, photoIndex) => <button key={`${image.name}-${photoIndex}`} onClick={() => setIndex(photoIndex)} className={`overflow-hidden rounded-2xl border ${photoIndex === index ? 'border-auction-gold' : 'border-white/10'}`}><img src={image.src} alt={image.name} className="h-20 w-full object-cover" /></button>)}
          </div>
          <p className="mt-3 text-xs text-slate-400">{images.length} ảnh · slide tự chạy mỗi 2.5 giây.</p>
        </div>
      </div>
    </section>
    <BidRoom roomId={roomId} />
  </div>
}
