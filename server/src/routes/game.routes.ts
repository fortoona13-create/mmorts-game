import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/world', (req, res) => GameController.getWorld(req, res));
router.get('/country/:countryId', (req, res) => GameController.getCountry(req as any, res));
router.get('/my-country', authMiddleware, (req, res) => GameController.getMyCountry(req as any, res));
router.post('/country/create', authMiddleware, (req, res) => GameController.createCountry(req as any, res));
router.get('/region/:regionId', (req, res) => GameController.getRegion(req, res));

export default router;
