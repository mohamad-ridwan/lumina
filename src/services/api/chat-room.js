import { clientUrl } from '../apiBaseUrl'
import { fetchData } from '../fetchData'

export const uploadMediaMessage = async (formData) => {
  const result = await fetchData(`${clientUrl}/chat-room/upload-media-message`, {
    method: 'POST',
    body: formData,
  })

  return result
}

export const fetchMessagesAround = async (chatRoomId, messageId, profileId, recipientId) => {
  const result = await fetchData(
    `${clientUrl}/chat-room/messages/${chatRoomId}/message/${messageId}/around?profileId=${profileId}&recipientId=${recipientId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  return result
}

export const fetchMediaMessagesAround = async (chatRoomId, messageId, profileId, recipientId) => {
  const result = await fetchData(
    `${clientUrl}/chat-room/media-messages/${chatRoomId}/message/${messageId}/around?profileId=${profileId}&recipientId=${recipientId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  return result
}

export const fetchChatRoom = async (req) => {
  const result = await fetchData(`${clientUrl}/chat-room`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  return result
}

export const fetchMessagesPagination = async ({
  chatId,
  chatRoomId,
  messageId,
  direction,
  isFirstMessage,
  profileId,
}) => {
  let query = `?chatId=${chatId}&chatRoomId=${chatRoomId}`
  if (messageId) {
    query += `&messageId=${messageId}`
  }
  if (direction) {
    query += `&direction=${direction}`
  }
  if (isFirstMessage) {
    query += `&isFirstMessage=${isFirstMessage}`
  }
  if (profileId) {
    query += `&profileId=${profileId}`
  }
  const result = await fetchData(`${clientUrl}/chat-room/messages${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return result
}

export const fetchConfirmCancelOrder = async (req) => {
  const result = await fetchData(`${clientUrl}/chat-room/confirm-cancel-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })
  return result
}

// export const fetchChatRoom = async (req, apiChatRoomWorker, resDataCallback, errCallback) => {
//   const response = await fetch(`${clientUrl}/chat-room`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(req),
//   })

//   if (!response.ok) {
//     errCallback({
//       ...(await response.json()),
//     })
//     return
//   }

//   const reader = response.body.getReader()
//   let decoder = new TextDecoder()
//   let chunkedString = ''

//   let isDone = false

//   apiChatRoomWorker.onmessage = (event) => {
//     resDataCallback(
//       event.data.messages, // Ganti chats dengan messages
//       event.data.isDone,
//       event.data.isDone ? event.data.messages.length : null,
//       event.data?.fullRes,
//     )
//   }

//   while (true) {
//     const { value, done } = await reader.read()
//     if (done) {
//       isDone = true
//     }
//     if (done) break

//     chunkedString += decoder.decode(value, { stream: true })

//     apiChatRoomWorker.postMessage({ chunkedString })
//   }

//   return {}
// }
