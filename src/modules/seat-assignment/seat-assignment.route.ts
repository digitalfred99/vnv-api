import { Router } from "express";
import { SeatAssignmentController } from "./seat-assignment.controller";
import { adminAuth } from "@middleware/adminAuth";

const router = Router();
const ctrl = new SeatAssignmentController();

// All read-only — admin only
// Write operations are handled by:
//   POST /api/participants/register     → auto-assigns on registration
//   POST /api/participants/register/partners → assigns adjacent seats
//   PATCH /api/seats/reassign           → manual reassignment by admin

router.use(adminAuth);

router.get("/", (req, res, next) => ctrl.findAll(req, res, next));
router.get("/participant/:participantId", (req, res, next) => ctrl.findByParticipant(req, res, next));
router.get("/seat/:seatId", (req, res, next) => ctrl.findBySeat(req, res, next));

export default router;