// src/app/Components/product-details/product-details.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    // try navigation state first
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
    const stars = Math.round(Number(rating) || 0);
    return Array.from({ length: 5 }, (_, i) => i < stars);
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
