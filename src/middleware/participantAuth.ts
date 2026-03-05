import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "@config/data-source";
import { Participant } from "@entities/Participant";
import { verifyParticipantToken } from "@utils/jwt";
import { sendError } from "@utils/response";

export const participantAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      sendError(res, "Authentication required", 401);
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyParticipantToken(token);

    const repo = AppDataSource.getRepository(Participant);
    const participant = await repo.findOne({
      where: { id: payload.participantId },
      relations: ["accessCode", "seatAssignment", "checkIn"],
    });

    if (!participant) {
      sendError(res, "Participant not found", 401);
      return;
    }

    // Validate session token matches (allows forced logout)
    if (participant.sessionToken !== token) {
      sendError(res, "Session expired. Please log in again.", 401);
      return;
    }

    if (
      participant.sessionExpiresAt &&
      participant.sessionExpiresAt < new Date()
    ) {
      sendError(res, "Session expired. Please log in again.", 401);
      return;
    }

    req.participant = participant;
    next();
  } catch {
    sendError(res, "Invalid or expired token", 401);
  }
};
