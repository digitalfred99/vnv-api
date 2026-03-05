import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";
import { sendSuccess, sendError } from "@utils/response";
import { AdminRole } from "@entities/enums";

const service = new AdminService();

export class AdminController {

  // POST /admin/login  — public
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        sendError(res, "Email and password are required");
        return;
      }

      const { admin, token } = await service.login(email, password);
      sendSuccess(res, {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      }, "Login successful");
    } catch (err) {
      next(err);
    }
  }

  // GET /admin/me  — own profile
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await service.findById(req.admin!.id);
      if (!admin) {
        sendError(res, "Admin not found", 404);
        return;
      }
      const { passwordHash, ...safeAdmin } = admin;
      sendSuccess(res, safeAdmin);
    } catch (err) {
      next(err);
    }
  }

  // GET /admin  — list all [SUPER_ADMIN]
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admins = await service.findAll();
      const safe = admins.map(({ passwordHash, ...a }) => a);
      sendSuccess(res, safe);
    } catch (err) {
      next(err);
    }
  }

  // GET /admin/:id  — single [SUPER_ADMIN]
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await service.findById(req.params.id);
      if (!admin) {
        sendError(res, "Admin not found", 404);
        return;
      }
      const { passwordHash, ...safeAdmin } = admin;
      sendSuccess(res, safeAdmin);
    } catch (err) {
      next(err);
    }
  }

  // POST /admin  — create [SUPER_ADMIN]
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        sendError(res, "name, email and password are required");
        return;
      }

      const admin = await service.create({
        name,
        email,
        password,
        role: role ?? AdminRole.STAFF,
      });

      const { passwordHash, ...safeAdmin } = admin;
      sendSuccess(res, safeAdmin, "Admin created", 201);
    } catch (err) {
      next(err);
    }
  }

  // PATCH /admin/:id  — update name or role [SUPER_ADMIN]
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await service.update(req.params.id, req.body);
      const { passwordHash, ...safeAdmin } = admin;
      sendSuccess(res, safeAdmin, "Admin updated");
    } catch (err) {
      next(err);
    }
  }

  // PATCH /admin/:id/toggle  — activate or deactivate [SUPER_ADMIN]
  async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await service.toggleActive(req.params.id);
      sendSuccess(res, { isActive: admin.isActive },
        `Admin ${admin.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      next(err);
    }
  }

  // PATCH /admin/me/password  — change own password
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        sendError(res, "oldPassword and newPassword are required");
        return;
      }
      if (newPassword.length < 8) {
        sendError(res, "New password must be at least 8 characters");
        return;
      }

      await service.changePassword(req.admin!.id, oldPassword, newPassword);
      sendSuccess(res, null, "Password changed successfully");
    } catch (err) {
      next(err);
    }
  }

  // DELETE /admin/:id  — delete [SUPER_ADMIN]
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Prevent self-deletion
      if (req.params.id === req.admin!.id) {
        sendError(res, "You cannot delete your own account", 400);
        return;
      }
      await service.delete(req.params.id);
      sendSuccess(res, null, "Admin deleted");
    } catch (err) {
      next(err);
    }
  }
}