import { general } from '@/helpers/general'

const { sortByTimestamp } = general

self.onmessage = async (event) => {
  let totalStreams = 0

  const { streams, messages } = event.data
  const existingMessages = Array.isArray(messages) ? messages : []

  // Buat Map agar bisa replace jika ada id yang sama
  const messageMap = new Map()

  // Masukkan existingMessages ke dalam Map
  for (const msg of existingMessages) {
    msg.latestMessageTimestamp = Number(msg.latestMessageTimestamp)
    messageMap.set(msg.messageId, msg)
  }

  // Proses streams: replace jika timestamp lebih baru
  for (const streamMsg of streams) {
    streamMsg.latestMessageTimestamp = Number(streamMsg.latestMessageTimestamp)

    const existing = messageMap.get(streamMsg.messageId)
    if (!existing || streamMsg.latestMessageTimestamp > existing.latestMessageTimestamp) {
      messageMap.set(streamMsg.messageId, streamMsg)
    }
  }

  // Ubah kembali menjadi array
  const combinedMessages = Array.from(messageMap.values())

  // Urutkan berdasarkan:
  // 1. latestMessageTimestamp ascending
  // 2. isHeader true berada di atas jika timestamp sama
  combinedMessages.sort(sortByTimestamp)

  totalStreams += streams.length

  self.postMessage({ messages: combinedMessages, totalStreams })
}
