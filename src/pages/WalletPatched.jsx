import { useEffect, useRef } from 'react'
import WalletFixed from './WalletFixed'

function forceCenterWalletModals() {
  document.querySelectorAll('div').forEach((node) => {
    const classes = typeof node.className === 'string' ? node.className : ''
    if (classes.includes('fixed') && classes.includes('inset-0') && classes.includes('z-[100]')) {
      node.classList.remove('items-end')
      node.classList.add('items-center')
      node.style.alignItems = 'center'
      node.style.justifyContent = 'center'
      node.style.paddingTop = '0.75rem'
      node.style.paddingBottom = '0.75rem'
    }
  })
}

function moveWithdrawToBottom(container) {
  const walletRoot = container?.firstElementChild
  if (!walletRoot) return
  const children = Array.from(walletRoot.children)
  const withdrawSummary = children.find((item) => {
    const text = item.textContent || ''
    return item.tagName === 'SECTION' && text.includes('Rút Credit → VNĐ') && text.includes('Form rút nằm')
  })
  const withdrawHistory = children.find((item) => {
    const text = item.textContent || ''
    return item.tagName === 'SECTION' && text.includes('Withdrawal Requests') && text.includes('Lịch sử yêu cầu rút')
  })

  if (withdrawSummary) walletRoot.appendChild(withdrawSummary)
  if (withdrawHistory) walletRoot.appendChild(withdrawHistory)
}

export default function WalletPatched() {
  const ref = useRef(null)

  useEffect(() => {
    const apply = () => {
      moveWithdrawToBottom(ref.current)
      forceCenterWalletModals()
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(apply, 400)
    return () => {
      observer.disconnect()
      window.clearInterval(timer)
    }
  }, [])

  return <div ref={ref}><WalletFixed /></div>
}
