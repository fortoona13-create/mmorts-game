import { Router } from 'express';
import { MilitaryController } from '../controllers/military.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/defense/:regionId', (req, res) => MilitaryController.getRegionDefense(req, res));
router.post('/drone', authMiddleware, (req, res) => MilitaryController.launchDroneStrike(req as any, res));
router.post('/attack', authMiddleware, (req, res) => MilitaryController.attackRegion(req as any, res));
router.get('/battles', (req, res) => MilitaryController.getBattleHistory(req, res));
router.post('/pvo/upgrade', authMiddleware, (req, res) => MilitaryController.upgradePVO(req as any, res));

export default router;
