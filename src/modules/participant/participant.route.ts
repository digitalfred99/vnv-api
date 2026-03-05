import { Router } from "express";
import { ParticipantController } from "./participant.controller";
import { participantAuth } from "@middleware/participantAuth";
import { adminAuth } from "@middleware/adminAuth";

const router = Router();
const ctrl = new ParticipantController();

// Public
router.post("/register/partners", (req, res, next) => ctrl.registerPartners(req, res, next));
router.post("/register", (req, res, next) => ctrl.register(req, res, next));
router.post("/login", (req, res, next) => ctrl.login(req, res, next));

// Participant protected
router.get("/me", participantAuth, (req, res, next) => ctrl.getProfile(req, res, next));

// Admin protected
router.get("/", adminAuth, (req, res, next) => ctrl.findAll(req, res, next));

export default router;