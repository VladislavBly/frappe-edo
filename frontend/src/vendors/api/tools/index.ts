import instance from '../instance';

export const getTimestamp = (signatureHex: string) => {
  return instance.post(`/frontend/timestamp/pkcs7`, `${signatureHex}`, {
    headers: {
      'Content-Type': 'text/plain', // указываем тип как текст
    },
  });
};

export const mobileAuth = () => {
  return instance.post(`/frontend/mobile/auth`);
};

export const mobileCheckStatus = (docId: string) => {
  const params = new URLSearchParams();
  params.append('documentId', docId.toString());

  return instance.post(`/frontend/mobile/status`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

export const generateGuid = () => {
  return instance.get('/frontend/challenge');
};

export const signMobile = () => {
  return instance.post(`/frontend/mobile/sign`);
};
