// favorite.service.ts - FIXED
import { Injectable } from '@angular/core';
import { Product } from '../modules/Product';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { AuthService } from './auth-service';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private favoritesKey = 'userFavorites';
  private favoritesSubject: BehaviorSubject<Map<number, Product[]>>;

  // Public observables - initialized in constructor
  userFavorites$: any;
  favoritesCount$: any;

  constructor(private authService: AuthService) {
    // Initialize the BehaviorSubject first
    this.favoritesSubject = new BehaviorSubject<Map<number, Product[]>>(this.loadAllUsersFavorites());

    // Then initialize the observables that depend on authService and favoritesSubject
    this.userFavorites$ = combineLatest([
      this.authService.loginState$,
      this.favoritesSubject.asObservable()
    ]).pipe(
      map(([isLoggedIn, allFavorites]) => {
        if (!isLoggedIn) return [];
        const userId = this.authService.getCurrentUserId();
        return userId ? allFavorites.get(userId) || [] : [];
      }),
      distinctUntilChanged((prev, curr) =>
        prev.length === curr.length &&
        prev.every((p, i) => p.id === curr[i]?.id)
      )
    );

    this.favoritesCount$ = this.userFavorites$.pipe(
      map((favorites: Product[]) => favorites.length)
    );
  }

  // Load all users' favorites from localStorage
  private loadAllUsersFavorites(): Map<number, Product[]> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return new Map();
    }

    const stored = localStorage.getItem(this.favoritesKey);
    if (stored) {
      try {
        const arrayData = JSON.parse(stored);
        return new Map(arrayData);
      } catch {
        return new Map();
      }
    }
    return new Map();
  }

  // Save all users' favorites to localStorage
  private saveAllFavorites(favoritesMap: Map<number, Product[]>): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const arrayData = Array.from(favoritesMap.entries());
      localStorage.setItem(this.favoritesKey, JSON.stringify(arrayData));
      this.favoritesSubject.next(new Map(favoritesMap));
    }
  }

  // Add to favorites with user context
  addToFavorites(product: Product): boolean {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return false;

    const allFavorites = this.loadAllUsersFavorites();
    const userFavorites = allFavorites.get(userId) || [];

    // Check if already favorited
    if (userFavorites.some(fav => fav.id === product.id)) {
      return false;
    }

    userFavorites.push({ ...product, isFavorite: true });
    allFavorites.set(userId, userFavorites);
    this.saveAllFavorites(allFavorites);
    return true;
  }

  // Remove from favorites with user context
  removeFromFavorites(productId: number): boolean {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return false;

    const allFavorites = this.loadAllUsersFavorites();
    const userFavorites = allFavorites.get(userId) || [];
    const updatedFavorites = userFavorites.filter(fav => fav.id !== productId);

    allFavorites.set(userId, updatedFavorites);
    this.saveAllFavorites(allFavorites);
    return true;
  }

  // Check if product is in user's favorites
  isFavorite(productId: number): boolean {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return false;

    const allFavorites = this.loadAllUsersFavorites();
    const userFavorites = allFavorites.get(userId) || [];
    return userFavorites.some(fav => fav.id === productId);
  }

  // Get current user's favorites
  getFavoritesList(): Product[] {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return [];

    const allFavorites = this.loadAllUsersFavorites();
    return allFavorites.get(userId) || [];
  }

  // Get favorites count for current user
  getFavoritesCount(): number {
    return this.getFavoritesList().length;
  }

  // Clear current user's favorites
  clearFavorites(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    const allFavorites = this.loadAllUsersFavorites();
    allFavorites.set(userId, []);
    this.saveAllFavorites(allFavorites);
  }
}
