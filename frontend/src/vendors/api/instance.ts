import axios from 'axios';

const getBaseUrl = () => {
  switch (window.location.hostname) {
    default:
      return process.env.REACT_APP_API_URL;
  }
};

const instance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Accept': '*/*',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default instance;
