// @ts-ignore - vendors файлы из другого проекта
// import { toolsService } from 'app/vendors/api';
const toolsService: any = {}; // Placeholder - будет заменено при интеграции

import { EIMZOMobile } from './hash-func';

export const EIMZOUtils = {
  callDeeplink: function (hash: string) {
    window.open('eimzo://sign?qc=' + hash);
  },
  checkUserAgent: () => {
    // Проверка на мобильные устройства через User-Agent
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileRegex =
      /android|webos|iphone|ipad|ipod|blackberry|windows phone|opera mini|iemobile|mobile/i;
    return mobileRegex.test(userAgent);
  },
  hash: function (siteId: string, documentId: string, text: string) {
    const QrCode = new (EIMZOMobile as any)(siteId);
    const code = QrCode.makeQRCode(documentId, text);
    return code;
  },

  parseValidDate: (date: string) => new Date(date.split(' ')[0].split('.').join(',')),
  timestamper: (signatureHex: string, callback: (args: any) => void) => {
    toolsService
      .getTimestamp(signatureHex)
      .then(({ data }: { data: any }) => {
        if (data) {
          callback(data.pkcs7b64);
        } else {
        }
      })
      .catch((_err: any) => {
        // showAlert('error', err.response && err.response.statusText);
      });
  },
};
