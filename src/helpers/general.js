import { ITEMS_PER_PAGE } from '@/utils/pagination'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekday from 'dayjs/plugin/weekday'
import imageCompression from 'browser-image-compression'

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

const dateWithHours = (latestMessageTimestamp, hours) => {
  if (!latestMessageTimestamp) return ''
  const itemDate = dayjs(Number(latestMessageTimestamp)).startOf('day')
  return `${formatDate(itemDate)} at ${hours}`
}

const HTML_usernameOnCaptionMediaGallery = (currentItem) => {
  return currentItem?.username
    ? currentItem?.latestMessageTimestamp
      ? `<p class="text-sm text-gray-500">by ${currentItem.username}</p>`
      : `<p class="text-sm text-gray-500">${currentItem.username}</p>`
    : ''
}

const HTML_subHtmlOnCaptionMediaGallery = (item) => {
  return `
      <div class="absolute bottom-26 left-4 right-4 overflow-y-auto bg-black/70 p-4 rounded-lg max-w-full">
        <div class="flex flex-col max-h-[130px]">
        ${item?.caption ? `<h4 class="text-base text-white">${item.caption}</h4>` : ''}
        ${HTML_usernameOnCaptionMediaGallery(item)}
        ${
          item?.latestMessageTimestamp
            ? `<p class="text-xs text-gray-400">${dateWithHours(item.latestMessageTimestamp, item.hours)}</p>`
            : ''
        }
            </div>
      </div>
    `
}

const captionMediaGallery = (media) => {
  return media.map((item) => {
    return {
      src: item.url,
      thumb: item.thumbnail,
      subHtml: HTML_subHtmlOnCaptionMediaGallery(item),
    }
  })
}
const mediaGalleryData = (mediaGallery, profileId, recipientUsername) => {
  return mediaGallery.map((item) => {
    const username = item?.senderUserId === profileId ? 'You' : recipientUsername
    return {
      url: item.document.url,
      thumbnail: item.document.url,
      caption: item.document.caption,
      username: username,
      latestMessageTimestamp: Number(item.latestMessageTimestamp),
      hours: dayjs(Number(item.latestMessageTimestamp)).format('HH.mm'),
      messageId: item.messageId,
    }
  })
}

async function compressedFile(files) {
  // console.log('originalFile instanceof Blob', imageFile instanceof Blob); // true
  // console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }
  try {
    const compressedFile = await imageCompression(files, options)
    // console.log('compressedFile instanceof Blob', compressedFile instanceof Blob); // true
    // console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`); // smaller than maxSizeMB

    return compressedFile
  } catch (error) {
    console.log(error)
  }
}

function computeSafePosition(x, y, menuWidth = 120, menuHeight = 100) {
  const padding = 8
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = x
  let top = y

  if (x + menuWidth > vw - padding) {
    left = vw - menuWidth - padding
  }

  if (y + menuHeight > vh - padding) {
    top = vh - menuHeight - padding
  }

  return { top: Math.floor(top), left: Math.floor(left) }
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
  dateWithHours,
  captionMediaGallery,
  mediaGalleryData,
  HTML_usernameOnCaptionMediaGallery,
  HTML_subHtmlOnCaptionMediaGallery,
  compressedFile,
  computeSafePosition,
}
