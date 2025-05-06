// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getStorage } from 'firebase/storage'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBFi0aWmVUJaIWesIfddfP9UueEiwokYuA',
  authDomain: 'e-learning-rp.firebaseapp.com',
  projectId: 'e-learning-rp',
  storageBucket: 'e-learning-rp.appspot.com',
  messagingSenderId: '780681977622',
  appId: '1:780681977622:web:35fd4a34ad5940fbaa7a37',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const storage = getStorage(app)
