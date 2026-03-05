import { Router } from "express";
import { CheckInController } from "./checkin.controller";
import { adminAuth, requireRole } from "@middleware/adminAuth";
import { AdminRole } from "@entities/enums";

const router = Router();
const ctrl = new CheckInController();

router.use(adminAuth);

router.post("/", (req, res, next) => ctrl.checkIn(req, res, next));
router.get("/", (req, res, next) => ctrl.findAll(req, res, next));

// ✅ FIXED: /stats must come BEFORE /:participantId
// Previously /stats was being caught by the :participantId param route
router.get(
  "/stats",
  requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
  (req, res, next) => ctrl.getStats(req, res, next)
);
router.get("/participant/:participantId", (req, res, next) => ctrl.findByParticipant(req, res, next));

export default router;