import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, tap, map } from 'rxjs';

export interface Review {
  id?: number;
  userName: string;
  userImage: string;
  date: string;
  rating: number;
  comment: string;
  category: string;
}

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
  
  // API endpoints
  private reviewsUrl = `${this.apiUrl}/reviews`;
  private usersUrl = `${this.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // Get reviews by category
  getReviewsByCategory(category: string): Observable<Review[]> {
    if (!category) {
      return of([]);
    }

    const normalizedCategory = category.toLowerCase().trim();
    
    return this.http.get<Review[]>(`${this.reviewsUrl}?category=${normalizedCategory}`).pipe(
      tap(reviews => {
        console.log(`Found ${reviews.length} reviews for category:`, normalizedCategory);
      }),
      catchError(error => {
        console.error('Error loading reviews from API:', error);
        return of([]);
      })
    );
  }

addReview(review: Review): Observable<Review> {
  console.log('Sending review to server:', review);
  console.log('API URL:', this.reviewsUrl);
  
  return this.http.post<Review>(this.reviewsUrl, review).pipe(
    tap(newReview => {
      console.log('Review added successfully:', newReview);
    }),
    catchError(error => {
      console.error('Error adding review:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
      console.error('Error response:', error.error);
      throw error;
    })
  );
}

  // Get available users for reviews
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.usersUrl).pipe(
      catchError(error => {
        console.error('Error loading users:', error);
        return of([]);
      })
    );
  }

  // Get a random user (for demo purposes)
  getRandomUser(): Observable<User> {
    return this.getUsers().pipe(
      map(users => {
        if (users.length === 0) {
          return {
            id: 0,
            name: 'Guest User',
            avatar: 'https://via.placeholder.com/50'
          };
        }
        const randomIndex = Math.floor(Math.random() * users.length);
        return users[randomIndex];
      }),
      catchError(error => {
        console.error('Error getting random user:', error);
        return of({
          id: 0,
          name: 'Guest User',
          avatar: 'https://via.placeholder.com/50'
        });
      })
    );
  }
}