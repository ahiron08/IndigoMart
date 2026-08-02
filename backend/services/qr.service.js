import QRCode from 'qrcode';

const buildUpiDeepLink = ({ upiId, payeeName, amount, orderNumber, note }) => {
  const params = new URLSearchParams({
    pa: upiId,          // Payee address (UPI ID)
    pn: payeeName,      // Payee name
    am: amount.toFixed(2),  // Amount
    cu: 'INR',          // Currency
    tn: note || `Order ${orderNumber}`,
  });

  if (orderNumber) {
    params.append('tr', orderNumber); // Transaction reference
  }

  return `upi://pay?${params.toString()}`;
};

export const generateUpiQrCode = async ({ upiId, payeeName, amount, orderNumber, note, width = 300 }) => {
  const deepLink = buildUpiDeepLink({ upiId, payeeName, amount, orderNumber, note });
  const dataUrl = await QRCode.toDataURL(deepLink, {
    width,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#211f3d', light: '#ffffff' },
  });
  return { dataUrl, deepLink };
};

export default { generateUpiQrCode };