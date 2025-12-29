import crypto from "crypto";

const QR_SECRET = process.env.QR_SECRET as string;

if (!QR_SECRET) {
  throw new Error("QR_SECRET not configured");
}

export interface QRPayload {
  bookingId: string;
  facilityId: string;
  slotType: "MORNING" | "AFTERNOON" | "EVENING";
  validFrom: string; // ISO date string (startDate)
  validTill: string; // ISO date string (endDate)
}

/**
 * Generate signed QR payload
 * Format: CHECKIN::<base64(payload)>::<signature>
 */
export function generateQR(payload: QRPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");

  const signature = crypto
    .createHmac("sha256", QR_SECRET)
    .update(encoded)
    .digest("hex");

  return `CHECKIN::${encoded}::${signature}`;
}

/**
 * Parse + verify QR
 * Validates prefix, decodes payload, verifies HMAC signature
 * Rejects tampered/invalid QR codes
 */
export function parseQR(qrCode: string): QRPayload {
  if (!qrCode.startsWith("CHECKIN::")) {
    throw new Error("INVALID_QR_PREFIX");
  }

  const parts = qrCode.split("::");
  if (parts.length !== 3) {
    throw new Error("INVALID_QR_FORMAT");
  }

  const [, encoded, signature] = parts;

  if (!encoded || !signature) {
    throw new Error("INVALID_QR_FORMAT");
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac("sha256", QR_SECRET)
    .update(encoded)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error("QR_TAMPERED");
  }

  // Decode and parse payload
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64").toString()
    ) as QRPayload;

    // Validate payload structure
    if (
      !payload.bookingId ||
      !payload.facilityId ||
      !payload.slotType ||
      !payload.validFrom ||
      !payload.validTill
    ) {
      throw new Error("INVALID_QR_PAYLOAD");
    }

    return payload;
  } catch (error) {
    throw new Error("INVALID_QR_PAYLOAD");
  }
}
