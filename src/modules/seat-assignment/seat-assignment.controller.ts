import { Request, Response, NextFunction } from "express";
import { SeatAssignmentService } from "./seat-assignment.service";
import { sendSuccess, sendError } from "@utils/response";

const service = new SeatAssignmentService();

export class SeatAssignmentController {

  // GET /seat-assignments
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const assignments = await service.findAll(categoryId);
      sendSuccess(res, assignments);
    } catch (err) {
      next(err);
    }
  }

  // GET /seat-assignments/participant/:participantId
  async findByParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assignment = await service.findByParticipant(req.params.participantId);
      if (!assignment) {
        sendError(res, "No seat assignment found for this participant", 404);
        return;
      }
      sendSuccess(res, assignment);
    } catch (err) {
      next(err);
    }
  }

  // GET /seat-assignments/seat/:seatId
  async findBySeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assignment = await service.findBySeat(req.params.seatId);
      if (!assignment) {
        sendError(res, "No assignment found for this seat", 404);
        return;
      }
      sendSuccess(res, assignment);
    } catch (err) {
      next(err);
    }
  }
}