import { ITEMS_PER_PAGE } from '@/utils/pagination'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekday from 'dayjs/plugin/weekday'

dayjs.extend(isToday)
dayjs.extend(isYesterday)
dayjs.extend(weekOfYear)
dayjs.extend(weekday)

const formatDate = (date) => {
  const today = dayjs().startOf('day')
  const yesterday = dayjs().subtract(1, 'day').startOf('day')
  // const now = dayjs();
  const dateToCheck = dayjs(date)
  const oneWeekAgo = today.subtract(7, 'day')

  if (dateToCheck.isSame(today, 'day')) {
    return 'Today'
  } else if (dateToCheck.isSame(yesterday, 'day')) {
    return 'Yesterday'
  } else if (dateToCheck.isAfter(oneWeekAgo)) {
    return dateToCheck.format('dddd')
  } else {
    return dateToCheck.format('DD MMMM YYYY')
  }
}

const removeDuplicates = (arr, field) => {
  const seenFieldValues = new Set()
  const seenHeaderTimestamps = new Set()

  return arr.filter((obj) => {
    if (obj.isHeader === true) {
      const timestamp = Number(obj.latestMessageTimestamp)
      if (seenHeaderTimestamps.has(timestamp)) {
        return false
      } else {
        seenHeaderTimestamps.add(timestamp)
        return true
      }
    } else {
      const value = obj[field]
      if (seenFieldValues.has(value)) {
        return false
      } else {
        seenFieldValues.add(value)
        return true
      }
    }
  })
}

const sortByTimestamp = (a, b) => {
  const aTime = Number(a.latestMessageTimestamp)
  const bTime = Number(b.latestMessageTimestamp)

  if (aTime === bTime) {
    if (a.isHeader && !b.isHeader) return 1
    if (!a.isHeader && b.isHeader) return -1
    return 0
  }

  return bTime - aTime // DESCENDING
}

const createNewMessages = (messages) => {
  const newMessages = messages.filter((item) => item?.messageId)

  return removeDuplicates(newMessages, 'messageId').sort(sortByTimestamp).slice(0, ITEMS_PER_PAGE)
}

const deviceDetector = () => {
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)

  if (isMobile) {
    // Code for mobile devices
    return 'mobile'
  } else {
    // Code for desktop devices
    return 'desktop'
  }
}

function messageMatching(streams, indexedDBData) {
  const streamsMessageIdsSet = new Set(streams.map((stream) => stream.messageId))

  // 1. Filter item yang messageId nya ada di streams
  let finalMatchedMessages = indexedDBData.filter((dbItem) =>
    streamsMessageIdsSet.has(dbItem.messageId),
  )

  // 2. Pisah header dan non-header dulu
  const headers = finalMatchedMessages.filter((item) => item.isHeader)
  const nonHeaders = finalMatchedMessages.filter((item) => !item.isHeader)

  // 3. Filter header: hapus jika tidak ada 1 pun non-header yang memiliki timeId yang sama
  const validHeaders = headers.filter((header) => {
    const headerTimeId = header.timeId

    const hasMatch = nonHeaders.some((item) => {
      return item.timeId === headerTimeId
    })

    return hasMatch
  })

  // Gabung kembali non-header + header yang valid
  const result = [...nonHeaders, ...validHeaders]

  return result.sort(sortByTimestamp)
}

const getUploadFile = async (accept = 'image/*') => {
  // Trigger file picker
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = accept
  return await new Promise((resolve) => {
    fileInput.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        resolve(file)
      }
    }
    fileInput.click()
  })
}

const base64ToBlob = (base64, mimeType = 'image/jpeg') => {
  const byteString = atob(base64.split(',')[1])
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const intArray = new Uint8Array(arrayBuffer)
  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i)
  }
  return new Blob([intArray], { type: mimeType })
}
const blobToFile = (blob, filename) => {
  const file = new File([blob], filename, { type: blob.type })
  return file
}

const sortLatestMessages = (chats, profileId) => {
  return chats.sort((a, b) => {
    const aMsgs = a?.latestMessage ?? []
    const bMsgs = b?.latestMessage ?? []

    const aHasMessages = aMsgs.length > 0
    const bHasMessages = bMsgs.length > 0

    if (aHasMessages !== bHasMessages) {
      return bHasMessages ? 1 : -1
    }

    const a_currentLatestMessage = aMsgs.find((msg) => msg?.userId === profileId)
    const b_currentLatestMessage = bMsgs.find((msg) => msg?.userId === profileId)

    const aTimestamp = Number(a_currentLatestMessage?.latestMessageTimestamp ?? 0)
    const bTimestamp = Number(b_currentLatestMessage?.latestMessageTimestamp ?? 0)

    return bTimestamp - aTimestamp
  })
}

export const general = {
  createNewMessages,
  removeDuplicates,
  sortByTimestamp,
  deviceDetector,
  messageMatching,
  formatDate,
  getUploadFile,
  base64ToBlob,
  blobToFile,
  sortLatestMessages,
}
