import { useEffect, useRef } from 'react'
import WalletClean from './WalletClean'
import { readFileAsDataUrl } from '../utils/imageFiles'

const DEPOSIT_KEY = 'auction-credit-deposit-requests-v1'

export default function WalletWithBillImage() {
  const lastBillRef = useRef(null)

  useEffect(() => {
    let mounted = true
    async function captureBill(event) {
      const target = event.target
      if (!target || target.type !== 'file') return
      const file = target.files?.[0]
      if (!file || !file.type?.startsWith('image/')) return
      try {
        const dataUrl = await readFileAsDataUrl(file)
        if (mounted) lastBillRef.current = { name: file.name, dataUrl }
      } catch {
        // keep normal wallet behavior if image preview fails
      }
    }

    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function patchedSetItem(key, value) {
      if (key === DEPOSIT_KEY && lastBillRef.current) {
        try {
          const requests = JSON.parse(value || '[]')
          const bill = lastBillRef.current
          const patched = requests.map((request) => {
            if (!request.billDataUrl && request.billName === bill.name) {
              return { ...request, billDataUrl: bill.dataUrl }
            }
            return request
          })
          return originalSetItem.call(this, key, JSON.stringify(patched))
        } catch {
          return originalSetItem.call(this, key, value)
        }
      }
      return originalSetItem.call(this, key, value)
    }

    document.addEventListener('change', captureBill, true)
    return () => {
      mounted = false
      document.removeEventListener('change', captureBill, true)
      Storage.prototype.setItem = originalSetItem
    }
  }, [])

  return <WalletClean />
}
