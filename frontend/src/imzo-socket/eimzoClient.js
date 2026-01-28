import { CAPIWS } from '.';

const GetPluginSettings = async (baseUrl) => {
  const settingData = await fetch(
    `${baseUrl}/rest/plugin-settings/1.0/plugin-settings/get-settings`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    },
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error('Ошибка запроса: ' + response.status);
      }
      return response.json();
    })
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.error('Ошибка:', error);
    });
  return settingData;
   
};

export const AppLoad = async () => {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const data = await GetPluginSettings(baseUrl);
  const domain = String(data?.domain).split('//');
  const apiKey = data?.apiKey;

  const apiKeysList = [
    'localhost',
    '96D0C1491615C82B9A54D9989779DF825B690748224C2B04F500F370D51827CE2644D8D4A82C18184D73AB8530BB8ED537269603F61DB0D03D2104ABF789970B',
    '127.0.0.1',
    'A7BCFA5D490B351BE0754130DF03A068F855DB4333D43921125B9CF2670EF6A40370C646B90401955E1F7BC9CDBF59CE0B2C5467D820BE189C845D0B79CFC96F',
    'null',
    'E0A205EC4E7B78BBB56AFF83A733A1BB9FD39D562E67978CC5E7D73B0951DB1954595A20672A63332535E13CC6EC1E1FC8857BB09E0855D7E76E411B6FA16E9D',
    'dls.yt.uz',
    'EDC1D4AB5B02066FB3FEB9382DE6A7F8CBD095E46474B07568BC44C8DAE27B3893E75B79280EA82A38AD42D10EA0D600E6CE7E89D1629221E4363E2D78650516',
    `${domain[1]}`,
    `${apiKey}`,
  ];

  CAPIWS.apikey(apiKeysList);
};
