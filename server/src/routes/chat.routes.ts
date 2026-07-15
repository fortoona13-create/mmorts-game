import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/global', (req, res) => ChatController.getGlobalChat(req, res));
router.post('/message', authMiddleware, (req, res) => ChatController.sendMessage(req as any, res));
router.post('/alliance/create', authMiddleware, (req, res) => ChatController.createAlliance(req as any, res));
router.post('/alliance/join', authMiddleware, (req, res) => ChatController.joinAlliance(req as any, res));
router.get('/alliances', (req, res) => ChatController.getAlliances(req, res));

export default router;
