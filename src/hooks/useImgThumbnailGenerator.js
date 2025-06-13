import { ref } from 'vue'
import { general } from '@/helpers/general'

const { blobToBase64 } = general

export const useImgThumbnailGenerator = () => {
  const thumbnail = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const generateThumbnail = async (blob) => {
    loading.value = true
    const base64URL = await blobToBase64(blob)
    loading.value = false
    if (!base64URL) {
      error.value = true
      return
    }
    thumbnail.value = base64URL
    return base64URL
  }

  return { thumbnail, loading, error, generateThumbnail }
}
