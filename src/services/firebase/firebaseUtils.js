import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '.'
import { generateRandomId } from '@/helpers/generateRandomId'

const uploadFileToFirebase = async (file, path) => {
  const storageRef = ref(storage, `${path}/lumina-${generateRandomId(15)}`)

  return await new Promise((resolve, reject) => {
    uploadBytes(storageRef, file)
      .then(() => getDownloadURL(storageRef))
      .then((url) => resolve(url))
      .catch((err) => reject(err))
  })
}

export const firebaseUtils = { uploadFileToFirebase }
