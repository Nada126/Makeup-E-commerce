import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { AuthService } from './auth-service'; 

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private storageKeyPrefix = 'cart_';
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  constructor(private auth: AuthService) {
    this.loadFromStorage();
  }

  private getStorageKey(): string {
    const user = this.auth.getCurrentUser?.() || null;
    if (user && user.id != null) {
      return `${this.storageKeyPrefix}${user.id}`;
    }
    // guest fallback
    return `${this.storageKeyPrefix}guest`;
  }

  private loadFromStorage() {
    const key = this.getStorageKey();
    const raw = localStorage.getItem(key);
    const items: CartItem[] = raw ? JSON.parse(raw) : [];
    this.itemsSubject.next(items);
  }

  private saveToStorage(items: CartItem[]) {
    const key = this.getStorageKey();
    localStorage.setItem(key, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  getItems(): CartItem[] {
    return [...this.itemsSubject.value];
  }

  addItem(item: CartItem) {
    const items = this.getItems();
    const existing = items.find(i => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push({ ...item });
    }
    this.saveToStorage(items);
  }

  updateQuantity(productId: number, qty: number) {
    const items = this.getItems();
    const item = items.find(i => i.productId === productId);
    if (!item) return;
    item.quantity = Math.max(1, qty);
    this.saveToStorage(items);
  }

  removeItem(productId: number) {
    let items = this.getItems();
    items = items.filter(i => i.productId !== productId);
    this.saveToStorage(items);
  }

  clearCart() {
    this.saveToStorage([]);
  }

  getTotalCount(): number {
    return this.getItems().reduce((s, i) => s + i.quantity, 0);
  }

  getTotalPrice(): number {
    return this.getItems().reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0);
  }

  // call when user logs in or out to reload appropriate storage
  reload() {
    this.loadFromStorage();
  }
}
