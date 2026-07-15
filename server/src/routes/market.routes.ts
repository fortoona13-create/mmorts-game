import { Router } from 'express';
import { MarketController } from '../controllers/market.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/prices', (req, res) => MarketController.getPrices(req, res));
router.get('/orders', (req, res) => MarketController.getOrders(req, res));
router.post('/order', authMiddleware, (req, res) => MarketController.createOrder(req as any, res));
router.post('/buy', authMiddleware, (req, res) => MarketController.buyFromOrder(req as any, res));

export default router;
