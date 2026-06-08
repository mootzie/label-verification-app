const MAX_LONG_EDGE = 1568 // Claude's native image resolution ceiling
const MAX_BYTES = 1_048_576 // 1 MB

export async function resizeForUpload(file: File): Promise<File> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(url)

            const { naturalWidth: w, naturalHeight: h } = img
            const longEdge = Math.max(w, h)

            // skip resize if already small enough
            if (longEdge <= MAX_LONG_EDGE && file.size <= MAX_BYTES) {
                resolve(file)
                return
            }

            const scale =
                longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1
            const canvas = document.createElement('canvas')
            canvas.width = Math.round(w * scale)
            canvas.height = Math.round(h * scale)
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file)
                        return
                    }
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }))
                },
                'image/jpeg',
                0.88
            )
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(file)
        }
        img.src = url
    })
}
