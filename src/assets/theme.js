export const theme = {
  primary: {
    main: '#2e74e8', // Biru utama (sedikit lebih tua)
    text: '#ffffff', // Teks putih pada latar belakang biru
    hover: '#2662c2', // Warna hover untuk tombol utama (sedikit lebih tua)
    active: '#2054ad', // Warna active untuk tombol utama (sedikit lebih tua)
  },
  secondary: {
    main: '#6b7280', // Abu-abu sekunder
    text: '#ffffff', // Teks putih pada latar belakang abu-abu
    hover: '#5a626e', // Warna hover untuk tombol sekunder
    active: '#495057', // Warna active untuk tombol sekunder
  },
  surface: {
    background: '#f9fafb', // Latar belakang aplikasi
    text: '#111827', // Teks utama
  },
  message: {
    sender: {
      background: '#e0f2fe', // Biru muda untuk pesan pengirim
      text: '#111827', // Teks utama
    },
    receiver: {
      background: '#d1fae5', // Hijau muda untuk pesan penerima
      text: '#111827', // Teks utama
    },
  },
  border: '#e5e7eb', // Warna border
  shadow: {
    message: '0 1px 2px rgba(0, 0, 0, 0.05)', // Box shadow untuk pesan
  },
  addChatButton: {
    main: '#a1a1a1', // Abu-abu sedang untuk tombol "Tambah Obrolan"
    text: '#000000', // Teks hitam pada latar belakang abu-abu
    hover: '#909090', // Warna hover untuk tombol "Tambah Obrolan" (sedikit lebih gelap)
    active: '#808080', // Warna active untuk tombol "Tambah Obrolan" (lebih gelap)
  },
  regularBtn:
    'rounded-tl-[6px] !rounded-bl-[0] rounded-tr-[6px] rounded-br-[6px] !bg-[#a1a1a1] hover:!bg-[#909090] !h-[23px] !w-[23px] justify-center items-center flex cursor-pointer !text-black !outline-none !border-none !p-0',
}
