import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, tap, map } from 'rxjs';
import { Review } from '../modules/review';

export interface User {
  id: number;
  name: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:3001';
  private reviewsUrl = `${this.apiUrl}/reviews`;

  constructor(private http: HttpClient) { }

  // NEW: Get reviews by product ID
  getReviewsByProduct(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.reviewsUrl}?productId=${productId}`).pipe(
      tap(reviews => {
        console.log(`Found ${reviews.length} reviews for product ID: ${productId}`);
      }),
      catchError(error => {
        console.error('Error loading product reviews:', error);
        return of([]);
      })
    );
  }

  // Keep this for category-based filtering if needed elsewhere
  getReviewsByCategory(category: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.reviewsUrl}?category=${category}`).pipe(
      catchError(error => {
        console.error('Error loading reviews:', error);
        return of([]);
      })
    );
  }

  // Add a new review
  addReview(review: Review): Observable<Review> {
    return this.http.post<Review>(this.reviewsUrl, review);
  }

  // Get available users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`).pipe(
      catchError(error => {
        console.error('Error loading users:', error);
        return of([]);
      })
    );
  }
}
