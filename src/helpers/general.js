import { ITEMS_PER_PAGE } from '@/utils/pagination'

const removeDuplicates = (arr, field) => {
  const seenValues = new Set()

  return arr.filter((obj) => {
    const value = obj[field]
    if (seenValues.has(value)) {
      return false
    } else {
      seenValues.add(value)
      return true
    }
  })
}

const sortByTimestamp = (a, b) => {
  const aTime = Number(a.latestMessageTimestamp)
  const bTime = Number(b.latestMessageTimestamp)

  if (aTime === bTime) {
    if (a.isHeader && !b.isHeader) return -1
    if (!a.isHeader && b.isHeader) return 1
    return 0
  }

  return bTime - aTime // DESCENDING
}

const createNewMessages = (messages) => {
  const newMessages = messages.filter((item) => item?.messageId)

  return removeDuplicates(newMessages, 'messageId').sort(sortByTimestamp).slice(0, ITEMS_PER_PAGE)
}

export const general = {
  createNewMessages,
  removeDuplicates,
  sortByTimestamp,
}
