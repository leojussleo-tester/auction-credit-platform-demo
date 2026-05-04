# Auction Credit Platform Demo

A React + Vite + Tailwind CSS MVP prototype for an internal Auction Credit / Bid Credit auction platform.

This is a local-only demo. It has no real backend, no payment gateway, and no real file upload. Data is stored in `localStorage`.

## Tech Stack

- React + Vite
- Tailwind CSS
- JavaScript / JSX
- Mock data + localStorage
- No backend required

## Install & Run

```bash
cd auction-credit-platform-demo
npm install
npm run dev
```

Then open the local Vite URL shown in your terminal, usually:

```bash
http://localhost:5173
```

## Recommended Node Version

Vite's latest official docs require a modern Node.js version. If `npm run dev` warns about Node, upgrade Node.js first.

## Demo Flows To Test

### Buyer Flow

1. Open `Account + KYC`.
2. Check KYC status. Only `Approved` users can bid.
3. Open `My Wallet` and click `Top Up Demo Credit`.
4. Open `Bid Page`.
5. Join a `Live` room.
6. Enter a bid or use quick bid.
7. Confirm in modal.
8. Wallet updates:
   - Available Credit decreases by pending amount.
   - Pending Credit increases.
   - Previous highest bidder receives refund if outbid.

### Member Pending Policy

- Classic + Basic/Pro: pending 100% bid value.
- Pro + Basic/Pro/VIP: pending 50% bid value.
- VIP + Basic: no pending.
- VIP + Pro/VIP: pending 20% demo rate.
- Classic cannot join VIP Room.

### Admin Flow

1. Open `Admin Dashboard`.
2. Approve / reject KYC.
3. Grant / revoke seller account.
4. Approve / reject seller products.
5. Create auction rooms.
6. Set room status to `Upcoming`, `Live`, or `Ended`.
7. Use winner actions:
   - `Mark as Paid`: captures full bid from winner, increases score, adds win history.
   - `Failed Payment`: seizes pending, applies -30 score penalty.
   - `Release Settlement`: sends 90% to seller and records 10% platform fee.

### Seller Flow

1. Open `Admin Dashboard`.
2. Grant seller account to the current demo user.
3. Open `Seller Dashboard`.
4. Submit a product.
5. Admin verifies product.
6. Admin creates a room from that product.

## Main File Structure

```txt
auction-credit-platform-demo/
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  index.html
  src/
    main.jsx
    App.jsx
    index.css
    data/
      mockData.js
    utils/
      policies.js
    context/
      AuctionContext.jsx
    components/
      Badge.jsx
      Layout.jsx
      Modal.jsx
      PolicyBox.jsx
      RoomCard.jsx
      StatCard.jsx
    pages/
      Home.jsx
      AccountKYC.jsx
      Wallet.jsx
      BidPage.jsx
      BidRoom.jsx
      SellerDashboard.jsx
      AdminDashboard.jsx
```

## Key Files Explained

### `src/data/mockData.js`

Initial demo state for users, rooms, bid history, seller products, wallet balances, KYC status, and transactions.

### `src/utils/policies.js`

Central policy logic:

- Member level calculation.
- Pending rate calculation.
- Room eligibility.
- Pending amount calculation.
- Money and time formatting.

### `src/context/AuctionContext.jsx`

Main local app engine:

- Loads and saves localStorage.
- Places bids.
- Refunds previous highest bidder when outbid.
- Updates wallet pending / available credit.
- Handles top up demo credit.
- Handles KYC submission.
- Handles admin actions: approve KYC, grant seller, verify product, create room, mark paid, mark failed, release settlement.

### `src/pages/BidRoom.jsx`

Core bid UX:

- Product info.
- Bid input.
- Quick bid buttons.
- Pending credit preview.
- Confirm bid modal.
- Bid history.

### `src/pages/AdminDashboard.jsx`

Prototype control center for demo operations.

## Reset Demo Data

Click `Reset Demo Data` in the left sidebar. This clears localStorage and restores mock data.

## Notes

- This is not production-ready.
- Add real backend before production.
- Add real auth, secure KYC, audit logs, database transactions, payment provider, and legal compliance before any real auction/payment use.
