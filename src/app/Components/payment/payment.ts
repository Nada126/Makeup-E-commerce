import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StripeService } from '../../Services/stripe.service';

@Component({
  selector: 'app-payment',
  imports: [CommonModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent implements OnInit, AfterViewInit {
  stripe: any;
  elements: any;
  cardElement: any;
  isProcessing = false;
  paymentError: string | null = null;
  paymentSuccess = false;

  constructor(private stripeService: StripeService) {}

  async ngOnInit() {
    this.stripe = await this.stripeService.getStripe();
  }

  ngAfterViewInit() {
    if (this.stripe) {
      this.initializeStripeElements();
    }
  }

  private initializeStripeElements() {
    const elements = this.stripe.elements();
    const style = {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };

    this.cardElement = elements.create('card', { style });
    this.cardElement.mount('#card-element');
  }

  async onSubmit() {
    if (!this.stripe || !this.cardElement) return;

    this.isProcessing = true;
    this.paymentError = null;

    try {
      // Create payment intent (simulate for now)
      const clientSecret = await this.stripeService.createPaymentIntent(1000); // $10.00

      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.cardElement,
        }
      });

      if (result.error) {
        this.paymentError = result.error.message;
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          this.paymentSuccess = true;
        }
      }
    } catch (error) {
      this.paymentError = 'An error occurred during payment processing.';
    }

    this.isProcessing = false;
  }
}
