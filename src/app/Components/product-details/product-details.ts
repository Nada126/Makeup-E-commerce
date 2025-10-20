import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReviewService, User } from '../../Services/review-service';
import { Review } from '../../modules/review';
import { CartService } from '../../Services/cart-service'; // <-- اضيفي هذا

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

  // New properties for adding reviews
  showAddReviewForm = false;
  newReview: Partial<Review> = {
    rating: 0,
    comment: ''
  };
  submittingReview = false;
  availableUsers: User[] = [];
  selectedUserId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private reviewService: ReviewService,
    private cartService: CartService   
  ) { }

  ngOnInit() {
    const nav = (this.router as any).getCurrentNavigation ? (this.router as any).getCurrentNavigation() : null;
    const stateProduct = nav?.extras?.state?.product ?? (history && (history.state as any)?.product);

    if (stateProduct) {
      this.product = this.normalizeProduct(stateProduct);
      this.loadAvailableUsers();
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
        this.loadAvailableUsers();
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

  loadAvailableUsers() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && currentUser.name) {
      this.availableUsers = [currentUser];
      this.selectedUserId = currentUser.id;
    } else {
      this.availableUsers = [];
    }
  }

  scrollToReviews() {
    setTimeout(() => {
      const reviewsSection = document.querySelector('.reviews-section');
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  scrollToAddReview() {
    setTimeout(() => {
      const addReviewForm = document.querySelector('.add-review-form');
      if (addReviewForm) {
        addReviewForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  toggleReviews() {
    this.showReviews = !this.showReviews;

    if (this.showReviews) {
      if (this.showAddReviewForm) this.showAddReviewForm = false;
      if (this.reviews.length === 0) this.loadReviews();
      this.scrollToReviews();
    }
  }

  toggleAddReviewForm() {
    this.showAddReviewForm = !this.showAddReviewForm;
    if (this.showAddReviewForm) {
      this.resetReviewForm();
      if (this.showReviews) this.showReviews = false;
      this.scrollToAddReview();
    }
  }

  resetReviewForm() {
    this.newReview = { rating: 0, comment: '' };
    if (this.availableUsers.length > 0) this.selectedUserId = this.availableUsers[0].id;
  }

  submitReview() {
    if (!this.product) return;
    if (!this.selectedUserId) return;
    if (!this.newReview.comment?.trim()) return;

    const selectedUser = this.availableUsers.find(u => u.id === this.selectedUserId);
    if (!selectedUser) return;

    this.submittingReview = true;

    const review: Review = {
      userName: selectedUser.name,
      userImage: selectedUser.avatar,
      date: new Date().toISOString().split('T')[0],
      rating: this.newReview.rating || 5,
      comment: this.newReview.comment.trim(),
      productId: this.product.id
    };

    this.reviewService.addReview(review).subscribe({
      next: (newReview) => {
        this.reviews.unshift(newReview);
        this.reviewsError = null;
        this.product.rating = this.calculateAverageRating();
        this.showAddReviewForm = false;
        this.resetReviewForm();
        this.submittingReview = false;
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.submittingReview = false;
      }
    });
  }

  loadReviews() {
    if (!this.product) return;
    this.reviewsLoading = true;
    this.reviewsError = null;

    this.reviewService.getReviewsByProduct(this.product.id).subscribe({
      next: (reviews) => {
        this.reviews = (reviews || []).filter(r => r && r.userName && r.comment && r.rating > 0);
        this.reviewsLoading = false;
        if (this.reviews.length > 0) {
          this.product.rating = this.calculateAverageRating();
          this.reviewsError = null;
        } else {
          this.reviewsError = 'No reviews available for this product yet.';
        }
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.reviewsError = 'Failed to load reviews. Please try again later.';
        this.reviewsLoading = false;
      }
    });
  }

  calculateAverageRating(): number {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const total = this.reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((total / this.reviews.length) * 10) / 10;
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

    const item = {
      productId: this.product.id,
      name: this.product.name,
      price: Number(this.product.price) || 0,
      image: this.product.image,
      quantity: 1,
      product: this.product
    };

    try {
      this.cartService.addItem(item);
      window.alert(`${this.product.name} added to cart`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      window.alert('Failed to add to cart');
    }
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
