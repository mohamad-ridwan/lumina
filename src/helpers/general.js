import { ITEMS_PER_PAGE } from '@/utils/pagination'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekday from 'dayjs/plugin/weekday'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import imageCompression from 'browser-image-compression'
// src/composables/useThumbnailGenerator.js
import { ref } from 'vue'

dayjs.extend(isToday)
dayjs.extend(isYesterday)
dayjs.extend(weekOfYear)
dayjs.extend(weekday)
dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault('Asia/Jakarta')

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

const removeDuplicates = (arr, field, profileId) => {
  const seenFieldValues = new Set()
  const seenHeaderTimestamps = new Set()

  return arr.filter((obj) => {
    if (obj.isHeader === true) {
      let timestamp = Number(obj.latestMessageTimestamp)
      if (obj?.senderUserId !== profileId && obj?.completionTimestamp) {
        timestamp = Number(obj.completionTimestamp)
      }
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

const sortByTimestamp = (a, b, profileId) => {
  let aTime = Number(a.latestMessageTimestamp)
  let bTime = Number(b.latestMessageTimestamp)

  if (a?.senderUserId !== profileId && a?.completionTimestamp) {
    aTime = Number(a.completionTimestamp)
  }
  if (b?.senderUserId !== profileId && b?.completionTimestamp) {
    bTime = Number(b.completionTimestamp)
  }

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

    let aTimestamp = Number(a_currentLatestMessage?.latestMessageTimestamp ?? 0)
    let bTimestamp = Number(b_currentLatestMessage?.latestMessageTimestamp ?? 0)

    if (
      a_currentLatestMessage?.senderUserId !== profileId &&
      a_currentLatestMessage?.completionTimestamp
    ) {
      aTimestamp = Number(a_currentLatestMessage.completionTimestamp)
    }
    if (
      b_currentLatestMessage?.senderUserId !== profileId &&
      b_currentLatestMessage?.completionTimestamp
    ) {
      bTimestamp = Number(b_currentLatestMessage.completionTimestamp)
    }

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
  // return `
  //     <div class="absolute bottom-26 left-4 right-4 overflow-y-auto bg-black/70 p-4 rounded-lg max-w-full">
  //       <div class="flex flex-col max-h-[130px]">
  //       ${item?.caption ? `<h4 class="text-base text-white">${item.caption}</h4>` : ''}
  //       ${HTML_usernameOnCaptionMediaGallery(item)}
  //       ${
  //         item?.latestMessageTimestamp
  //           ? `<p class="text-xs text-gray-400">${dateWithHours(item.latestMessageTimestamp, item.hours)}</p>`
  //           : ''
  //       }
  //           </div>
  //     </div>
  //   `
  return `
      <div class="left-4 right-4 overflow-y-auto bg-black/70 p-2 rounded-lg max-w-full">
        <div class="flex flex-col max-h-[80px]">
        ${item?.caption ? `<p class="text-base text-white">${item.caption}</p>` : ''}
        ${HTML_usernameOnCaptionMediaGallery(item)}
        ${
          item?.latestMessageTimestamp
            ? `<p class="text-[13px] text-gray-400">${dateWithHours(item.latestMessageTimestamp, item.hours)}</p>`
            : ''
        }
            </div>
      </div>
    `
}

const captionMediaGallery = (media) => {
  return media.map((item) => {
    let data = {
      src: item.url,
      thumb: item.thumbnail,
      subHtml: HTML_subHtmlOnCaptionMediaGallery(item),
    }
    if (item.type === 'image') {
      return data
    } else if (item.type === 'video') {
      return {
        thumb: item?.poster ?? item.videoThumbnail,
        subHtml: HTML_subHtmlOnCaptionMediaGallery(item),
        video: {
          source: [
            {
              ...data,
              poster: item?.poster ?? item.thumbnail,
              type: 'video/mp4', // Pastikan MIME type ini benar
            },
          ],
          poster: item?.poster ?? item.thumbnail, // Gambar poster untuk video
          attributes: { preload: true, controls: true },
        },
      }
    }
    return {}
  })
}
const mediaGalleryData = (mediaGallery, profileId, recipientUsername) => {
  return mediaGallery.map((item) => {
    const username = item?.senderUserId === profileId ? 'You' : recipientUsername
    let latestMessageTimestamp = Number(item?.latestMessageTimestamp)
    if (item?.senderUserId !== profileId && item?.completionTimestamp) {
      latestMessageTimestamp = Number(item?.completionTimestamp)
    }
    let data = {
      url: item.document.url,
      thumbnail: item.document.url,
      videoThumbnail: item.document.thumbnail,
      poster: item.document?.poster,
      caption: item.document.caption,
      username: username,
      latestMessageTimestamp: latestMessageTimestamp,
      hours: dayjs(latestMessageTimestamp).format('HH.mm'),
      messageId: item.messageId,
      type: item.document.type,
    }
    return data
  })
}

async function compressedFile(
  files,
  type,
  maxWidthOrHeight = 5,
  initialQuality = 0,
  maxSizeMB = 0.1,
) {
  // console.log('originalFile instanceof Blob', imageFile instanceof Blob); // true
  // console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);

  if (type === 'image') {
    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight,
      initialQuality,
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

const createArrayBuffer = async (file) => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const arrayBuffer = reader.result
      resolve({
        file,
        buffer: arrayBuffer,
      })
    }

    reader.readAsArrayBuffer(file)
  })
}

function useThumbnailGenerator() {
  const thumbnailUrl = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * Membuat thumbnail dari Blob URL video.
   * @param {string} videoBlobUrl - Blob URL dari video.
   * @param {number} positionSeconds - Posisi waktu (dalam detik) untuk mengambil frame thumbnail.
   * @param {number} width - Lebar thumbnail yang diinginkan (px). Tinggi akan dihitung secara proporsional.
   * @returns {Promise<string|null>} Data URL thumbnail atau null jika gagal.
   */
  const generateThumbnail = async (videoBlobUrl, positionSeconds = 1, width = 300) => {
    loading.value = true
    error.value = null
    thumbnailUrl.value = null

    return await new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.src = videoBlobUrl
      video.crossOrigin = 'anonymous' // Penting jika video dari domain berbeda (meskipun Blob URL biasanya tidak masalah)
      video.preload = 'metadata' // Hanya load metadata, bukan seluruh video

      video.onloadedmetadata = () => {
        video.currentTime = positionSeconds // Setel waktu ke posisi yang diinginkan
      }

      video.onseeked = () => {
        // Pastikan video sudah siap di frame yang tepat
        const canvas = document.createElement('canvas')
        const aspectRatio = video.videoWidth / video.videoHeight
        canvas.width = width
        canvas.height = width / aspectRatio

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          const errMsg = 'Failed to get 2D canvas context.'
          console.error(errMsg)
          error.value = errMsg
          loading.value = false
          return reject(errMsg)
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0) // Format JPEG, kualitas 80%

        thumbnailUrl.value = dataUrl
        loading.value = false
        resolve(dataUrl)

        // Opsional: Hapus elemen video setelah selesai
        video.remove()
        canvas.remove()
      }

      video.onerror = (e) => {
        const errMsg = `Error loading video: ${e.message || 'Unknown error'}`
        console.error(errMsg, e)
        error.value = errMsg
        loading.value = false
        reject(errMsg)
        video.remove()
      }

      // Jika video sudah terisi, pastikan event onloadedmetadata tidak terlewat
      if (video.readyState >= 1) {
        // HAVE_METADATA or more
        video.onloadedmetadata()
      }
    })
  }

  return {
    videoThumbnailUrl: thumbnailUrl,
    loading,
    error,
    generateThumbnail,
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result) // result berisi string base64
    reader.onerror = reject
    reader.readAsDataURL(blob) // Konversi ke base64 string (DataURL format)
  })
}

const loadImage = async (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (...args) => reject(args)
    img.src = src
  })

const getImageData = (image) => {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0)
  return context.getImageData(0, 0, image.width, image.height)
}

function createSuperSmallThumbnail(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 20
      canvas.height = 20 * (img.height / img.width)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.5)
    }
    img.src = URL.createObjectURL(file)
  })
}

function getImageDimensionsFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      URL.revokeObjectURL(url)
      resolve({ width, height })
    }

    img.onerror = reject
    img.src = url
  })
}

const sortLatestGalleryMessages = (a, b, profileId) => {
  let latestA = Number(a.latestMessageTimestamp) || 0
  let latestB = Number(b.latestMessageTimestamp) || 0
  if (a?.senderUserId !== profileId && a?.completionTimestamp) {
    latestA = Number(a.completionTimestamp)
  }
  if (b?.senderUserId !== profileId && b?.completionTimestamp) {
    latestB = Number(b.completionTimestamp)
  }
  return latestB - latestA
}

const sortLatestChats = (a, b, profileId) => {
  const a_currentLatestMessage = a?.latestMessage?.find((msg) => msg?.userId === profileId)
  const b_currentLatestMessage = b?.latestMessage?.find((msg) => msg?.userId === profileId)

  let aTimestamp = Number(a_currentLatestMessage?.latestMessageTimestamp ?? 0)
  let bTimestamp = Number(b_currentLatestMessage?.latestMessageTimestamp ?? 0)

  if (
    a_currentLatestMessage?.senderUserId !== profileId &&
    a_currentLatestMessage?.completionTimestamp
  ) {
    aTimestamp = Number(a_currentLatestMessage.completionTimestamp)
  }
  if (
    b_currentLatestMessage?.senderUserId !== profileId &&
    b_currentLatestMessage?.completionTimestamp
  ) {
    bTimestamp = Number(b_currentLatestMessage.completionTimestamp)
  }

  return aTimestamp > bTimestamp ? -1 : 1
  // return a_currentLatestMessage?.latestMessageTimestamp >
  //   b_currentLatestMessage?.latestMessageTimestamp
  //   ? -1
  //   : 1
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
  createArrayBuffer,
  useThumbnailGenerator,
  blobToBase64,
  loadImage,
  getImageData,
  createSuperSmallThumbnail,
  getImageDimensionsFromBlob,
  sortLatestGalleryMessages,
  sortLatestChats,
}
