import { clientUrl } from '../apiBaseUrl'
import { fetchData } from '../fetchData'

export const fetchChats = async (userId, chatId, search) => {
  let query = `?userId=${userId}`
  if (chatId) {
    query += `&chatId=${chatId}`
  }
  if (search) {
    query += `&search=${search}`
  }
  const result = await fetchData(`${clientUrl}/chats${query}`)
  return result
}

// export const fetchChats = async (userId, apiChatsWorker, resDataCallback, errCallback) => {
//   const response = await fetch(`${clientUrl}/chats?userId=${userId}`)

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

//   apiChatsWorker.onmessage = (event) => {
//     resDataCallback(
//       event.data.chats,
//       event.data.isDone,
//       event.data.isDone ? event.data.chats.length : null,
//     )
//   }

//   while (true) {
//     const { value, done } = await reader.read()
//     if (done) {
//       isDone = true
//     }
//     if (done) break

//     chunkedString += decoder.decode(value, { stream: true })

//     apiChatsWorker.postMessage({ chunkedString })
//   }

//   return {}
// }
