import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import { AuctionProvider } from './context/AuctionContext'
import Home from './pages/Home'
import AccountKYC from './pages/AccountKYC'
import Wallet from './pages/Wallet'
import BidPage from './pages/BidPage'
import BidRoom from './pages/BidRoom'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'

function getRoute() {
  const hash = window.location.hash.replace('#', '')
  return hash || '/'
}

function useHashRoute() {
  const [route, setRoute] = useState(getRoute())
  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return route
}

function Router() {
  const route = useHashRoute()
  const roomMatch = route.match(/^\/room\/(.+)$/)

  let page = <Home />
  if (route === '/account') page = <AccountKYC />
  if (route === '/wallet') page = <Wallet />
  if (route === '/bid') page = <BidPage />
  if (roomMatch) page = <BidRoom roomId={roomMatch[1]} />
  if (route === '/seller') page = <SellerDashboard />
  if (route === '/admin') page = <AdminDashboard />

  return <Layout route={route}>{page}</Layout>
}

export default function App() {
  return (
    <AuctionProvider>
      <Router />
    </AuctionProvider>
  )
}
