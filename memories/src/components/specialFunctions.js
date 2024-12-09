import config from '../config.json';
import CryptoJS from "crypto-js";

const encryptAppCode = config.encryptAppCode;

export function Encrypt(uid) {
  let encryptedCode = CryptoJS.AES.encrypt(uid, encryptAppCode).toString();
  let encryptedCodeBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encryptedCode));

  return encryptedCodeBase64;
}

export function DeCrypt(encryptedCode) {
  let stillEncryptedCode = CryptoJS.enc.Base64.parse(encryptedCode).toString(CryptoJS.enc.Utf8);

  let bytes = CryptoJS.AES.decrypt(stillEncryptedCode, encryptAppCode);
  let deCryptedCode = bytes.toString(CryptoJS.enc.Utf8);

  return deCryptedCode;
}

export function format(hourDate) {
  let time = new Date(hourDate);

  let day = time.getDate();
  let month = time.getMonth() + 1;
  let hour = time.getHours();
  let min = time.getMinutes();

  time = `${day}/${month} ${hour}:${min}`;

  return time;
}

export const selectCustomStyles = {
  control: (provided, state) => ({
    ...provided,
    width: '60vw',
    border: 'none',
    boxShadow: state.isFocused ? null : null,
    '&:hover': {
      border: state.isFocused ? null : null,
    },
  }),

  menu: (provided) => ({
    ...provided,
    width: '60vw',
    backgroundColor: 'rgba(0,0,0,0)',
    border: 'none',
  }),

  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#fdcae1' : 'rgba(255,255,255,1)',
    color: 'black',
    '&:hover': {
      backgroundColor: state.isSelected ? '#e78db6' : '#e78db6',
      color: 'black',
    },
  }),

  indicatorSeparator: () => ({
    color: 'none',
  }),

  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#e78db6' : '#fdcae1',
    '&:hover': {
      color: '#e78db6',
    },
    transform: state.isFocused ? 'rotate(0deg)' : 'rotate(270deg)',
  }),
};

export const selectOptions = [
  { value: 'cronologico', label: 'Cronológico' },
  { value: 'ultima', label: 'Última a Primera' },
  { value: 'pov', label: 'POV' },
  { value: 'likes', label: 'Likes' },
];

export const toastOptions = () => ({
  containerStyle: {
    position: 'fixed',
    top: '11vh',
    zIndex: '9999',
  },
  toastOptions: {
    success: {
      style: {
        background: '#B4EEB4',
        color: '#2E8B57',
        fontSize: '2ch'
      },
      icon: <CustomSuccessIcon />,
    },
    error: {
      style: {
        background: '#FFFACD',
        color: '#DAA520',
        fontSize: '2ch',
      },
      icon: <CustomErrorIcon />,

    },
  },
  reverseOrder: true,
});

const CustomErrorIcon = () => (
  <div style={{ fontSize: '2em', color: 'yellow' }}>⛔</div>
);

const CustomSuccessIcon = () => (
  <div style={{ fontSize: '2em', color: 'yellow' }}>🌺</div>
);

