import { Router } from "express";
import { AccessCodeController } from "./access-code.controller";
import { adminAuth, requireRole } from "@middleware/adminAuth";
import { AdminRole } from "@entities/enums";

const router = Router();
const ctrl = new AccessCodeController();

// Public — used on registration page before form loads
router.post("/validate", (req, res, next) => ctrl.validate(req, res, next));

// Admin only
router.get("/", adminAuth, (req, res, next) => ctrl.findAll(req, res, next));

router.post(
  "/generate",
  adminAuth,
  requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.generate(req, res, next)
);

// Scan flow — code in body (QR scanner posts here)
router.post(
  "/scan-sell",
  adminAuth,
  (req, res, next) => ctrl.markAsSold(req, res, next)
);

// Manual flow — code in URL param
router.patch(
  "/:code/sell",
  adminAuth,
  (req, res, next) => ctrl.markAsSold(req, res, next)
);

export default router;