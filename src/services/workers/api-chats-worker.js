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

  let newChats = []

  let processedString = chunkedString
    .replace('{"message":"Chats Data","data":', '')
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
    .filter((item) => item !== null)

  newData.forEach((item) => {
    if (!Object.isExtensible(item) || Object.isFrozen(item)) {
      item = { ...item }
    }
    const isEmpty = newChats.find((msg) => msg?.chatId === item?.chatId)
    if (!isEmpty?.chatId) {
      newChats = [...newChats, item]
    }
  })

  self.postMessage({ chats: newChats, isDone: false })

  getTotalData().then((res) => {
    if (res?.data?.length > 0) {
      self.postMessage({ chats: newChats, isDone: true })
    } else if ((res?.status && res?.status !== 'success') || res?.data?.length === 0) {
      self.postMessage({ chats: [], isDone: true })
    }
  })
})
