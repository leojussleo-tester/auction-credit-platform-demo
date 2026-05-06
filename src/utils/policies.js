export const MEMBER_LEVELS = ['Classic', 'Pro', 'VIP']
export const ROOM_LEVELS = ['Basic', 'Pro', 'VIP']
export const ROOM_STATUSES = ['Upcoming', 'Live', 'Paused', 'Locked', 'Ended']
export const KYC_STATUSES = ['Not Submitted', 'Pending', 'Approved', 'Rejected']

export function money(value = 0) {
  return `${Number(value || 0).toLocaleString('en-US')} AC`
}

export function shortMoney(value = 0) {
  const number = Number(value || 0)
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M AC`
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K AC`
  return `${number.toLocaleString('en-US')} AC`
}

export function formatDateTime(value) {
  if (!value) return 'N/A'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function pad(value) {
  return String(value).padStart(2, '0')
}

export function timeLeft(endTime, status) {
  if (status === 'Ended') return 'Ended'
  if (status === 'Paused') return 'Paused by Admin'
  if (status === 'Locked') return 'Locked by Admin'
  const diff = new Date(endTime).getTime() - Date.now()
  if (diff <= 0) return '00:00:00'
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return days > 0 ? `${days}d ${clock}` : clock
}

export function calculateMemberLevel(user) {
  if (!user) return 'Classic'
  if (user.role === 'admin') return 'VIP'
  if (user.memberLevelOverride) return user.memberLevelOverride
  const score = Number(user.score || 0)
  const winsPaid = Number(user.winsPaid || 0)
  const totalWonValue = Number(user.totalWonValue || 0)
  const seriousFailed = Number(user.seriousFailedPayments || 0)

  if (winsPaid >= 10 && score >= 100 && totalWonValue >= 10000 && seriousFailed === 0) return 'VIP'
  if (winsPaid >= 3 && score >= 30 && !hasRecentFailedPayment(user)) return 'Pro'
  return 'Classic'
}

export function hasRecentFailedPayment(user) {
  const failedPayments = user?.failedPayments || []
  const thirtyDays = 1000 * 60 * 60 * 24 * 30
  return failedPayments.some((date) => Date.now() - new Date(date).getTime() <= thirtyDays)
}

export function getPendingRate(memberLevel, roomLevel) {
  if (memberLevel === 'Classic') return roomLevel === 'VIP' ? null : 1
  if (memberLevel === 'Pro') return 0.5
  if (memberLevel === 'VIP') {
    if (roomLevel === 'Basic') return 0
    return 0.2
  }
  return 1
}

export function getPendingPolicyText(memberLevel, roomLevel) {
  const rate = getPendingRate(memberLevel, roomLevel)
  if (rate === null) return 'Classic Member không được join VIP Room.'
  if (rate === 0) return 'VIP Member vào Basic Room không cần pending credit.'
  if (rate < 0.3) return `VIP Member pending demo ${(rate * 100).toFixed(0)}% giá bid.`
  return `${memberLevel} Member pending ${(rate * 100).toFixed(0)}% giá bid.`
}

export function canJoinRoom(user, room) {
  if (!user || !room) return { allowed: false, reason: 'Missing user or room.' }
  if (user.role === 'admin') return { allowed: true, reason: 'Admin staff can access every room without password.', rate: 0, memberLevel: 'VIP' }
  if (user.isBanned) return { allowed: false, reason: 'Account đã bị ban do vi phạm room.' }
  if (user.kycStatus !== 'Approved') return { allowed: false, reason: 'User cần KYC Approved trước khi tham gia bid.' }
  if (room.status === 'Locked') return { allowed: false, reason: 'Room đang bị Admin khoá.' }
  if (room.status === 'Paused') return { allowed: false, reason: 'Room đang tạm dừng bởi Admin.' }
  const level = calculateMemberLevel(user)
  if (room.roomLevel === 'VIP' && level === 'Classic') {
    return { allowed: false, reason: 'VIP Room chỉ dành cho Pro Member và VIP Member.' }
  }
  const rate = getPendingRate(level, room.roomLevel)
  if (rate === null) return { allowed: false, reason: 'Không đủ cấp độ member cho room này.' }
  return { allowed: true, reason: 'Eligible', rate, memberLevel: level }
}

export function calculatePendingAmount(amount, memberLevel, roomLevel) {
  const rate = getPendingRate(memberLevel, roomLevel)
  if (rate === null) return null
  return Math.ceil(Number(amount || 0) * rate)
}

export function getMemberUpgradeHint(user) {
  const level = calculateMemberLevel(user)
  if (level === 'VIP') return 'Đã đạt VIP. Tiếp tục giữ lịch sử thanh toán sạch để duy trì quyền vào room cao cấp.'
  if (level === 'Pro') {
    const needScore = Math.max(0, 100 - Number(user.score || 0))
    const needWins = Math.max(0, 10 - Number(user.winsPaid || 0))
    return `Cần thêm ${needScore} điểm và ${needWins} lần thắng thanh toán thành công để tiến gần VIP.`
  }
  const needScore = Math.max(0, 30 - Number(user.score || 0))
  const needWins = Math.max(0, 3 - Number(user.winsPaid || 0))
  return `Cần thêm ${needScore} điểm và ${needWins} lần thắng thanh toán thành công để lên Pro.`
}

export function nextId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`
}
