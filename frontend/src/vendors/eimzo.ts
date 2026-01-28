import { AppStore } from "app/store";
import { CAPIWS } from "app/vendors/e-imzo";
import dayjs from "dayjs";
import { parseData } from "helpers/alias";

import { toolsService } from "./api";
import { generateGuid } from "./api/tools";
import { EIMZOAPI } from "./e-imzo-func";
import AuthError, { AuthErrorCode } from "./errors/AuthError";
import { Cert, EIMZOAuth, SignatureCallback } from "./types";
import { EIMZOUtils } from "./utils";
let store: AppStore;

export const setStoreInEimzo = (storeToSet: AppStore) => {
  store = storeToSet;
};

export const startApi = () => {
  CAPIWS.apikey(["domain", "domain_key", "127.0.0.1", "local_key"]);
};

const signatureCertKey: SignatureCallback<string> = (
  item,
  resolve,
  reject,
  string,
  timestampMode
) => {
  EIMZOAPI.preLoadKey(item).then(
    (id) => {
      EIMZOAPI.postLoadKey(id, string, timestampMode === true).then(
        (encryptedString: string) => {
          resolve(encryptedString);
        },
        (error) => {
          reject(error);
        }
      );
    },
    (error) => {
      reject(error);
    }
  );
};

const signaturePfxKey: SignatureCallback<string> = (
  item,
  resolve,
  reject,
  string,
  timestampMode
) => {
  const id = window.sessionStorage.getItem(item.serialNumber);
  if (id) {
    EIMZOAPI.postLoadKey(id, string, timestampMode).then(
      (encryptedString) => {
        resolve(encryptedString);
      },
      () => {
        EIMZOAPI.loadPfxKey(item, string, "", timestampMode)
          .then((encryptedString) => {
            resolve(encryptedString);
          })
          .catch((e) => {
            reject(e);
          });
      }
    );
  } else {
    EIMZOAPI.loadPfxKey(item, string, "", timestampMode)
      .then((encryptedString) => {
        resolve(encryptedString);
      })
      .catch((e) => {
        reject(e);
      });
  }
};

export const getSignature = (
  item: any,
  string: string,
  timestampMode: boolean
): Promise<string> =>
  new Promise((resolve, reject) => {
    if (item.type === "certkey") {
      return signatureCertKey(item, resolve, reject, string, timestampMode);
    } else if (item.type === "pfx") {
      const sign = signaturePfxKey(
        item,
        resolve,
        reject,
        string,
        timestampMode
      );
      return sign;
    }
  });

export const getAcceptSignature = (item: any, data: any): Promise<string> =>
  new Promise((resolve, reject) => {
    if (item.type === "certkey") {
      EIMZOAPI.preLoadKey(item).then(
        (id: any) => {
          EIMZOAPI.postLoadKeyAttach(id, data).then(
            (encryptedString) => {
              resolve(encryptedString);
            },
            (error) => {
              reject(error);
            }
          );
        },
        (error) => {
          reject(error);
        }
      );
    } else if (item.type === "pfx") {
      const id = window.sessionStorage.getItem(item.serialNumber);
      if (id) {
        EIMZOAPI.postLoadKeyAttach(id, data).then(
          (encryptedString) => {
            resolve(encryptedString);
          },
          () => {
            EIMZOAPI.loadPfxKey(item, data, "attach");
          }
        );
      } else {
        EIMZOAPI.loadPfxKey(item, data, "attach").then((encryptedString) => {
          resolve(encryptedString);
        });
      }
    }
  });

export const attach = (string: string): Promise<string> =>
  new Promise(async (resolve, reject) => {
    let cert;
    try {
      cert = await getCertificate().then((res) => res);
    } catch {
      // showAlert('error', i18n.CheckEimzo);
      return reject();
    }
    try {
      const signature = await getAcceptSignature(cert, string);
      resolve(signature);
    } catch {
      // showAlert('error', i18n.PasswordIncorrect);
      reject();
    }
  });

export const getCertificate = () =>
  new Promise(async (resolve, reject) => {
    if (!store) return;
    const { uid } = store.getState().auth;
    const serialNumber = window.sessionStorage.getItem("serialNumber");
    let allCerts: any;
    try {
      allCerts = await getAllCertificates(uid);
    } catch {
      return reject();
    }
    if (serialNumber) {
      resolve(
        allCerts.find(
          (cert: Cert) =>
            (cert.inn === uid ||
              cert.parsedAlias?.["1.2.860.3.16.1.2"] === uid) &&
            cert.serialNumber === serialNumber
        )
      );
    } else {
      const filteredCerts = allCerts.filter(
        (cert: any) =>
          cert.inn === uid || cert.parsedAlias?.["1.2.860.3.16.1.2"] === uid
      );
      switch (filteredCerts.length) {
        case 0:
          // showAlert('error', i18n.CertNotFound);
          reject();
          break;
        case 1:
          resolve(filteredCerts[0]);
          break;
        default:
          resolve(
            filteredCerts.sort((a: any, b: any) =>
              EIMZOUtils.parseValidDate(a.parsedAlias.validto) >
              EIMZOUtils.parseValidDate(b.parsedAlias.validto)
                ? -1
                : 1
            )[0]
          );
      }
    }
  });

export const getAllCertificates = (uid?: string): Promise<Cert[]> =>
  new Promise(async (resolve, reject) => {
    try {
      const { certificates: pfxCerts } = await EIMZOAPI.getAllCertificatesPfx();
      const { certificates: certkeyCerts } =
        await EIMZOAPI.getAllCertificatesCertkey();
      const certs: Cert[] = [
        ...parseData(pfxCerts, "pfx"),
        ...parseData(certkeyCerts, "certkey"),
      ]
        .map((i) => ({
          ...i,
          overdue:
            new Date() >
            dayjs(i?.parsedAlias?.validto || new Date(), "YYYY.MM.DD")
              .add(1, "day")
              .toDate(),
        }))
        .sort((a, b) => a.overdue - b.overdue);
      // store.dispatch(setEimzoError(false));
      if (uid) {
        const foundCerts = certs.filter(
          (cert) =>
            cert.inn === uid || cert.parsedAlias?.["1.2.860.3.16.1.2"] === uid
        );
        resolve(foundCerts);
      } else {
        resolve(certs);
      }
    } catch (error) {
      reject(error);
    }
  });

const auth = async (cert: Cert | null): Promise<AuthError | EIMZOAuth> => {
  try {
    const isMobile = EIMZOUtils.checkUserAgent();
    // Проверяем наличие сертификата для десктопной версии
    if (!isMobile && !cert) {
      return new AuthError(
        "Certificate is required for desktop authentication",
        AuthErrorCode.CERT_REQUIRED
      );
    }
    if (isMobile) {
      try {
        const mobileAuthResponse = await toolsService.mobileAuth();
        const mobileAuth = mobileAuthResponse.data;
        const code = await EIMZOUtils.hash(
          mobileAuth.siteId,
          mobileAuth.documentId,
          mobileAuth.challange
        );
        if (Array.isArray(code)) {
          EIMZOUtils.callDeeplink(code[1]);
          return {
            code: code,
            documentId: mobileAuth.documentId,
            isMobile: true,
          };
        } else {
          return new AuthError(
            "Invalid QR code format",
            AuthErrorCode.MOBILE_QR_INVALID_FORMAT
          );
        }
      } catch (mobileError) {
        return new AuthError(
          `Mobile authentication request failed: ${
            mobileError instanceof Error ? mobileError.message : "Unknown error"
          }`,
          AuthErrorCode.MOBILE_AUTH_FAILED
        );
      }
    } else {
      try {
        const guidResponse = await generateGuid();
        if (!guidResponse || !guidResponse.data) {
          return new AuthError(
            "Failed to generate GUID: Empty response",
            AuthErrorCode.GUID_EMPTY_RESPONSE
          );
        }
        const guid = guidResponse.data;
        if (!guid || !guid.challenge) {
          return new AuthError(
            "Invalid GUID data received",
            AuthErrorCode.GUID_INVALID_DATA
          );
        }

        try {
          if (!cert) {
            return new AuthError(
              "Invalid certificate",
              AuthErrorCode.CERT_KEY_MISSING
            );
          }
          const signature_data = await sign(guid.challenge, cert, false);
          if (!signature_data) {
            return new AuthError(
              "Failed to sign challenge",
              AuthErrorCode.SIGN_CHALLENGE_FAILED
            );
          }

          if (typeof signature_data === "string") {
            return { guid: guid, isMobile: false, pkcs7: signature_data };
          } else {
            return {
              guid: guid,
              isMobile: false,
              pkcs7: signature_data.documentId,
            };
          }
        } catch (signError) {
          return new AuthError(
            `Signing failed: ${
              signError instanceof Error ? signError.message : "Unknown error"
            }`,
            AuthErrorCode.SIGN_CHALLENGE_FAILED
          );
        }
      } catch (guidError) {
        return new AuthError(
          `GUID generation failed: ${
            guidError instanceof Error ? guidError.message : "Unknown error"
          }`,
          AuthErrorCode.GUID_GENERATION_FAILED
        );
      }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return error;
    }
    return new AuthError(
      `Authentication failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      AuthErrorCode.UNKNOWN_ERROR
    );
  }
};

const statusPolling = (documentId: string, successCallback: () => void) => {
  const interval = setInterval(async () => {
    try {
      const { data } = await toolsService.mobileCheckStatus(documentId);
      if (data.status === 1) {
        clearInterval(interval);
        successCallback();
        return;
      } else if (data.status !== 2) {
        clearInterval(interval);
        return;
      }
    } catch (error) {
      clearInterval(interval);
      return;
    }
  }, 1000);
  return () => clearInterval(interval);
};

export const signDesktop = async (
  string: string,
  cert?: any,
  timestampMode: boolean = true
): Promise<string> =>
  new Promise(async (resolve, reject) => {
    if (!cert) {
      try {
        cert = await getCertificate().then((res) => res);
      } catch {
        // showAlert('error', i18n.CheckEimzo);
        return reject();
      }
    }
    try {
      const signature = await getSignature(cert, string, timestampMode);
      resolve(signature);
    } catch {
      reject();
    }
  });

const signMobile = async (
  string: string
): Promise<{ documentId: string; hashCode: string; qrCode: string }> => {
  const signDataResponse = await toolsService.signMobile();
  const signData = signDataResponse.data;
  const code = await EIMZOUtils.hash(
    signData.siteId,
    signData.documentId,
    string
  );
  if (Array.isArray(code)) {
    EIMZOUtils.callDeeplink(code[1]);
    return {
      documentId: signData.documentId,
      hashCode: code[0],
      qrCode: code[1],
    };
  } else {
    throw new AuthError(
      "Invalid Sign QR code format",
      AuthErrorCode.MOBILE_QR_INVALID_FORMAT
    );
  }
};
const sign = async (
  string: string,
  cert?: Cert,
  timestampMode: boolean = true
) => {
  const isMobile = EIMZOUtils.checkUserAgent();
  if (isMobile) {
    const documentId = await signMobile(string ?? "");
    return documentId;
  } else {
    const sign = await signDesktop(string, cert, timestampMode);
    return sign;
  }
};

const splitHash = (hash: string) => {
  const chunkSize = hash.length / 4; // Разделяем на 4 части
  const result: string[] = [];
  for (let i = 0; i < 4; i++) {
    result.push(hash.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  return result;
};

export default {
  attach,
  auth,
  EIMZOUtils,
  getAllCertificates,
  sign,
  splitHash,
  startApi,
  statusPolling,
};
