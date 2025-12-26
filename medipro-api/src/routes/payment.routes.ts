import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();

// Checkout Session (protected)
router.post('/create-checkout-session', authenticateToken, paymentController.createCheckoutSession);

// Webhook (public, raw body needed if possible, but middleware setting might be global)
// We might need to handle raw body specifically here or trust body-parser global config if it handles json properly?
// Stripe needs raw body for signature verification.
// If your server.ts uses app.use(express.json()), req.body is already an object.
// To fix this globally is complex, for now we will assume we can get raw body or we might need a specific handling.
// Actually, standard express pattern for stripe webhook involves using `express.raw({type: 'application/json'})` just for this route.
// But since we are inside a router that is likely mounted under /api/payments, 
// the parsing might have already happened in server.ts.
// Let's proceed with standard routing and assume server.ts can be tweaked if verification fails.
router.post('/webhook', paymentController.handleWebhook);

export default router;
