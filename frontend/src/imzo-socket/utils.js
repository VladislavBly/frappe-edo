import { EIMZOMobile } from "./hash-func"

export const EIMZOUtils = {
  callDeeplink: function(hash) {
    window.open("eimzo://sign?qc=" + hash)
  },
  checkUserAgent: () => {
    // Проверка на мобильные устройства через User-Agent
    const userAgent = navigator.userAgent.toLowerCase()
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|windows phone|opera mini|iemobile|mobile/i
    return mobileRegex.test(userAgent)
  },
  hash: function(siteId, documentId, text) {
    const QrCode = new EIMZOMobile(siteId)
    const code = QrCode.makeQRCode(documentId, text)
    return code
  },

splitHash: hash => {
  const chunkSize = hash.length / 4 // Разделяем на 4 части
  const result = []
  for (let i = 0; i < 4; i++) {
    result.push(hash.slice(i * chunkSize, (i + 1) * chunkSize))
  }
  return result
},

statusPolling: (documentId, successCallback) => {
  const interval = setInterval(async () => {
    try {
      const response = await fetch('https://eimzo.telecomsoft.uz/frontend/mobile/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `documentId=${documentId}`
      });

      const data = await response.json(); // ✅ вот это ключевой момент

      if (data.status === 1) {
        clearInterval(interval);
        successCallback();
      } else if (data.status !== 2) {
        clearInterval(interval);
      }

    } catch (error) {
      clearInterval(interval);
    }
  }, 1000);

  return () => clearInterval(interval);
},


  parseValidDate: date =>
    new Date(
      date
        .split(" ")[0]
        .split(".")
        .join(",")
    ),
  
}
