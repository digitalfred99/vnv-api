import jwt, { SignOptions } from "jsonwebtoken";
import { ParticipantJwtPayload, AdminJwtPayload } from "@types-local/index";

// ── Participant (code-based) ───────────────────────────────────
export const signParticipantToken = (
  payload: ParticipantJwtPayload
): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, process.env.JWT_SECRET!, options);
};

export const verifyParticipantToken = (
  token: string
): ParticipantJwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as ParticipantJwtPayload;
};

// ── Admin (email/password) ─────────────────────────────────────
export const signAdminToken = (payload: AdminJwtPayload): string => {
  const options: SignOptions = {
    expiresIn: (process.env.ADMIN_JWT_EXPIRES_IN || "8h") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, process.env.ADMIN_JWT_SECRET!, options);
};

export const verifyAdminToken = (token: string): AdminJwtPayload => {
  return jwt.verify(
    token,
    process.env.ADMIN_JWT_SECRET!
  ) as AdminJwtPayload;
};