import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "@config/data-source";
import { Admin } from "@entities/Admin";
import { AdminRole } from "@entities/enums";
import { verifyAdminToken } from "@utils/jwt";
import { sendError } from "@utils/response";

export const adminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      sendError(res, "Admin authentication required", 401);
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAdminToken(token);

    const repo = AppDataSource.getRepository(Admin);
    const admin = await repo.findOne({ where: { id: payload.adminId } });

    if (!admin || !admin.isActive) {
      sendError(res, "Admin account not found or inactive", 401);
      return;
    }

    req.admin = admin;
    next();
  } catch {
    sendError(res, "Invalid or expired admin token", 401);
  }
};

// Factory: restrict route to specific roles
export const requireRole = (...roles: AdminRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      sendError(res, "Insufficient permissions", 403);
      return;
    }
    next();
  };
};
