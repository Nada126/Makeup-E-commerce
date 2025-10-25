import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../Services/cart-service';
import { loadStripe } from '@stripe/stripe-js';
import Swal from 'sweetalert2';

// Replace with your test publishable key from Stripe dashboard
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_test_publishable_key_here';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.css']
})
export class Payment implements OnInit {
  private stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

  checkoutForm!: FormGroup;
  paymentForm!: FormGroup;

  items: any[] = [];
  subtotal = 0;
  tax = 0;
  shipping = 0;
  total = 0;

  // config: tax rate and shipping rule
  readonly TAX_RATE = 0.14;
  readonly SHIPPING_THRESHOLD = 50;
  readonly SHIPPING_FEE = 5;

  orderPlaced = false;
  orderId: string | null = null;
  processing = false;
  message = '';
  paymentProcessing = false;

  // Test card options for demo
  testCards = [
    { number: '4242424242424242', name: 'Visa (Success)' },
    { number: '4000002500003155', name: 'Visa (Authentication Required)' },
    { number: '4000000000009995', name: 'Visa (Declined)' }
  ];

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cartService = inject(CartService);

  ngOnInit(): void {
    this.initializeForms();
    this.loadCartData();
    this.setupCartSubscription();
  }

  private initializeForms(): void {
    // Customer information form
    this.checkoutForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]]
    });

    // Payment form
    this.paymentForm = this.fb.group({
      cardNumber: ['4242424242424242', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryDate: ['12/28', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)]],
      cvc: ['123', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      cardName: ['', [Validators.required]]
    });
  }

  private loadCartData(): void {
    const nav = (this.router as any).getCurrentNavigation ? (this.router as any).getCurrentNavigation() : null;
    const stateItems = nav?.extras?.state?.items ?? (history && (history.state as any)?.items);
    const stateTotal = nav?.extras?.state?.total ?? (history && (history.state as any)?.total);

    if (Array.isArray(stateItems) && stateItems.length > 0) {
      this.items = stateItems;
      this.subtotal = Number(stateTotal) || this.calcSubtotalFromItems();
    } else {
      this.items = this.cartService.getItems();
      this.subtotal = this.calcSubtotalFromItems();
    }

    this.calculateTotals();
  }

  private setupCartSubscription(): void {
    this.cartService.items$.subscribe(items => {
      this.items = items || [];
      this.subtotal = this.calcSubtotalFromItems();
      this.calculateTotals();
    });
  }

  calcSubtotalFromItems(): number {
    return (this.items || []).reduce((s, it) => s + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
  }

  calculateTotals() {
    this.tax = Math.round(this.subtotal * this.TAX_RATE * 100) / 100;
    this.shipping = this.subtotal >= this.SHIPPING_THRESHOLD ? 0 : this.SHIPPING_FEE;
    this.total = Math.round((this.subtotal + this.tax + this.shipping) * 100) / 100;
  }

  // Safe form control accessors
  getFormControl(form: FormGroup, controlName: string): AbstractControl {
    return form.get(controlName) as AbstractControl;
  }

  // Check if form control is invalid and touched
  isFieldInvalid(form: FormGroup, controlName: string): boolean {
    const control = this.getFormControl(form, controlName);
    return control.invalid && control.touched;
  }

  // Select test card
  selectTestCard(cardNumber: string): void {
    this.paymentForm.patchValue({
      cardNumber: cardNumber
    });
  }

  // Process payment with Stripe
  async processPayment() {
    if (this.checkoutForm.invalid || this.paymentForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.paymentForm.markAllAsTouched();

      await Swal.fire({
        icon: 'error',
        title: 'Form Incomplete',
        text: 'Please fill all required fields correctly.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (!this.items || this.items.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Your cart is empty.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    this.paymentProcessing = true;

    try {
      // Show processing alert
      Swal.fire({
        title: 'Processing Payment',
        text: 'Please wait while we process your payment...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Simulate Stripe payment
      await this.simulateStripePayment();

      // If successful, place the order
      await this.placeOrder();

    } catch (error) {
      console.error('Payment error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: 'There was an error processing your payment. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      this.paymentProcessing = false;
    }
  }

  private async simulateStripePayment(): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const cardNumber = this.getFormControl(this.paymentForm, 'cardNumber').value;

    // Simulate different payment outcomes based on test card numbers
    if (cardNumber === '4000000000009995') {
      throw new Error('Card declined');
    } else if (cardNumber === '4000002500003155') {
      // For authentication required, you would typically use Stripe's 3D Secure flow
      await Swal.fire({
        title: 'Authentication Required',
        html: `
          <p>Your card requires additional authentication.</p>
          <p>For demo: Click "Confirm" to proceed.</p>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
      }).then((result) => {
        if (!result.isConfirmed) {
          throw new Error('Authentication cancelled');
        }
      });
    }
    // For successful cards (4242...), proceed without issues
  }

  private async placeOrder(): Promise<void> {
    const order = {
      id: 'ORD-' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      customer: {
        fullName: this.getFormControl(this.checkoutForm, 'fullName').value,
        email: this.getFormControl(this.checkoutForm, 'email').value,
        phone: this.getFormControl(this.checkoutForm, 'phone').value,
        address: {
          line1: this.getFormControl(this.checkoutForm, 'addressLine1').value,
          line2: this.getFormControl(this.checkoutForm, 'addressLine2').value,
          city: this.getFormControl(this.checkoutForm, 'city').value,
          postalCode: this.getFormControl(this.checkoutForm, 'postalCode').value,
          country: this.getFormControl(this.checkoutForm, 'country').value
        }
      },
      payment: {
        method: 'card',
        last4: this.getFormControl(this.paymentForm, 'cardNumber').value.slice(-4),
        brand: 'visa'
      },
      items: this.items,
      subtotal: this.subtotal,
      tax: this.tax,
      shipping: this.shipping,
      total: this.total,
      status: 'confirmed'
    };

    // Save order to localStorage
    try {
      const raw = localStorage.getItem('orders') || '[]';
      const orders = JSON.parse(raw);
      orders.push(order);
      localStorage.setItem('orders', JSON.stringify(orders));
    } catch (err) {
      console.error('Error saving order locally', err);
    }

    // Clear cart
    this.cartService.clearCart();

    // Show success message
    await Swal.fire({
      icon: 'success',
      title: 'Payment Successful!',
      html: `
        <p>Thank you for your order!</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> $${this.total.toFixed(2)}</p>
        <p>You will receive a confirmation email shortly.</p>
      `,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Continue Shopping'
    });

    // Navigate to home or orders page
    this.router.navigate(['/']);
  }

  cancel() {
    Swal.fire({
      title: 'Cancel Payment?',
      text: 'Are you sure you want to cancel this payment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'No, continue'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/cart']);
      }
    });
  }
}
