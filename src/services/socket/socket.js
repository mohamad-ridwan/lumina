// socket.js
import { io } from 'socket.io-client'
import { clientUrl } from '../apiBaseUrl'

// const URL = 'http://localhost:4001' // Ganti dengan URL server socket Anda
const URL = clientUrl // Ganti dengan URL server socket Anda

export const socket = io(URL)
