import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEY, initialState } from '../data/mockData'
import { getDemoAccount, DEMO_ACCOUNTS } from '../data/demoAccounts'
import {
  calculateMemberLevel,
  calculatePendingAmount,
  canJoinRoom,
  getPendingRate,
  nextId,
} from '../utils/policies'

const AuctionContext = createContext(null)

function ensureDemoUsers(state) {
  const existingIds = new Set((state.users || []).map((user) => user.id))
  const missing = DEMO_ACCOUNTS.filter((account) => !existingIds.has(account.id))
  if (!missing.length) return state
  return { ...state, users: [...(state.users || []), ...missing] }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return ensureDemoUsers(initialState)
    const parsed = JSON.parse(saved)
    return ensureDemoUsers({ ...initialState, ...parsed })
  } catch (error) {
    console.warn('Failed to load localStorage state:', error)
    return ensureDemoUsers(initialState)
  }
}

function addTx(user, type, amount, note) {
  user.transactions = [
    {
      id: nextId('tx'),
      type,
      amount,
      time: new Date().toISOString(),
      note,
    },
    ...(user.transactions || []),
  ]
}

function addLog(draft, message) {
  draft.activityLog = [
    { id: nextId('log'), time: new Date().toISOString(), message },
    ...(draft.activityLog || []),
  ].slice(0, 30)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function AuctionProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.currentUserId) || state.users[0],
    [state.users, state.currentUserId]
  )

  const currentMemberLevel = useMemo(() => calculateMemberLevel(currentUser), [currentUser])

  function updateCurrentUser(patch) {
    setState((prev) => {
      const draft = clone(prev)
      const user = draft.users.find((item) => item.id === draft.currentUserId)
      Object.assign(user, patch)
      addLog(draft, `${user.name} updated account profile.`)
      return draft
    })
  }

  function submitKyc(fileName = 'demo-id-card.png') {
    setState((prev) => {
      const draft = clone(prev)
      const user = draft.users.find((item) => item.id === draft.currentUserId)
      user.kycStatus = 'Pending'
      user.kycFileName = fileName
      addLog(draft, `${user.name} submitted demo KYC.`)
      return draft
    })
  }

  function topUpCredit(amount) {
    const safeAmount = Number(amount)
    if (!safeAmount || safeAmount <= 0) return { ok: false, message: 'Top up amount must be greater than 0.' }
    setState((prev) => {
      const draft = clone(prev)
      const user = draft.users.find((item) => item.id === draft.currentUserId)
      user.wallet.available += safeAmount
      addTx(user, 'Top Up', safeAmount, 'Demo credit top up')
      addLog(draft, `${user.name} topped up ${safeAmount.toLocaleString()} Auction Credit.`)
      return draft
    })
    return { ok: true, message: 'Demo credit topped up.' }
  }

  function toggleFollowRoom(roomId) {
    setState((prev) => {
      const draft = clone(prev)
      const exists = draft.followedRoomIds.includes(roomId)
      draft.followedRoomIds = exists
        ? draft.followedRoomIds.filter((id) => id !== roomId)
        : [roomId, ...draft.followedRoomIds]
      return draft
    })
  }

  function placeBid(roomId, rawAmount) {
    const amount = Number(rawAmount)
    if (!amount || amount <= 0) return { ok: false, message: 'Bid amount is invalid.' }

    let result = { ok: true, message: 'Bid placed.' }

    setState((prev) => {
      const draft = clone(prev)
      const room = draft.rooms.find((item) => item.id === roomId)
      const user = draft.users.find((item) => item.id === draft.currentUserId)
      if (!room || !user) {
        result = { ok: false, message: 'Room or user not found.' }
        return prev
      }

      const eligibility = canJoinRoom(user, room)
      if (!eligibility.allowed) {
        result = { ok: false, message: eligibility.reason }
        return prev
      }
      if (room.status !== 'Live') {
        result = { ok: false, message: 'Only Live rooms accept bids.' }
        return prev
      }

      const minimumBid = (room.currentHighestBid || room.startingPrice) + room.minIncrement
      if (amount < minimumBid) {
        result = { ok: false, message: `Minimum bid is ${minimumBid.toLocaleString()} AC.` }
        return prev
      }

      const memberLevel = calculateMemberLevel(user)
      const pendingAmount = calculatePendingAmount(amount, memberLevel, room.roomLevel)
      if (pendingAmount === null) {
        result = { ok: false, message: 'This member level cannot join the room.' }
        return prev
      }
      if (user.wallet.available < pendingAmount) {
        result = {
          ok: false,
          message: `Insufficient available credit. Need pending ${pendingAmount.toLocaleString()} AC.`,
        }
        return prev
      }

      const activeBid = [...room.bids].reverse().find((bid) => bid.status === 'active')
      if (activeBid) {
        const oldUser = draft.users.find((item) => item.id === activeBid.userId)
        if (oldUser) {
          oldUser.wallet.pending = Math.max(0, oldUser.wallet.pending - activeBid.pendingAmount)
          oldUser.wallet.available += activeBid.pendingAmount
          addTx(oldUser, 'Refund', activeBid.pendingAmount, `Outbid refund from ${room.title}`)
        }
        room.bids = room.bids.map((bid) => bid.id === activeBid.id ? { ...bid, status: 'outbid' } : bid)
      }

      user.wallet.available -= pendingAmount
      user.wallet.pending += pendingAmount
      addTx(user, 'Bid Pending', -pendingAmount, `Pending for bid ${amount.toLocaleString()} AC in ${room.title}`)

      const newBid = {
        id: nextId('bid'),
        userId: user.id,
        username: user.name,
        amount,
        pendingAmount,
        time: new Date().toISOString(),
        status: 'active',
      }

      room.bids.push(newBid)
      room.currentHighestBid = amount
      room.winnerUserId = user.id
      room.paymentStatus = 'Open'
      room.settlementStatus = 'Waiting Auction End'

      addLog(draft, `${user.name} placed ${amount.toLocaleString()} AC bid in ${room.title}.`)
      result = { ok: true, message: 'Bid placed and previous pending was refunded if outbid.' }
      return draft
    })

    return result
  }

  function submitSellerProduct(form) {
    let result = { ok: true, message: 'Product submitted.' }
    setState((prev) => {
      const draft = clone(prev)
      const user = draft.users.find((item) => item.id === draft.currentUserId)
      if (!user.sellerEnabled) {
        result = { ok: false, message: 'Seller account must be granted by admin first.' }
        return prev
      }
      const product = {
        id: nextId('prod'),
        sellerId: user.id,
        name: form.name,
        description: form.description,
        image: form.image || 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?auto=format&fit=crop&w=1200&q=80',
        startingPrice: Number(form.startingPrice || 0),
        minIncrement: Number(form.minIncrement || 0),
        desiredRoomLevel: form.desiredRoomLevel || 'Basic',
        condition: form.condition,
        verificationNote: form.verificationNote,
        verificationStatus: 'Pending',
        roomId: null,
        registrationFee: form.desiredRoomLevel === 'VIP' ? 150 : form.desiredRoomLevel === 'Pro' ? 80 : 50,
        commissionRate: 0.1,
        settlementStatus: 'Not Listed',
        createdAt: new Date().toISOString(),
      }
      draft.sellerProducts = [product, ...draft.sellerProducts]
      addLog(draft, `${user.name} submitted seller product: ${product.name}.`)
      return draft
    })
    return result
  }

  function adminUpdateUser(userId, patch) {
    setState((prev) => {
      const draft = clone(prev)
      const user = draft.users.find((item) => item.id === userId)
      if (user) {
        Object.assign(user, patch)
        addLog(draft, `Admin updated ${user.name}.`)
      }
      return draft
    })
  }

  function adminUpdateProduct(productId, patch) {
    setState((prev) => {
      const draft = clone(prev)
      const product = draft.sellerProducts.find((item) => item.id === productId)
      if (product) {
        Object.assign(product, patch)
        addLog(draft, `Admin updated product ${product.name}.`)
      }
      return draft
    })
  }

  function adminCreateRoom(form) {
    setState((prev) => {
      const draft = clone(prev)
      const seller = draft.users.find((user) => user.id === form.sellerId) || draft.users.find((user) => user.sellerEnabled)
      const product = draft.sellerProducts.find((item) => item.id === form.productId)
      const startingPrice = Number(form.startingPrice || product?.startingPrice || 500)
      const minIncrement = Number(form.minIncrement || product?.minIncrement || 50)
      const room = {
        id: nextId('room'),
        title: form.title || product?.name || 'New Auction Room',
        productName: product?.name || form.title || 'New Auction Product',
        image: product?.image || form.image || 'https://images.unsplash.com/photo-1605902711622-cfb43c4437d1?auto=format&fit=crop&w=1200&q=80',
        description: product?.description || form.description || 'Admin-created demo auction room.',
        sellerId: seller?.id || 'u-seller-1',
        sellerName: seller?.name || 'Demo Seller',
        verificationStatus: product?.verificationStatus || 'Verified',
        condition: product?.condition || 'Demo condition.',
        startingPrice,
        currentHighestBid: startingPrice,
        minIncrement,
        roomLevel: form.roomLevel || 'Basic',
        status: form.status || 'Upcoming',
        startTime: form.startTime || new Date().toISOString(),
        endTime: form.endTime || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        roomFee: form.roomLevel === 'VIP' ? 150 : form.roomLevel === 'Pro' ? 80 : 50,
        commissionRate: 0.1,
        paymentStatus: 'Not Started',
        settlementStatus: 'Waiting Auction Start',
        winnerUserId: null,
        bids: [],
      }
      draft.rooms = [room, ...draft.rooms]
      if (product) {
        product.roomId = room.id
        product.settlementStatus = 'Listed'
      }
      addLog(draft, `Admin created room ${room.title}.`)
      return draft
    })
  }

  function adminUpdateRoom(roomId, patch) {
    setState((prev) => {
      const draft = clone(prev)
      const room = draft.rooms.find((item) => item.id === roomId)
      if (room) {
        Object.assign(room, patch)
        if (patch.status === 'Ended' && room.winnerUserId) {
          room.paymentStatus = room.paymentStatus === 'Paid' ? 'Paid' : 'Awaiting Winner Payment'
          room.settlementStatus = room.settlementStatus === 'Released' ? 'Released' : 'On Hold'
        }
        addLog(draft, `Admin updated room ${room.title}.`)
      }
      return draft
    })
  }

  function adminMarkWinnerPaid(roomId) {
    let result = { ok: true, message: 'Winner marked as paid.' }
    setState((prev) => {
      const draft = clone(prev)
      const room = draft.rooms.find((item) => item.id === roomId)
      const activeBid = room?.bids?.find((bid) => bid.status === 'active')
      if (!room || !activeBid) {
        result = { ok: false, message: 'No active winning bid found.' }
        return prev
      }
      const winner = draft.users.find((user) => user.id === activeBid.userId)
      if (!winner) {
        result = { ok: false, message: 'Winner user not found.' }
        return prev
      }

      const remainder = activeBid.amount - activeBid.pendingAmount
      if (winner.wallet.available < remainder) {
        result = { ok: false, message: `Winner lacks remaining credit. Need ${remainder.toLocaleString()} AC available. Use Failed Payment or top up first.` }
        return prev
      }

      winner.wallet.available -= remainder
      winner.wallet.pending = Math.max(0, winner.wallet.pending - activeBid.pendingAmount)
      winner.score = Number(winner.score || 0) + 15
      winner.winsPaid = Number(winner.winsPaid || 0) + 1
      winner.totalWonValue = Number(winner.totalWonValue || 0) + activeBid.amount
      winner.winHistory = [{ id: nextId('win'), roomTitle: room.title, amount: activeBid.amount, paidAt: new Date().toISOString() }, ...(winner.winHistory || [])]
      addTx(winner, 'Win Payment', -activeBid.amount, `Paid winning bid for ${room.title}`)

      room.bids = room.bids.map((bid) => (bid.id === activeBid.id ? { ...bid, status: 'paid' } : bid))
      room.status = 'Ended'
      room.paymentStatus = 'Paid'
      room.settlementStatus = 'Ready for Seller Settlement'
      addLog(draft, `Admin marked ${winner.name} as paid for ${room.title}. Score +15.`)
      return draft
    })
    return result
  }

  function adminMarkFailedPayment(roomId) {
    let result = { ok: true, message: 'Failed payment applied.' }
    setState((prev) => {
      const draft = clone(prev)
      const room = draft.rooms.find((item) => item.id === roomId)
      const activeBid = room?.bids?.find((bid) => bid.status === 'active')
      if (!room || !activeBid) {
        result = { ok: false, message: 'No active winning bid found.' }
        return prev
      }
      const winner = draft.users.find((user) => user.id === activeBid.userId)
      if (!winner) {
        result = { ok: false, message: 'Winner user not found.' }
        return prev
      }

      winner.wallet.pending = Math.max(0, winner.wallet.pending - activeBid.pendingAmount)
      winner.score = Number(winner.score || 0) - 30
      winner.failedPayments = [new Date().toISOString(), ...(winner.failedPayments || [])]
      addTx(winner, 'Penalty', -activeBid.pendingAmount, `Failed payment penalty lost pending in ${room.title}`)
      room.bids = room.bids.map((bid) => (bid.id === activeBid.id ? { ...bid, status: 'failed' } : bid))
      room.status = 'Ended'
      room.paymentStatus = 'Failed Payment'
      room.settlementStatus = 'Cancelled / Pending Admin Review'
      addLog(draft, `Admin marked failed payment for ${winner.name}. Pending seized and score -30.`)
      return draft
    })
    return result
  }

  function adminApplyPenalty(userId) {
    setState((prev) => {
      const draft = clone(prev)
      const user = draft.users.find((item) => item.id === userId)
      if (user) {
        user.score = Number(user.score || 0) - 30
        user.failedPayments = [new Date().toISOString(), ...(user.failedPayments || [])]
        addTx(user, 'Penalty', 0, 'Manual admin penalty: score -30')
        addLog(draft, `Admin applied manual penalty to ${user.name}.`)
      }
      return draft
    })
  }

  function adminReleaseSettlement(roomId) {
    let result = { ok: true, message: 'Settlement released.' }
    setState((prev) => {
      const draft = clone(prev)
      const room = draft.rooms.find((item) => item.id === roomId)
      const paidBid = room?.bids?.find((bid) => bid.status === 'paid')
      if (!room || !paidBid || room.paymentStatus !== 'Paid') {
        result = { ok: false, message: 'Room must be paid before settlement release.' }
        return prev
      }
      if (room.settlementStatus === 'Released') {
        result = { ok: false, message: 'Settlement already released.' }
        return prev
      }
      const seller = draft.users.find((user) => user.id === room.sellerId)
      const platformFee = Math.ceil(paidBid.amount * room.commissionRate)
      const settlement = paidBid.amount - platformFee
      if (seller) {
        seller.wallet.available += settlement
        addTx(seller, 'Settlement', settlement, `Seller settlement for ${room.title} after 10% platform fee`)
      }
      room.settlementStatus = 'Released'
      room.platformFee = platformFee
      room.sellerSettlement = settlement
      addLog(draft, `Admin released seller settlement for ${room.title}. Fee: ${platformFee.toLocaleString()} AC.`)
      return draft
    })
    return result
  }

  function setCurrentUser(userId) {
    setState((prev) => {
      const draft = clone(ensureDemoUsers(prev))
      if (!draft.users.some((user) => user.id === userId)) {
        const account = getDemoAccount(userId)
        if (account) draft.users.push(account)
      }
      return { ...draft, currentUserId: userId }
    })
  }

  function resetDemo() {
    localStorage.removeItem(STORAGE_KEY)
    setState(ensureDemoUsers(initialState))
  }

  const value = {
    state,
    currentUser,
    currentMemberLevel,
    followedRooms: state.rooms.filter((room) => state.followedRoomIds.includes(room.id)),
    updateCurrentUser,
    submitKyc,
    topUpCredit,
    toggleFollowRoom,
    placeBid,
    submitSellerProduct,
    adminUpdateUser,
    adminUpdateProduct,
    adminCreateRoom,
    adminUpdateRoom,
    adminMarkWinnerPaid,
    adminMarkFailedPayment,
    adminApplyPenalty,
    adminReleaseSettlement,
    setCurrentUser,
    resetDemo,
    getPendingRate,
  }

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>
}

export function useAuction() {
  const context = useContext(AuctionContext)
  if (!context) throw new Error('useAuction must be used inside AuctionProvider')
  return context
}
