import { CAPIWS } from ".";

export const EIMZOAPI = {
  getAllCertificatesPfx: () =>
    new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          name: 'list_all_certificates',
          plugin: 'pfx',
        },
        (eventny, data) => {
          resolve(data);
        },
        (error) => {
          reject(error);
        }
      );
    }),
    loadPfxKey: (
    item,
    callback,
  ) =>
    new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          arguments: [item.disk, item.path, item.name, item.alias],
          name: 'load_key',
          plugin: 'pfx',
        },
        callback
      );
    }),
  getChallenge: async () => {
    try {
      const response = await fetch('https://eimzo.telecomsoft.uz/frontend/challenge', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  },
  createPKCS7: (keyID, Challenge) => new Promise((resolve, reject) => {
        const encodeStr = btoa(unescape(encodeURIComponent(Challenge)));
        CAPIWS.callFunction(
          {
            arguments: [encodeStr, keyID, 'no'],
            name: 'create_pkcs7',
            plugin: 'pkcs7',
          },
          (event, data) => {
            if (data.success) {
              const pkcs7 = data.pkcs7_64;
              resolve(pkcs7)
            } else {
              reject(data.reason);
            }
          }
        );
      })
}