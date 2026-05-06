import { useEffect } from 'react'
import AdminDashboard from './AdminDashboard'

function removeAdminHistoryBlocks() {
  document.querySelectorAll('section.glass-card').forEach((section) => {
    if (section.textContent?.includes('Lịch sử duyệt / từ chối nạp rút')) section.remove()
  })
  document.querySelectorAll('.soft-card').forEach((card) => {
    if (card.textContent?.includes('Review History') && card.textContent?.includes('Approved / Rejected')) card.remove()
  })
}

export default function AdminDashboardClean() {
  useEffect(() => {
    removeAdminHistoryBlocks()
    const observer = new MutationObserver(removeAdminHistoryBlocks)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return <AdminDashboard />
}
