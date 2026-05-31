import { createHmac, timingSafeEqual } from "crypto";

export function signPayload(secret: string, timestamp: string, nonce: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}${nonce}${body}`).digest("hex");
}

export function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
