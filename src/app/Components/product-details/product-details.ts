import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReviewService } from '../../Services/review-service';
import { Review } from '../../modules/review';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css']
})
export class ProductDetails implements OnInit {
  product: any = null;
  productId?: number;
  loading = false;
  errorMessage: string | null = null;
  reviews: Review[] = [];
  showReviews = false;
  reviewsLoading = false;
  reviewsError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private reviewService: ReviewService
  ) {}

  ngOnInit() {
    const nav = (this.router as any).getCurrentNavigation ? (this.router as any).getCurrentNavigation() : null;
    const stateProduct = nav?.extras?.state?.product ?? (history && (history.state as any)?.product);

    if (stateProduct) {
      this.product = this.normalizeProduct(stateProduct);
      return;
    }

    const idStr = this.route.snapshot.paramMap.get('id');
    if (idStr) {
      const id = +idStr;
      if (isNaN(id)) {
        this.errorMessage = 'Invalid product id.';
        return;
      }
      this.productId = id;
      this.fetchProductDetails(id);
    } else {
      this.errorMessage = 'No product id provided.';
    }
  }

  fetchProductDetails(id: number) {
    this.loading = true;
    this.errorMessage = null;

    const url = `https://makeup-api.herokuapp.com/api/v1/products/${id}.json`;

    this.http.get<any>(url).subscribe({
      next: (data: any) => {
        if (!data) {
          this.errorMessage = 'Product not found.';
          this.loading = false;
          return;
        }
        this.product = this.normalizeProduct(data);
        console.log('Product loaded:', this.product);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching product details:', err);
        if (err?.status === 404) {
          this.errorMessage = 'Product not found (404).';
        } else {
          this.errorMessage = 'An error occurred while fetching product data.';
        }
        this.loading = false;
      }
    });
  }

  toggleReviews() {
    this.showReviews = !this.showReviews;
    
    if (this.showReviews && this.reviews.length === 0) {
      this.loadReviews();
    }
  }

  loadReviews() {
    if (!this.product) return;

    this.reviewsLoading = true;
    this.reviewsError = null;

    const category = this.product.product_type;
    console.log('Loading reviews for category:', category);

    this.reviewService.getReviewsByCategory(category).subscribe({
      next: (reviews) => {
        console.log('Reviews loaded:', reviews);
        // Normalize reviews to the app's Review interface (ensure required 'rating' exists)
        this.reviews = (reviews || []).map((r: any) => ({
          userName: r.userName ?? r.username ?? r.user ?? 'Anonymous',
          userImage: r.userImage ?? r.userImageUrl ?? r.avatar ?? '',
          date: r.date ?? r.createdAt ?? new Date().toISOString(),
          rating: typeof r.rating === 'number' ? r.rating : Number(r.rating) || 0,
          comment: r.comment ?? r.text ?? ''
        }));
        this.reviewsLoading = false;
        
        // Calculate average rating from reviews
        if (this.reviews.length > 0) {
          this.product.rating = this.calculateAverageRating();
        }
        
        if (this.reviews.length === 0) {
          this.reviewsError = 'No reviews available for this product category.';
        }
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.reviewsError = 'Failed to load reviews. Please try again later.';
        this.reviewsLoading = false;
      }
    });
  }

  // Calculate average rating from all reviews
  calculateAverageRating(): number {
    if (!this.reviews || this.reviews.length === 0) return 0;
    
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = total / this.reviews.length;
    
    // Round to 1 decimal place
    return Math.round(average * 10) / 10;
  }

  normalizeProduct(data: any) {
    return {
      id: data?.id ?? this.productId,
      name: data?.name ?? 'Unknown product',
      brand: data?.brand ?? 'Unknown',
      price: Number(data?.price) || 0,
      description: data?.description ?? '',
      image: data?.image_link ?? data?.image ?? 'https://via.placeholder.com/600',
      rating: Number(data?.rating) || 0,
      product_type: data?.product_type ?? null,
      product_category: data?.product_category ?? null,
      ...data
    };
  }

  getStarsArray(rating: any): boolean[] {
    const numericRating = Number(rating) || 0;
    const stars = Math.round(numericRating);
    return Array.from({ length: 5 }, (_, i) => i < stars);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  addToCart() {
    if (!this.product) return;
    alert(`${this.product.name} has been added to the cart.`);
  }

  goBack() {
    if (window.history.length > 1) {
      this.router.navigateByUrl('/');
    } else {
      this.router.navigate(['/']);
    }
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = 'https://via.placeholder.com/600';
    }
  }
}