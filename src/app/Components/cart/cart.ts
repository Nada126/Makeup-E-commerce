// src/app/Components/cart/cart.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../Services/cart-service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class Cart implements OnInit {
  items: any[] = [];
  total = 0;

  constructor(
    public router: Router,
    public cartService: CartService
  ) {}

  ngOnInit(): void {
    // load initial items
    this.items = this.cartService.getItems() || [];
    this.computeTotal();
    console.log('Cart init items:', this.items);

    // subscribe to updates from service
    this.cartService.items$.subscribe(items => {
      this.items = items || [];
      this.computeTotal();
      console.log('Cart updated items:', this.items);
    });
  }

  // private computeTotal() {
  //   this.total = this.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
  // }

  changeQty(item: any, delta: number) {
    const currentQty = Number(item.quantity ?? item.qty ?? 1);
    const newQty = currentQty + delta;

    // determine id used by CartService
    const id = item.productId ?? item.id ?? item.product?.id;
    if (id == null) {
      // لا يمكن تحديث العنصر في الـ service لأن مفيش id ثابت
      // نحدّث العرض محليًا فقط ونعيد حساب الإجمالي (لن يُحفَظ في localStorage)
      item.quantity = Math.max(1, newQty);
      this.computeTotal();
      console.warn('Item has no id — quantity updated only locally (not persisted).', item);
      return;
    }

    if (newQty <= 0) {
      this.cartService.removeItem(id);
      return;
    }

    this.cartService.updateQuantity(id, newQty);
  }
getSubtotal(): number {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

getShipping(): number {
  const subtotal = this.getSubtotal();
  return subtotal > 50 ? 0 : 5.99; // Free shipping over $50
}

getTax(): number {
  const subtotal = this.getSubtotal();
  return subtotal * 0.14; // 14% tax
}

// Update computeTotal method
private computeTotal() {
  const subtotal = this.getSubtotal();
  const shipping = this.getShipping();
  const tax = this.getTax();
  this.total = subtotal + shipping + tax;
}

  remove(item: any) {
    const id = item.productId ?? item.id ?? item.product?.id;
    if (id == null) {
      // لو مفيش id، نفلتر محليًا (مش محفوظ في storage)
      this.items = this.items.filter(i => i !== item);
      this.computeTotal();
      console.warn('Removed item locally (no id to remove from storage).', item);
      return;
    }
    this.cartService.removeItem(id);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  goToProducts() {
    this.router.navigate(['/products']);
  }

  checkout() {
    if (this.items.length === 0) {
      alert('Your cart is empty. Please add items to proceed to checkout.');
      return;
    }

    // Navigate to payment page with cart data
    this.router.navigate(['/payment'], {
      state: {
        items: this.items,
        total: this.total
      }
    });
  }
}
