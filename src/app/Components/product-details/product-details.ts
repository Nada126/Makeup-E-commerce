import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReviewService, User } from '../../Services/review-service';
import { Review } from '../../modules/review';
import { FavoriteService } from '../../Services/favorite.service';
import { Product } from '../../modules/Product';
import { CartService } from '../../Services/cart-service';
import Swal from 'sweetalert2';

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
  products: Product[] = [];
  isFavorite: boolean = false;

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
    private favoriteService: FavoriteService,
    private cartService: CartService
  ) { }

  ngOnInit() {
    const nav = (this.router as any).getCurrentNavigation ? (this.router as any).getCurrentNavigation() : null;
    const stateProduct = nav?.extras?.state?.product ?? (history && (history.state as any)?.product);

    if (stateProduct) {
      this.product = this.normalizeProduct(stateProduct);
      this.checkIfFavorite();
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

  // Check if product is in favorites
  checkIfFavorite() {
    if (this.product && this.product.id) {
      this.isFavorite = this.favoriteService.isFavorite(this.product.id);
    }
  }

  // Toggle favorite status
  toggleFavorite(event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (!this.product || !this.product.id) return;

    if (this.isFavorite) {
      this.favoriteService.removeFromFavorites(this.product.id);
      this.isFavorite = false;

      Swal.fire({
        position: 'top-end',
        icon: 'info',
        title: 'Removed from Favorites',
        text: `${this.product.name} has been removed from your favorites`,
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        background: '#f8f9fa',
        iconColor: '#ff6f91'
      });
    } else {
      this.favoriteService.addToFavorites(this.product);
      this.isFavorite = true;

      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Added to Favorites!',
        text: `${this.product.name} has been added to your favorites`,
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        background: '#f8f9fa',
        iconColor: '#ff6f91'
      });
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
        this.checkIfFavorite();
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
    this.reviewService.getUsers().subscribe({
      next: (users) => {
        console.log('Raw users from API:', users);
        // Ensure all user IDs are numbers
        this.availableUsers = users.map(user => ({
          ...user,
          id: Number(user.id) // Convert ID to number
        }));

        console.log('Normalized users:', this.availableUsers);

        if (this.availableUsers.length > 0) {
          this.selectedUserId = this.availableUsers[0].id;
          console.log('Default selected user ID:', this.selectedUserId);
        }
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

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

  // FIXED: Toggle reviews - don't show form when viewing reviews
  toggleReviews() {
    this.showReviews = !this.showReviews;

    if (this.showReviews) {
      // Close add review form if it's open
      if (this.showAddReviewForm) {
        this.showAddReviewForm = false;
      }

      if (this.reviews.length === 0) {
        this.loadReviews();
      }

      this.scrollToReviews();
    }
  }

  // FIXED: Toggle add review form - don't show reviews when adding review
  toggleAddReviewForm() {
    this.showAddReviewForm = !this.showAddReviewForm;

    if (this.showAddReviewForm) {
      this.resetReviewForm();

      // Close reviews if they're open
      if (this.showReviews) {
        this.showReviews = false;
      }

      this.scrollToAddReview();
    }
  }

  resetReviewForm() {
    this.newReview = {
      rating: 0,
      comment: ''
    };
    if (this.availableUsers.length > 0) {
      this.selectedUserId = this.availableUsers[0].id;
    }
  }

  // FIXED: Submit review with proper user handling
  submitReview() {
    console.log('=== SUBMIT REVIEW DEBUG ===');
    console.log('Product ID:', this.product.id);
    console.log('Product Name:', this.product.name);

    if (!this.product) {
      console.error('No product selected');
      return;
    }

    if (!this.selectedUserId) {
      console.error('No user selected');
      return;
    }

    if (!this.newReview.comment?.trim()) {
      console.error('No review comment');
      return;
    }

    // Find user with proper ID comparison
    const selectedUser = this.availableUsers.find(user => {
      return user.id === this.selectedUserId;
    });

    console.log('Found user:', selectedUser);

    if (!selectedUser) {
      console.error('User not found. Available IDs:', this.availableUsers.map(u => u.id));
      return;
    }

    this.submittingReview = true;

    const review: Review = {
      userName: selectedUser.name,
      userImage: selectedUser.avatar,
      date: new Date().toISOString().split('T')[0],
      rating: this.newReview.rating || 5,
      comment: this.newReview.comment.trim(),
      productId: this.product.id
    };

    console.log('Submitting review:', review);

    this.reviewService.addReview(review).subscribe({
      next: (newReview) => {
        console.log('Review added successfully:', newReview);

        // Add to local reviews
        this.reviews.unshift(newReview);

        // Clear error message
        this.reviewsError = null;

        // Update product rating
        this.product.rating = this.calculateAverageRating();

        // Reset and close form
        this.showAddReviewForm = false;
        this.resetReviewForm();
        this.submittingReview = false;

        // Show success message
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Review Submitted!',
          text: 'Thank you for your review!',
          showConfirmButton: false,
          timer: 2000,
          toast: true,
          background: '#f8f9fa',
          iconColor: '#28a745'
        });
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.submittingReview = false;

        Swal.fire({
          position: 'top-end',
          icon: 'error',
          title: 'Error',
          text: 'Failed to submit review. Please try again.',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
          background: '#f8f9fa',
          iconColor: '#dc3545'
        });
      }
    });
  }

  loadReviews() {
    if (!this.product) return;

    this.reviewsLoading = true;
    this.reviewsError = null;

    console.log('Loading reviews for product ID:', this.product.id);

    // CHANGE: Use productId instead of category
    this.reviewService.getReviewsByProduct(this.product.id).subscribe({
      next: (reviews) => {
        console.log('Reviews loaded for product:', reviews);

        // Filter out invalid reviews
        this.reviews = (reviews || [])
          .filter(review =>
            review &&
            review.userName &&
            review.userName !== 'Anonymous' &&
            review.comment &&
            review.comment.trim() !== '' &&
            review.rating > 0
          );

        this.reviewsLoading = false;

        // Calculate average rating from reviews
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

    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = total / this.reviews.length;

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

    const item = {
      productId: this.product.id,
      name: this.product.name,
      price: Number(this.product.price) || 0,
      image: this.product.image,
      quantity: 1,
      product: this.product
    };

    this.cartService.addItem(item);

    // SweetAlert notification
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Added to Cart!',
      text: `${this.product.name} has been added to your cart`,
      showConfirmButton: false,
      timer: 2000,
      toast: true,
      background: '#f8f9fa',
      iconColor: '#28a745'
    });
  }

  goBack() {
    if (window.history.length > 1) {
      this.router.navigateByUrl('/products');
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
