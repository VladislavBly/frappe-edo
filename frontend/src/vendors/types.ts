export interface AuthError {
  code: number;
  message: string;
}
export interface BaseAuth {
  isMobile: boolean;
}

export interface Cert {
  inn: string;
  overdue?: boolean;
  parsedAlias?: {
    ['1.2.860.3.16.1.2']?: string;
    cn: string;
    o: string;
    validto: string;
  };
  serialNumber: string;
}

export interface DesktopAuth extends BaseAuth {
  guid: Guid | undefined;
  isMobile: false;
  pkcs7: string | undefined;
}

export type EIMZOAuth = DesktopAuth | MobileAuth;

export interface Guid {
  challenge: string;
  guid: string;
  id_guid: string;
}

export interface MobileAuth extends BaseAuth {
  code: string[];
  documentId: string;
  isMobile: true;
}

export type SignatureCallback<T, E = any> = (
  item: any,
  resolve: (value: PromiseLike<T> | T) => void,
  reject: (reason?: E) => void,
  string: string,
  timestampMode: boolean
) => void;

export interface SignProps {
  cert?: any;
  string: string;
  timestampMode: boolean;
}
