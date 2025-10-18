// src/app/Components/product-page/product-page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../../app/modules/Product';
import { RouterModule, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-page.html',
  styleUrls: ['./product-page.css'],
})
export class ProductPage implements OnInit {
  handleCategoryClick(category: string) {
    // List of product types that should navigate to their own pages
    const specialProductTypes = [
      'lipstick',
      'lip_liner',
      'foundation',
      'eyeliner',
      'eyeshadow',
      'blush',
      'bronzer',
      'mascara',
      'eyebrow',
      'nail_polish',
    ];

    if (specialProductTypes.includes(category)) {
      this.navigateToProductType(category);
    } else {
      this.filterByCategory(category);
    }
  }
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  subCategories: string[] = [];
  selectedCategory = 'All';
  selectedSubCategory = 'All';

  currentPage = 1;
  itemsPerPage = 25;
  loading = false;
  errorMessage: string | null = null;

  // receive whole product and navigate while passing it as navigation state
  openDetail(product: Product | undefined) {
    if (!product || product.id == null) return;
    this.router.navigate(['/product', product.id], { state: { product } });
  }
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  navigateToProductType(productType: string) {
    this.router.navigate(['/', productType]);
  }

  ngOnInit() {
    this.fetchProducts();
  }

  fetchProducts() {
    this.loading = true;
    const url = 'https://makeup-api.herokuapp.com/api/v1/products.json';

    this.http.get<Product[]>(url).subscribe({
      next: (data) => {
        const validProducts: Product[] = [];

        const allProducts = data.map((p) => ({
          ...p,
          price: Number(p.price) || 0,
          rating: Number(p.rating) || 0,
          isFavorite: false,
        }));

        // Check if image exists
        const checkImagePromises = allProducts.map((product) =>
          this.http
            .head(product.image_link || '', { observe: 'response' })
            .toPromise()
            .then(() => validProducts.push(product))
            .catch(() => null)
        );

        Promise.all(checkImagePromises)
          .then(() => {
            // if none passed (rare), fall back to allProducts
            this.products = validProducts.length ? validProducts : allProducts;
            this.filteredProducts = [...this.products];
            this.categories = [
              ...new Set(
                this.products.map((p) => p.product_type).filter(Boolean)
              ),
            ];
            this.loading = false;
          })
          .catch((err) => {
            console.error('Image checks failed:', err);
            this.products = allProducts;
            this.filteredProducts = [...this.products];
            this.categories = [
              ...new Set(
                this.products.map((p) => p.product_type).filter(Boolean)
              ),
            ];
            this.loading = false;
          });
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.errorMessage = 'Failed to load products.';
        this.loading = false;
      },
    });
  }

  toggleFavorite(product: Product) {
    product.isFavorite = !product.isFavorite;
  }

  // pagination
  // ... rest of your existing methods
  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage) || 1;
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  filterByAll() {
    this.filteredProducts = this.products;
    this.selectedCategory = 'All';
    this.subCategories = [];
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.selectedSubCategory = 'All';
    if (category === 'All') {
      this.filteredProducts = this.products;
      this.subCategories = [];
    } else {
      this.subCategories = [
        ...new Set(
          this.products
            .filter((p) => p.product_type === category)
            .map((p) => p.product_category)
            .filter(Boolean)
        ),
      ];
      this.filteredProducts = this.products.filter(
        (p) => p.product_type === category
      );
    }
    this.currentPage = 1;
  }

  filterBySubCategory(subCategory: string) {
    this.selectedSubCategory = subCategory;
    this.filteredProducts = this.products.filter(
      (p) =>
        p.product_type === this.selectedCategory &&
        p.product_category === subCategory
    );
    this.currentPage = 1;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  addToCart(product: Product) {
    alert(`${product.name} added to cart!`);
  }

  sortByPrice(event: any) {
    const value = event.target.value;
    if (value === 'low-high') {
      this.filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (value === 'high-low') {
      this.filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
    }
    this.currentPage = 1;
  }

  sortByRating(event: any) {
    const value = event.target.value;
    if (value === 'low-high') {
      this.filteredProducts.sort((a, b) => Number(a.rating) - Number(b.rating));
    } else if (value === 'high-low') {
      this.filteredProducts.sort((a, b) => Number(b.rating) - Number(a.rating));
    }
    this.currentPage = 1;
  }

  getStarsArray(rating: any): boolean[] {
    const stars = Math.round(Number(rating) || 0);
    return Array.from({ length: 5 }, (_, i) => i < stars);
  }

  getCategoryIcon(category: string): string {
    const c = (category || '').toLowerCase();
    switch (c) {
      case 'lipstick':
        return 'bi bi-brush';
      case 'eyeshadow':
        return 'bi bi-palette';
      case 'blush':
        return 'bi bi-circle-half';
      case 'foundation':
        return 'bi bi-droplet';
      default:
        return 'bi bi-tag';
    }
  }
}
