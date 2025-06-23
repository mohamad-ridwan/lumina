self.onmessage = async (e) => {
  if (e.data.type === 'processImageProfile') {
    const receivedImageBitmap = e.data.imageBitmap

    if (!receivedImageBitmap) {
      self.postMessage({ error: 'No ImageBitmap received.' })
      return
    }

    try {
      // 1. Buat OffscreenCanvas di dalam worker
      const offscreenCanvas = new OffscreenCanvas(
        receivedImageBitmap.width,
        receivedImageBitmap.height,
      )
      const ctx = offscreenCanvas.getContext('2d')

      // 2. Gambar ImageBitmap ke OffscreenCanvas
      ctx.drawImage(receivedImageBitmap, 0, 0)

      // --- Lakukan Operasi Canvas di dalam Worker ---
      // Contoh: Resize gambar (jika diperlukan)
      const targetWidth = 800
      const targetHeight = Math.round(
        receivedImageBitmap.height * (targetWidth / receivedImageBitmap.width),
      )

      const resizedOffscreenCanvas = new OffscreenCanvas(targetWidth, targetHeight)
      const resizedCtx = resizedOffscreenCanvas.getContext('2d')
      resizedCtx.drawImage(receivedImageBitmap, 0, 0, targetWidth, targetHeight) // Gambar bitmap asli ke ukuran target

      // Contoh: Konversi ke Blob (untuk upload)
      const outputBlob = await resizedOffscreenCanvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.9,
      })

      // Contoh: Atau konversi ke DataURL (jika diperlukan)
      // const outputDataURL = resizedOffscreenCanvas.toDataURL('image/png'); // toDataURL juga tersedia!

      // 3. Kirim Blob yang sudah diolah kembali ke main thread
      // self.postMessage(outputBlob, [outputBlob]) // Kirim Blob sebagai transferable
      self.postMessage(outputBlob) // Kirim Blob sebagai transferable

      // Atau jika Anda mengirim DataURL:
      // self.postMessage(outputDataURL);
    } catch (error) {
      console.error('Error processing image in worker:', error)
      self.postMessage({ error: error.message })
    }
  }
}
