import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise: Promise<Stripe | null>;

  constructor() {
    // Use test publishable key
    this.stripePromise = loadStripe('pk_test_51SKXlmRZ4IArbYrenlcFqyhurW3JHytZwfeNSOulkTIsemsOMaY8E1mRruDfLmeO1ulbgU54eQ9ejJ3NRV8HWt3F00d6K6hPiP'); // Replace with actual test key
  }

  getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<string> {
    // This should be called from your backend in production
    // For now, we'll simulate it
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency }),
    });

    const data = await response.json();
    return data.clientSecret;
  }
}
