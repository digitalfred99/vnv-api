import { Request, Response, NextFunction } from "express";
import { AccessCodeService } from "./access-code.service";
import { sendSuccess, sendError, sendPaginated } from "@utils/response";

const service = new AccessCodeService();

export class AccessCodeController {

  // POST /access-codes/validate
  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      if (!code) {
        sendError(res, "Access code is required");
        return;
      }

      const result = await service.validateCode(code);
      if (!result.valid) {
        sendError(res, result.reason!, 400);
        return;
      }

      sendSuccess(res, {
        code: result.accessCode!.code,
        category: result.accessCode!.category,
      }, "Code is valid. Proceed with registration.");
    } catch (err) {
      next(err);
    }
  }

  // POST /access-codes/generate  [Admin]
  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, count } = req.body;

      if (!categoryId) {
        sendError(res, "categoryId is required");
        return;
      }
      if (!count || typeof count !== "number" || count < 1 || count > 200) {
        sendError(res, "count must be a number between 1 and 200");
        return;
      }

      const codes = await service.generateBatch(categoryId, count);
      sendSuccess(res, codes, `Generated ${codes.length} access codes`, 201);
    } catch (err) {
      next(err);
    }
  }

  // PATCH /access-codes/:code/sell  [Admin]
  // POST  /access-codes/scan-sell   [Admin] — same method, code from body
  async markAsSold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.params.code ?? req.body.code;
      if (!code) {
        sendError(res, "Code is required");
        return;
      }

      const updated = await service.markAsSold(code);
      sendSuccess(res, updated, "Code marked as sold");
    } catch (err) {
      next(err);
    }
  }

  // GET /access-codes  [Admin]
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const { categoryId, isSold, isUsed } = req.query;

      const [items, total] = await service.findAll({
        categoryId: categoryId as string | undefined,
        isSold: isSold !== undefined ? isSold === "true" : undefined,
        isUsed: isUsed !== undefined ? isUsed === "true" : undefined,
        page,
        limit,
      });

      sendPaginated(res, items, total, page, limit);
    } catch (err) {
      next(err);
    }
  }
}