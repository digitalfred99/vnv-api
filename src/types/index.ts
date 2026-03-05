import { Participant } from "@entities/Participant";
import { Admin } from "@entities/Admin";

// ── Standard API Response Envelope ────────────────────────────
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Express Request Augmentation ──────────────────────────────
declare global {
  namespace Express {
    interface Request {
      participant?: Participant;
      admin?: Admin;
    }
  }
}

// ── JWT Payloads ──────────────────────────────────────────────
export interface ParticipantJwtPayload {
  participantId: string;
  accessCode: string;
  categoryId: string;
}

export interface AdminJwtPayload {
  adminId: string;
  role: string;
}
