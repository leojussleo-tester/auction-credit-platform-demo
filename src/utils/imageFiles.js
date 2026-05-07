export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null)
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function readImageFiles(files) {
  const list = Array.from(files || []).filter((file) => file.type?.startsWith('image/'))
  const images = await Promise.all(list.map(async (file) => ({
    name: file.name,
    dataUrl: await readFileAsDataUrl(file),
  })))
  return images.filter((item) => item.dataUrl)
}
