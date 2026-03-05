import { Router } from "express";
import { SeatingController } from "./seating.controller";
import { adminAuth, requireRole } from "@middleware/adminAuth";
import { AdminRole } from "@entities/enums";

const router = Router();
const ctrl = new SeatingController();

// All seat routes are admin-only
router.use(adminAuth);

// ── Read ──────────────────────────────────────────────────────
router.get("/", (req, res, next) => ctrl.findAll(req, res, next));
router.get("/summary", (req, res, next) => ctrl.getSummary(req, res, next));
router.get("/:id", (req, res, next) => ctrl.findById(req, res, next));

// ── Write (ADMIN+) ────────────────────────────────────────────
router.post(
  "/batch",
  requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.createBatch(req, res, next)
);

router.patch(
  "/reassign",
  requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.reassign(req, res, next)
);

router.patch(
  "/:id/reserve",
  requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.toggleReserve(req, res, next)
);

router.delete(
  "/:id",
  requireRole(AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.delete(req, res, next)
);

export default router;