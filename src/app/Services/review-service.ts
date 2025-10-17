import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, catchError, of } from 'rxjs';

export interface Review {
  userName: string;
  userImage: string;
  date: string;
  comment: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private reviewsUrl = 'database/reviews.json';

  constructor(private http: HttpClient) {}

  getReviewsByCategory(category: string): Observable<Review[]> {
    if (!category) {
      console.log('No category provided');
      return of([]);
    }

    console.log('Loading reviews from:', this.reviewsUrl);

    return this.http.get<{[key: string]: Review[]}>(this.reviewsUrl).pipe(
      map((allReviews) => {
        console.log('Reviews JSON loaded successfully:', allReviews);
        console.log('Available categories:', Object.keys(allReviews));
        
        const normalizedCategory = category.toLowerCase().trim();
        console.log('Searching for category:', normalizedCategory);
        
        // Simple direct match
        if (allReviews[normalizedCategory]) {
          console.log('Found reviews for:', normalizedCategory);
          return allReviews[normalizedCategory];
        }

        console.log('No reviews found for category:', normalizedCategory);
        return [];
      }),
      catchError(error => {
        console.error('Error loading reviews file:', error);
        console.error('Error details:', error.message);
        console.error('File path attempted:', this.reviewsUrl);
        return of([]);
      })
    );
  }
}