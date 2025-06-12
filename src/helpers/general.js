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
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

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
    let data = {
      src: item.url,
      thumb: item.thumbnail,
      subHtml: HTML_subHtmlOnCaptionMediaGallery(item),
    }
    if (item.type === 'image') {
      return data
    } else if (item.type === 'video') {
      return {
        thumb: item.videoThumbnail,
        video: {
          source: [
            {
              ...data,
              poster: item.thumbnail,
              type: 'video/mp4', // Pastikan MIME type ini benar
            },
          ],
          poster: item.thumbnail, // Gambar poster untuk video
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
    let data = {
      url: item.document.url,
      thumbnail: item.document.url,
      videoThumbnail: item.document.thumbnail,
      caption: item.document.caption,
      username: username,
      latestMessageTimestamp: Number(item.latestMessageTimestamp),
      hours: dayjs(Number(item.latestMessageTimestamp)).format('HH.mm'),
      messageId: item.messageId,
      type: item.document.type,
    }
    return data
  })
}

async function compressedFile(files, type) {
  // console.log('originalFile instanceof Blob', imageFile instanceof Blob); // true
  // console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);

  if (type === 'image') {
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
  } else if (type === 'video') {
    try {
      const ffmpeg = new FFmpeg({ log: true })
      ffmpeg.on('progress', ({ progress, time }) => {
        console.log('progress:', `${progress * 100} % (transcoded time: ${time / 1000000} s)`)
      })
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        // workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      })
      await ffmpeg.writeFile('input.mp4', await fetchFile(URL.createObjectURL(files)))
      await ffmpeg.exec([
        '-i',
        'input.mp4',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast', // Paling cepat
        '-crf',
        '32', // Kualitas lebih rendah, ukuran sangat kecil, proses sangat cepat
        '-vf',
        'scale=640:-1', // Resolusi sangat dikurangi
        '-r',
        '15', // Frame rate dikurangi
        '-c:a',
        'copy',
        'output.mp4',
      ])
      const data = await ffmpeg.readFile('output.mp4')
      const videoBlob = new Blob([data.buffer], { type: 'video/mp4' })
      return videoBlob
    } catch (err) {
      console.log(err)
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

// src/composables/useThumbnailGenerator.js
import { ref } from 'vue'

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
  const generateThumbnail = (videoBlobUrl, positionSeconds = 5, width = 300) => {
    loading.value = true
    error.value = null
    thumbnailUrl.value = null

    return new Promise((resolve, reject) => {
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8) // Format JPEG, kualitas 80%

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
}
