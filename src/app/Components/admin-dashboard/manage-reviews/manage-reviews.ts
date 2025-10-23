import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Review } from '../../../modules/review';
import { Product } from '../../../modules/Product';


@Component({
  selector: 'app-manage-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-reviews.html',
  styleUrls: ['./manage-reviews.css']
})
export class ManageReviews implements OnInit {
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  selectedStatus: string = 'all';
  searchTerm: string = '';

  // Computed properties for template
  get totalReviews(): number {
    return this.reviews.length;
  }

  get pendingReviewsCount(): number {
    return this.reviews.filter(r => r.status === 'pending').length;
  }

  private baseUrl = 'http://localhost:3001/reviews';
  private productsUrl = 'http://localhost:3001/products';
  // NOTE: json-server in this project runs on port 3001 (see package.json scripts)
  // Keep these URLs in sync with server/db.json => json-server --port 3001
  // If you run a different API, adjust accordingly.


  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.http.get<Review[]>(this.baseUrl).subscribe({
      next: (reviews) => {
        // Load products to get product names
        this.http.get<Product[]>(this.productsUrl).subscribe({
          next: (products) => {
            console.log('Products:', products);
            console.log('Reviews:', reviews);
            // Map product names to reviews
            this.reviews = reviews.map(review => {
              const product = products.find(p => {
                // Coerce both ids to string to avoid mismatches when db.json stores some ids as strings
                console.log('Comparing p.id:', p.id, 'with review.productId:', review.productId, 'types:', typeof p.id, typeof review.productId);
                return String(p.id) === String(review.productId);
              });
              console.log('Found product for review', review.id, ':', product);
              return {
                ...review,
                productName: product?.name || 'Unknown Product'
              };
            });
            console.log('Mapped reviews:', this.reviews);
            this.filterReviews();
          },
          error: (err) => {
            console.error('Error loading products:', err);
            // Still show reviews without product names
            this.reviews = reviews;
            this.filterReviews();
          }
        });
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        alert('❌ Failed to load reviews.');
      }
    });
  }

  filterReviews() {
    this.filteredReviews = this.reviews.filter(review => {
      const matchesStatus = this.selectedStatus === 'all' || review.status === this.selectedStatus;
      const matchesSearch = !this.searchTerm ||
        review.userName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (review.productName && review.productName.toLowerCase().includes(this.searchTerm.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }

  updateReviewStatus(reviewId: number, status: 'approved' | 'rejected') {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      review.status = status;

      this.http.patch(`${this.baseUrl}/${reviewId}`, { status }).subscribe({
        next: () => {
          this.filterReviews();
        },
        error: (err) => {
          console.error('Error updating review:', err);
          alert('❌ Failed to update review status.');
        }
      });
    }
  }

  deleteReview(reviewId: number) {
    if (confirm('Are you sure you want to delete this review?')) {
      this.http.delete(`${this.baseUrl}/${reviewId}`).subscribe({
        next: () => {
          this.reviews = this.reviews.filter(r => r.id !== reviewId);
          this.filterReviews();
          alert('✅ Review deleted successfully!');
        },
        error: (err) => {
          console.error('Error deleting review:', err);
          alert('❌ Failed to delete review.');
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
