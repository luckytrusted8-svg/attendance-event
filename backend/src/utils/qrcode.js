const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

function generateUniqueRegistrationCode() {
  return `REG-${uuidv4().split('-')[0].toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

async function generateQrDataUrl(content) {
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
  });
}

module.exports = { generateUniqueRegistrationCode, generateQrDataUrl };
