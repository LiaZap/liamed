import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialize Stripe with secret key from env
// Removed strict apiVersion to avoid mismatch with installed types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    // apiVersion: '2024-12-18.acacia', 
});

const PRICE_IDS = {
    PRO: process.env.STRIPE_PRICE_ID_PRO || '',
    ENTERPRISE: process.env.STRIPE_PRICE_ID_ENTERPRISE || ''
};

export const paymentController = {
    // Create Checkout Session
    createCheckoutSession: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            const userEmail = (req as any).user?.email;
            const { plan } = req.body; // 'PRO' or 'ENTERPRISE'

            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const priceId = plan === 'PRO' ? PRICE_IDS.PRO : plan === 'ENTERPRISE' ? PRICE_IDS.ENTERPRISE : null;

            if (!priceId) {
                return res.status(400).json({ error: 'Invalid plan selected' });
            }

            // Find user to check field
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { subscriptions: true }
            });

            if (!user) return res.status(404).json({ error: 'User not found' });

            // Create session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/planos?success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/planos?canceled=true`,
                customer_email: user.email,
                metadata: {
                    userId: userId,
                    plan: plan
                }
            });

            res.json({ url: session.url });

        } catch (error) {
            console.error('Error creating checkout session:', error);
            res.status(500).json({ error: 'Failed to create checkout session' });
        }
    },

    // Webhook Handler
    handleWebhook: async (req: Request, res: Response) => {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            if (!sig || !endpointSecret) throw new Error('Missing signature or secret');
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err: any) {
            console.error(`Webhook Error: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            case 'invoice.payment_succeeded':
                // Cast to any to access properties that might differ in strict types
                const invoice = event.data.object as any;
                await handleInvoicePaid(invoice);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    }
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (!session.metadata?.userId) return;

    const { userId, plan } = session.metadata;

    const dbPlan = await prisma.plan.findFirst({
        where: { name: plan }
    });

    console.log(`Checkout completed for user ${userId} plan ${plan}`);

    if (dbPlan) {
        await prisma.subscription.create({
            data: {
                userId: userId,
                planId: dbPlan.id,
                stripeSubscriptionId: session.subscription as string,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1))
            }
        });
    }
}

async function handleInvoicePaid(invoice: any) {
    if (invoice.subscription) {
        const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: invoice.subscription as string }
        });

        if (subscription) {
            await prisma.invoice.create({
                data: {
                    subscriptionId: subscription.id,
                    amount: (invoice.amount_paid / 100),
                    status: 'PAID',
                    dueDate: new Date(invoice.due_date ? invoice.due_date * 1000 : Date.now()),
                    paidAt: new Date(),
                    stripeInvoiceId: invoice.id,
                    pdfUrl: invoice.hosted_invoice_url
                }
            });
        }
    }
}
