import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FavouriteItem } from '../models/favourite-item';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private storageKeyPrefix = 'fav_';
  private itemsSubject = new BehaviorSubject<FavouriteItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private getStorageKey(): string {
    // optional: tie to user if you have currentUser in localStorage
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user && user.id != null) return `${this.storageKeyPrefix}${user.id}`;
      } catch {}
    }
    return `${this.storageKeyPrefix}guest`;
  }

  private loadFromStorage() {
    const key = this.getStorageKey();
    const raw = localStorage.getItem(key);
    const items: FavouriteItem[] = raw ? JSON.parse(raw) : [];
    this.itemsSubject.next(items);
  }

  private saveToStorage(items: FavouriteItem[]) {
    const key = this.getStorageKey();
    localStorage.setItem(key, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  getItems(): FavouriteItem[] {
    return [...this.itemsSubject.value];
  }

  isFavorite(productId: number): boolean {
    return this.getItems().some(i => i.productId === productId);
  }

  addItem(item: FavouriteItem) {
    const items = this.getItems();
    if (!items.find(i => i.productId === item.productId)) {
      items.push({ ...item });
      this.saveToStorage(items);
    }
  }

  removeItem(productId: number) {
    let items = this.getItems();
    items = items.filter(i => i.productId !== productId);
    this.saveToStorage(items);
  }

  toggle(product: any): boolean {
  // تطبيع id لـ number
  const rawId = product?.id ?? product?.productId ?? product?.productId;
  const id = rawId == null ? null : Number(rawId);

  if (id == null || Number.isNaN(id)) return false;

  const items = this.getItems();
  const existsIndex = items.findIndex(i => Number(i.productId) === id);

  if (existsIndex > -1) {
    // remove
    items.splice(existsIndex, 1);
    this.saveToStorage(items);
    return false; // now not favorite
  } else {
    // add
    const item = {
      productId: id,
      name: product.name ?? product.title ?? 'Unknown',
      price: Number(product.price) || 0,
      image: product.image_link || product.image || '',
      product
    };
    items.push(item);
    this.saveToStorage(items);
    return true; // now favorite
  }
}

  clearFavorites() {
    this.saveToStorage([]);
  }

  // reload when user logs in/out
  reload() {
    this.loadFromStorage();
  }
}
