export function parseQR(qrCode: string) {
  // Example QR: QR-<bookingId>
  if (!qrCode.startsWith("QR-")) {
    throw new Error("INVALID_QR");
  }

  return qrCode.replace("QR-", "");
}
