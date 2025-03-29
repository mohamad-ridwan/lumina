// socket.js
import { io } from 'socket.io-client'

const URL = 'http://localhost:4001' // Ganti dengan URL server socket Anda

export const socket = io(URL)
