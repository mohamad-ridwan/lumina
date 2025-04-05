self.addEventListener('message', (event) => {
  function splitJSONObjects(data) {
    const objects = []
    let braceCount = 0
    let inString = false
    let escapeNext = false
    let currentObject = ''

    for (let i = 0; i < data.length; i++) {
      const char = data[i]

      if (char === '\\' && !escapeNext) {
        escapeNext = true
        currentObject += char
        continue
      }

      if (char === '"' && !escapeNext) {
        inString = !inString
      }

      if (!inString) {
        if (char === '{') {
          braceCount++
        } else if (char === '}') {
          braceCount--
        }
      }

      currentObject += char

      if (braceCount === 0 && currentObject.trim()) {
        objects.push(currentObject)
        currentObject = ''
      }

      escapeNext = false
    }

    return objects
  }

  const { chunkedString } = event.data

  let newMessages = []

  let processedString = chunkedString
    .replace(/\{"message":"Chat room data".*?"data":/, '') // Menghapus hingga "data":
    .replace('[', '')
    .replace(']}', '')

  const objectStrings = splitJSONObjects(processedString)

  const getTotalData = async () => {
    try {
      return JSON.parse(chunkedString)
    } catch (error) {
      return null
    }
  }

  const newData = objectStrings
    .map((objectString) => {
      try {
        return JSON.parse(objectString)
      } catch (error) {
        return null
      }
    })
    .filter((item) => item && Object.keys(item).length > 0) // Filter objek kosong

  newData.forEach((item) => {
    if (!Object.isExtensible(item) || Object.isFrozen(item)) {
      item = { ...item }
    }
    const isEmpty = newMessages.find((msg) => msg?._id === item?._id)
    if (!isEmpty?._id) {
      newMessages = [...newMessages, item]
    }
  })

  self.postMessage({ messages: newMessages, isDone: false })

  getTotalData().then((res) => {
    if (res?.data?.length > 0) {
      self.postMessage({ messages: newMessages, isDone: true, fullRes: res })
    } else if ((res?.message && res?.message !== 'Chat room data') || res?.data?.length === 0) {
      self.postMessage({ messages: [], isDone: true, fullRes: res })
    }
  })
})
