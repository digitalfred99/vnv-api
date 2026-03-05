import { Router } from "express";
import { adminAuth, requireRole } from "@middleware/adminAuth";
import { AdminRole } from "@entities/enums";
import { CategoryController } from "@modules/category/category.controller";

const router = Router();
const ctrl = new CategoryController();

// Public — registration page needs categories
router.get("/", (req, res, next) => ctrl.getAll(req, res, next));
router.get("/:id", (req, res, next) => ctrl.getById(req, res, next));

// Admin only
router.post(
  "/",
  adminAuth,
  requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.create(req, res, next)
);

router.patch(
  "/:id",
  adminAuth,
  requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.update(req, res, next)
);

router.delete(
  "/:id",
  adminAuth,
  requireRole(AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.delete(req, res, next)
);

export default router;