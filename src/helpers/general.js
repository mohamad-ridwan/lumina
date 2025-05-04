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

export const general = {
  createNewMessages,
  removeDuplicates,
  sortByTimestamp,
  deviceDetector,
  messageMatching,
  formatDate,
}
