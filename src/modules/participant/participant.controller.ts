import { Request, Response, NextFunction } from "express";
import { ParticipantService } from "./participant.service";
import { sendSuccess, sendError, sendPaginated } from "@utils/response";

const service = new ParticipantService();

export class ParticipantController {

  // POST /participants/register/partners
  async registerPartners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { person1, person2 } = req.body;
      if (!person1 || !person2) {
        sendError(res, "person1 and person2 are required");
        return;
      }

      const result = await service.registerPartners({ person1, person2 });
      sendSuccess(res, {
        person1: {
          token: result.person1.token,
          participant: { id: result.person1.participant.id, fullName: result.person1.participant.fullName },
        },
        person2: {
          token: result.person2.token,
          participant: { id: result.person2.participant.id, fullName: result.person2.participant.fullName },
        },
      }, "Partners registered successfully. Adjacent seats assigned.", 201);
    } catch (err) {
      next(err);
    }
  }

  // POST /participants/register
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { participant, token } = await service.register(req.body);
      sendSuccess(res, {
        token,
        participant: {
          id: participant.id,
          fullName: participant.fullName,
          categoryId: participant.categoryId,
        },
      }, "Registration successful! Your seat has been reserved.", 201);
    } catch (err) {
      next(err);
    }
  }

  // POST /participants/login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      if (!code) {
        sendError(res, "Access code is required");
        return;
      }

      const { participant, token } = await service.login(code);
      sendSuccess(res, {
        token,
        participant: {
          id: participant.id,
          fullName: participant.fullName,
          categoryId: participant.categoryId,
          seatAssignment: participant.seatAssignment,
          checkIn: participant.checkIn,
        },
      }, "Login successful");
    } catch (err) {
      next(err);
    }
  }

  // GET /participants/me
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await service.getProfile(req.participant!.id);
      sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  }

  // GET /participants  [Admin]
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const categoryId = req.query.categoryId as string | undefined;

      const [items, total] = await service.findAll(page, limit, categoryId);
      sendPaginated(res, items, total, page, limit);
    } catch (err) {
      next(err);
    }
  }
}