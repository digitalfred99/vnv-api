import { Request, Response, NextFunction } from "express";
import { CheckInService } from "./checkin.service";
import { CheckInMethod } from "@entities/enums";
import { sendSuccess, sendError } from "@utils/response";

const service = new CheckInService();

export class CheckInController {

  // POST /checkin
  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, method, notes } = req.body;

      if (!code) {
        sendError(res, "Access code is required");
        return;
      }

      const { checkIn, alreadyCheckedIn } = await service.checkIn({
        code,
        adminId: req.admin!.id,
        method: method as CheckInMethod | undefined,
        notes,
      });

      if (alreadyCheckedIn) {
        sendSuccess(res, {
          alreadyCheckedIn: true,
          checkIn,
        }, `⚠️ Already checked in at ${checkIn.checkedInAt.toLocaleTimeString()}. Seat: ${checkIn.participant?.seatAssignment?.seat?.seatNumber ?? "N/A"}`);
        return;
      }

      sendSuccess(res, {
        alreadyCheckedIn: false,
        checkIn,
      }, `✅ Checked in. Seat: ${checkIn.participant?.seatAssignment?.seat?.seatNumber ?? "N/A"}`, 201);
    } catch (err) {
      next(err);
    }
  }

  // GET /checkin
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const checkIns = await service.findAll(categoryId);
      sendSuccess(res, checkIns);
    } catch (err) {
      next(err);
    }
  }

  // GET /checkin/stats
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await service.getStats();
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }

  // GET /checkin/participant/:participantId
  async findByParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const checkIn = await service.findByParticipant(req.params.participantId);
      if (!checkIn) {
        sendError(res, "No check-in record found for this participant", 404);
        return;
      }
      sendSuccess(res, checkIn);
    } catch (err) {
      next(err);
    }
  }
}