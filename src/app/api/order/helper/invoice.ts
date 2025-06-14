export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // last two digits of year
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  const timestamp = `${year}${month}${day}${hour}${minute}${second}`; // 12 chars
  // 4-char random uppercase alphanumeric
  const rand = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  return `INV${timestamp}${rand}`; // e.g. INV230614173045A1B2
}