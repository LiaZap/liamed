import Stripe from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    // apiVersion: '2024-12-18.acacia',
});

async function getPrices() {
    const products = {
        'PRO': 'prod_TfzPZyjtHXgnmA',
        'ENTERPRISE': 'prod_TfzQDJBOGiZdhh'
    };

    console.log("Fetching prices...");

    for (const [name, prodId] of Object.entries(products)) {
        try {
            const prices = await stripe.prices.list({
                product: prodId,
                active: true,
                limit: 1
            });

            if (prices.data.length > 0) {
                console.log(`${name}_PRICE_ID: ${prices.data[0].id}`);
            } else {
                console.log(`No price found for ${name} (${prodId})`);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(`Error fetching ${name}: ${error.message}`);
        }
    }
}

getPrices();
