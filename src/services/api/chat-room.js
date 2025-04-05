import { clientUrl } from '../apiBaseUrl'

export const fetchChatRoom = async (req, apiChatRoomWorker, resDataCallback, errCallback) => {
  const response = await fetch(`${clientUrl}/chat-room`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  if (!response.ok) {
    errCallback({
      ...(await response.json()),
    })
    return
  }

  const reader = response.body.getReader()
  let decoder = new TextDecoder()
  let chunkedString = ''

  let isDone = false

  apiChatRoomWorker.onmessage = (event) => {
    resDataCallback(
      event.data.messages, // Ganti chats dengan messages
      event.data.isDone,
      event.data.isDone ? event.data.messages.length : null,
      event.data?.fullRes,
    )
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      isDone = true
    }
    if (done) break

    chunkedString += decoder.decode(value, { stream: true })

    apiChatRoomWorker.postMessage({ chunkedString })
  }

  return {}
}
