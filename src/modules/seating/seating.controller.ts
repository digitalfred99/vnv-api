import { Request, Response, NextFunction } from "express";
import { SeatingService } from "./seating.service";
import { sendSuccess, sendError } from "@utils/response";

const service = new SeatingService();

export class SeatingController {

  // GET /seats
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, tableNumber, isOccupied, isReserved } = req.query;

      const seats = await service.findAll({
        categoryId: categoryId as string | undefined,
        tableNumber: tableNumber ? Number(tableNumber) : undefined,
        isOccupied: isOccupied !== undefined ? isOccupied === "true" : undefined,
        isReserved: isReserved !== undefined ? isReserved === "true" : undefined,
      });

      sendSuccess(res, seats);
    } catch (err) {
      next(err);
    }
  }

  // GET /seats/summary
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await service.getSummary();
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  }

  // GET /seats/:id
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seat = await service.findById(req.params.id);
      if (!seat) {
        sendError(res, "Seat not found", 404);
        return;
      }
      sendSuccess(res, seat);
    } catch (err) {
      next(err);
    }
  }

  // POST /seats/batch
  async createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, numberOfTables, startFromTable } = req.body;
      if (!categoryId || !numberOfTables) {
        sendError(res, "categoryId and numberOfTables are required");
        return;
      }
      if (typeof numberOfTables !== "number" || numberOfTables < 1) {
        sendError(res, "numberOfTables must be a positive number");
        return;
      }

      const seats = await service.createBatch({ categoryId, numberOfTables, startFromTable });
      sendSuccess(res, seats, `Created ${seats.length} seats across ${numberOfTables} tables`, 201);
    } catch (err) {
      next(err);
    }
  }

  // PATCH /seats/:id/reserve
  async toggleReserve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seat = await service.toggleReserve(req.params.id);
      sendSuccess(res, seat, `Seat ${seat.isReserved ? "reserved" : "unreserved"}`);
    } catch (err) {
      next(err);
    }
  }

  // PATCH /seats/reassign
  async reassign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { participantId, seatId } = req.body;
      if (!participantId || !seatId) {
        sendError(res, "participantId and seatId are required");
        return;
      }

      const assignment = await service.reassign(participantId, seatId, req.admin!.id);
      sendSuccess(res, assignment, "Seat reassigned successfully");
    } catch (err) {
      next(err);
    }
  }

  // DELETE /seats/:id
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.delete(req.params.id);
      sendSuccess(res, null, "Seat deleted");
    } catch (err) {
      next(err);
    }
  }
}