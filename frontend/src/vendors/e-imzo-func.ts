// @ts-ignore - e-imzo.js не имеет типов
import { CAPIWS } from './e-imzo';
import { EIMZOUtils } from './utils';

// Стандартные API ключи для e-imzo
const API_KEYS = [
  'localhost',
  '96D0C1491615C82B9A54D9989779DF825B690748224C2B04F500F370D51827CE2644D8D4A82C18184D73AB8530BB8ED537269603F61DB0D03D2104ABF789970B',
  '127.0.0.1',
  'A7BCFA5D490B351BE0754130DF03A068F855DB4333D43921125B9CF2670EF6A40370C646B90401955E1F7BC9CDBF59CE0B2C5467D820BE189C845D0B79CFC96F',
  'null',
  'E0A205EC4E7B78BBB56AFF83A733A1BB9FD39D562E67978CC5E7D73B0951DB1954595A20672A63332535E13CC6EC1E1FC8857BB09E0855D7E76E411B6FA16E9D',
];

let eimzoInitialized = false;

/**
 * Инициализация e-imzo API
 * Должна вызываться один раз при старте приложения
 */
export const initEImzo = (): Promise<void> => {
  return new Promise((resolve) => {
    if (eimzoInitialized) {
      console.log('[E-IMZO] Already initialized');
      resolve();
      return;
    }

    console.log('[E-IMZO] Initializing...');

    try {
      CAPIWS.apikey(
        API_KEYS,
        (_event: any, data: any) => {
          if (data.success) {
            eimzoInitialized = true;
            console.log('[E-IMZO] Initialized successfully');
            resolve();
          } else {
            console.warn('[E-IMZO] Init response:', data);
            // Все равно считаем инициализированным, т.к. ключи отправлены
            eimzoInitialized = true;
            resolve();
          }
        },
        (error: any) => {
          console.warn('[E-IMZO] Init error (plugin may not be running):', error);
          // Не блокируем приложение если e-imzo не установлен
          resolve();
        }
      );
    } catch (error) {
      console.warn('[E-IMZO] Init exception:', error);
      resolve();
    }
  });
};

/**
 * Проверка инициализирован ли e-imzo
 */
export const isEImzoInitialized = () => eimzoInitialized;

export interface ParsedAlias {
  ['1.2.860.3.16.1.2']?: string;
  cn?: string;
  o?: string;
  validto?: string;
  validfrom?: string;
  t?: string;
  uid?: string;
  name?: string;
  [key: string]: string | undefined;
}

export interface Cert {
  // Сырые данные от e-imzo
  disk?: string;
  path?: string;
  name?: string;
  alias?: string;
  keyId?: string;
  // Парсированные данные
  inn: string;
  overdue?: boolean;
  parsedAlias?: ParsedAlias;
  serialNumber: string;
  type?: 'pfx' | 'certkey';
}

interface RawCert {
  disk: string;
  path: string;
  name: string;
  alias: string;
  serialNumber?: string;
}

interface IGetCertsRes {
  certificates: RawCert[];
}

/**
 * Парсинг alias сертификата в объект
 * Формат alias: "CN=ФИО,O=Organization,T=Title,..."
 */
export const parseAlias = (alias: string): ParsedAlias => {
  const result: ParsedAlias = {};
  if (!alias) return result;

  alias.split(',').forEach((pair) => {
    const eqIndex = pair.indexOf('=');
    if (eqIndex > 0) {
      const key = pair.substring(0, eqIndex).trim().toLowerCase();
      const value = pair.substring(eqIndex + 1).trim();
      result[key] = value;
    }
  });

  return result;
};

/**
 * Получить все сертификаты PFX с парсингом alias
 */
export const getAllCertificatesPfxParsed = async (): Promise<Cert[]> => {
  const data = await EIMZOAPI.getAllCertificatesPfx();
  const certs = data?.certificates || [];

  return certs.map((cert) => {
    const parsed = parseAlias(cert.alias);
    return {
      ...cert,
      inn: parsed['1.2.860.3.16.1.2'] || parsed.uid || '',
      serialNumber: cert.serialNumber || cert.alias,
      parsedAlias: parsed,
      type: 'pfx' as const,
    };
  });
};

export const EIMZOAPI = {
  getAllCertificatesCertkey: () =>
    new Promise<IGetCertsRes>((resolve, reject) => {
      CAPIWS.callFunction(
        {
          name: 'list_all_certificates',
          plugin: 'certkey',
        },
        (_event: any, data: any) => {
          resolve(data);
        },
        (error: any) => {
          reject(error);
        }
      );
    }),

  getAllCertificatesPfx: () =>
    new Promise<IGetCertsRes>((resolve, reject) => {
      CAPIWS.callFunction(
        {
          name: 'list_all_certificates',
          plugin: 'pfx',
        },
        (_event: any, data: any) => {
          resolve(data);
        },
        (error: any) => {
          reject(error);
        }
      );
    }),
  loadPfxKey: (
    item: any,
    string: string,
    type?: string,
    timestampMode: boolean = true
  ): Promise<string> =>
    new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          arguments: [item.disk, item.path, item.name, item.alias],
          name: 'load_key',
          plugin: 'pfx',
        },
        (_event: any, data: any) => {
          if (data.success) {
            const id = data.keyId;
            window.sessionStorage.setItem(item.serialNumber, id);
            const func =
              type === 'attach' ? EIMZOAPI.postLoadKeyAttach : EIMZOAPI.postLoadKey;
            func(id, string, timestampMode).then(
              (encryptedString) => {
                resolve(encryptedString);
              },
              (e) => {
                reject(e);
              }
            );
          } else {
            reject(data.reason);
          }
        },
        (e: any) => {
          reject(e);
        }
      );
    }),
  postLoadKey: (id: any, string: string, timestampMode: boolean): Promise<string> => {
    return new Promise((resolve, reject) => {
      const encodeStr = btoa(unescape(encodeURIComponent(string)));
      CAPIWS.callFunction(
        {
          arguments: [encodeStr, id, 'no'],
          name: 'create_pkcs7',
          plugin: 'pkcs7',
        },
        (_event: any, data: any) => {
          if (data.success) {
            const pkcs7 = data.pkcs7_64;
            if (timestampMode) {
              if (EIMZOUtils.timestamper) {
                // const sn = data.signer_serial_number; // Не используется
                EIMZOUtils.timestamper(pkcs7, (tst) => {
                  resolve(tst);
                });
              } else {
              }
            } else {
              resolve(pkcs7);
            }
          } else {
            reject(data.reason);
          }
        }
      );
    });
  },
  postLoadKeyAttach: (id: string, string: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          arguments: [string, id],
          name: 'append_pkcs7_attached',
          plugin: 'pkcs7',
        },
        (_event: any, data: any) => {
          if (data.success) {
            const pkcs7 = data.pkcs7_64;
            if (EIMZOUtils.timestamper) {
              // const sn = data.signer_serial_number; // Не используется
              EIMZOUtils.timestamper(pkcs7, (tst) => {
                resolve(tst);
              });
            } else {
              resolve(pkcs7);
            }
          } else {
            reject(data.reason);
          }
        },
        (e: any) => {
          reject(e);
        }
      );
    });
  },

  preLoadKey: (item: any) =>
    new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          arguments: [item.disk, item.path, item.name, item.serialNumber],
          name: 'load_key',
          plugin: 'certkey',
        },
        (_event: any, data: any) => {
          if (data.success) {
            resolve(data.keyId);
          } else {
            reject(data.reason);
          }
        }
      );
    }),

  /**
   * Загрузить PFX ключ и получить keyId
   * E-IMZO сам запросит пароль у пользователя
   */
  loadKey: (cert: Cert): Promise<string> =>
    new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          plugin: 'pfx',
          name: 'load_key',
          arguments: [cert.disk, cert.path, cert.name, cert.alias],
        },
        (_event: any, data: any) => {
          if (data.success) {
            resolve(data.keyId);
          } else {
            reject(new Error(data.reason || 'Не удалось загрузить ключ'));
          }
        },
        (error: any) => {
          reject(new Error(error?.message || 'Ошибка соединения с E-IMZO'));
        }
      );
    }),

  /**
   * Создать PKCS7 подпись документа
   * @param keyId - идентификатор ключа (из loadKey)
   * @param documentBase64 - документ в Base64
   * @param detached - "yes" для detached подписи, "no" для attached
   */
  createPkcs7: (keyId: string, documentBase64: string, detached: 'yes' | 'no' = 'no'): Promise<string> =>
    new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          plugin: 'pkcs7',
          name: 'create_pkcs7',
          arguments: [documentBase64, keyId, detached],
        },
        (_event: any, data: any) => {
          if (data.success) {
            resolve(data.pkcs7_64);
          } else {
            reject(new Error(data.reason || 'Не удалось создать подпись'));
          }
        },
        (error: any) => {
          reject(new Error(error?.message || 'Ошибка создания подписи'));
        }
      );
    }),
};

/**
 * Подписать документ с помощью E-IMZO
 * @param cert - сертификат (из getAllCertificatesPfxParsed)
 * @param document - строка или объект для подписания
 * @returns PKCS7 подпись в Base64
 */
export const signDocument = async (cert: Cert, document: string | object): Promise<string> => {
  // Преобразуем документ в Base64
  const docString = typeof document === 'string' ? document : JSON.stringify(document);
  const documentBase64 = btoa(unescape(encodeURIComponent(docString)));

  // 1. Загружаем ключ (E-IMZO запросит пароль)
  const keyId = await EIMZOAPI.loadKey(cert);

  // 2. Создаем PKCS7 подпись
  const pkcs7 = await EIMZOAPI.createPkcs7(keyId, documentBase64, 'no');

  return pkcs7;
};

/**
 * Подписать PDF (бинарные данные в Base64) с помощью E-IMZO.
 * Используется для подписания фишки при согласовании директором (схема LexDoc Fiska).
 * @param cert - сертификат (из getAllCertificatesPfxParsed)
 * @param pdfBase64 - содержимое PDF в Base64
 * @returns PKCS7 подпись в Base64
 */
export const signPdfDocument = async (cert: Cert, pdfBase64: string): Promise<string> => {
  const keyId = await EIMZOAPI.loadKey(cert);
  const pkcs7 = await EIMZOAPI.createPkcs7(keyId, pdfBase64, 'no');
  return pkcs7;
};
