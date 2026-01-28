export enum AuthErrorCode {
  // Ошибки API (1400-1499)
  API_ERROR = 1400,
  API_NOT_FOUND = 1404,
  API_SERVER_ERROR = 1500,

  API_UNAUTHORIZED = 1403,
  API_VALIDATION_ERROR = 1401,
  CERT_EXPIRED = 1102,
  CERT_INVALID = 1101,
  CERT_KEY_MISSING = 1104,

  // Ошибки сертификатов (1100-1199)
  CERT_REQUIRED = 1100,
  CERT_REVOKED = 1103,
  // Ошибки десктопной аутентификации (1300-1399)
  DESKTOP_AUTH_FAILED = 1300,
  GUID_EMPTY_RESPONSE = 1311,
  GUID_GENERATION_FAILED = 1310,
  GUID_INVALID_DATA = 1312,

  // Ошибки мобильной аутентификации (1200-1299)
  MOBILE_AUTH_FAILED = 1200,
  MOBILE_EMPTY_RESPONSE = 1201,
  MOBILE_HASH_FAILED = 1220,
  MOBILE_INVALID_DATA = 1202,
  MOBILE_QR_GENERATION_FAILED = 1210,

  MOBILE_QR_INVALID_FORMAT = 1211,
  NETWORK_ERROR = 1001,
  SIGN_CHALLENGE_FAILED = 1320,
  TIMEOUT_ERROR = 1002,
  // Базовые коды ошибок (1000-1099)
  UNKNOWN_ERROR = 1000,
}

// Модифицированный класс ошибки
class AuthError extends Error {
  code: AuthErrorCode;

  constructor(message: string, code: AuthErrorCode) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export default AuthError;
