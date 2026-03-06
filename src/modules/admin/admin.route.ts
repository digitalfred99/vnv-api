import { Router } from "express";
import { AdminController } from "./admin.controller";
import { adminAuth, requireRole } from "@middleware/adminAuth";
import { AdminRole } from "@entities/enums";

const router = Router();
const ctrl = new AdminController();

// ── Public ────────────────────────────────────────────────────
router.post("/login", (req, res, next) => ctrl.login(req, res, next));

// ── Bootstrap (REMOVE AFTER FIRST DEPLOY) ────────────────────
router.post("/bootstrap", (req, res, next) => ctrl.create(req, res, next));

// ── Authenticated (any admin) ─────────────────────────────────
router.get("/me", adminAuth, (req, res, next) => ctrl.getMe(req, res, next));
router.patch("/me/password", adminAuth, (req, res, next) => ctrl.changePassword(req, res, next));

// ── SUPER_ADMIN only ──────────────────────────────────────────
router.get(
  "/",
  adminAuth,
  requireRole(AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.findAll(req, res, next)
);

router.get(
  "/:id",
  adminAuth,
  requireRole(AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.findById(req, res, next)
);

router.post(
  "/",
  adminAuth,
  requireRole(AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.create(req, res, next)
);

router.patch(
  "/:id",
  adminAuth,
  requireRole(AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.update(req, res, next)
);

router.patch(
  "/:id/toggle",
  adminAuth,
  requireRole(AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.toggleActive(req, res, next)
);

router.delete(
  "/:id",
  adminAuth,
  requireRole(AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.delete(req, res, next)
);

export default router;