import { Router } from "express";
import * as saarthiController from "../../controllers/saarthi/saarthi.controller.js";

const router = Router();

// initialize a new chat session
router.post("/session", saarthiController.createSession);

// submit the Gate form (Name, Email, etc.)
router.post("/session/:id/gate", saarthiController.submitGate);

// main chat stream (We will build this next!)
router.post("/session/:id/message", saarthiController.streamMessage);

export default router;