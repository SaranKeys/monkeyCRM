import { Router } from "express";
import * as adminSaarthiController from "../../controllers/saarthi/admin.saarthi.controller.js";
import * as adminConfigController from "../../controllers/saarthi/admin.config.controller.js";

const router = Router();

router.get("/conversations", adminSaarthiController.getConversations);

router.get("/conversations/:sessionId", adminSaarthiController.getConversationDetail);

// change persona of ai
router.get("/persona", adminConfigController.getPersona);
router.post("/persona/draft", adminConfigController.savePersonaDraft);
router.post("/persona/publish", adminConfigController.publishPersona);
router.delete("/persona/draft/:id", adminConfigController.deletePersonaDraft);

// takeover
router.post("/conversations/:sessionId/takeover", adminSaarthiController.takeOverConversation);
router.post("/conversations/:sessionId/message", adminSaarthiController.sendAdminMessage);

// nuke chat
router.delete("/conversations/:sessionId/purge", adminSaarthiController.purgeConversation);

export default router;



 