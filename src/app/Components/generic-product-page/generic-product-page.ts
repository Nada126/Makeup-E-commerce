// generic-product-page.ts - UPDATED
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../modules/Product';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FavoriteService } from '../../Services/favorite.service';
import { AuthService } from '../../Services/auth-service'; // ADD THIS
import { Subject } from 'rxjs'; // ADD THIS
import { takeUntil } from 'rxjs/operators'; // ADD THIS

@Component({
  selector: 'app-generic-product-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './generic-product-page.html',
  styleUrls: ['./generic-product-page.css']
})
export class GenericProductPage implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];

  productType: string = '';
  pageTitle: string = '';
  categories: string[] = [];
  selectedType = 'All';

  currentPage = 1;
  itemsPerPage = 25;
  loading = false;

  isLoggedIn = false;
  private destroy$ = new Subject<void>();

  // Map product types to display names
  productTypeNames: { [key: string]: string } = {
    'lipstick': 'Lipstick',
    'lip_liner': 'Lip Liner',
    'foundation': 'Foundation',
    'eyeliner': 'Eyeliner',
    'eyeshadow': 'Eyeshadow',
    'blush': 'Blush',
    'bronzer': 'Bronzer',
    'mascara': 'Mascara',
    'eyebrow': 'Eyebrow',
    'nail_polish': 'Nail Polish'
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    public favoriteService: FavoriteService,
    private authService: AuthService // ADD THIS
  ) {}

  openDetail(product: Product | undefined) {
    if (!product || product.id == null) return;
    this.router.navigate(['/product', product.id], { state: { product } });
  }

  toggleFavorite(product: Product, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.favoriteService.isFavorite(product.id)) {
      this.favoriteService.removeFromFavorites(product.id);
      product.isFavorite = false;
    } else {
      if (this.favoriteService.addToFavorites(product)) {
        product.isFavorite = true;
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToProducts() {
    this.router.navigate(['/products']);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const type = params.get('type');
      if(type){
        this.productType = type;
        this.pageTitle = this.productTypeNames[type] || this.formatProductType(type);
        this.fetchProducts();
      }
    });

    // Subscribe to login state
    this.authService.loginState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loggedIn: boolean) => {
        this.isLoggedIn = loggedIn;
      });
  }

  private formatProductType(type: string): string {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  fetchProducts() {
    this.loading = true;
    const url = `https://makeup-api.herokuapp.com/api/v1/products.json?product_type=${this.productType}`;

    this.http.get<Product[]>(url).subscribe({
      next: (data) => {
        // Convert price/rating to numbers
        const allProducts = data.map(p => ({
          ...p,
          price: Number(p.price) || 0,
          rating: Number(p.rating) || 0,
          isFavorite: this.favoriteService.isFavorite(p.id)
        }));

        // If API fails, use local products as fallback
        if (allProducts.length === 0) {
          console.warn('API returned no products, using local data');
          this.http.get<{products: Product[]}>('/assets/products.json').subscribe({
            next: (localData) => {
              const localProducts = localData.products.map(p => ({
                ...p,
                price: Number(p.price) || 0,
                rating: Number(p.rating) || 0,
                isFavorite: this.favoriteService.isFavorite(p.id)
              }));
              this.products = localProducts;
              this.filteredProducts = this.products;
              this.categories = [...new Set(this.products.map(p => p.category).filter(Boolean))];
              console.log(`Available categories for ${this.productType}:`, this.categories);
              this.loading = false;
            },
            error: (localErr) => {
              console.error('Error loading local products:', localErr);
              this.loading = false;
            }
          });
        } else {
          this.products = allProducts;
          this.filteredProducts = this.products;
          this.categories = [...new Set(this.products.map(p => p.category).filter(Boolean))];
          console.log(`Available categories for ${this.productType}:`, this.categories);
          this.loading = false;
        }
      },
      error: (err) => {
        console.error(`Error fetching ${this.productType} products:`, err);
        // Fallback to local products
        this.http.get<{products: Product[]}>('/assets/products.json').subscribe({
          next: (localData) => {
            const localProducts = localData.products.map(p => ({
              ...p,
              price: Number(p.price) || 0,
              rating: Number(p.rating) || 0,
              isFavorite: this.favoriteService.isFavorite(p.id)
            }));
            this.products = localProducts;
            this.filteredProducts = this.products;
            this.categories = [...new Set(this.products.map(p => p.category).filter(Boolean))];
            console.log(`Available categories for ${this.productType}:`, this.categories);
            this.loading = false;
          },
          error: (localErr) => {
            console.error('Error loading local products:', localErr);
            this.loading = false;
          }
        });
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  filterByType(type: string) {
    this.selectedType = type;

    if (type === 'All') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => {
        if (!p.category) return false;
        const productCategory = p.category.toLowerCase().trim();
        const filterType = type.toLowerCase().trim();
        return productCategory === filterType;
      });
    }

    this.currentPage = 1;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  addToCart(product: Product) {
    // Get existing cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Check if product already exists in cart
    const existingProductIndex = cart.findIndex((item: any) => item.id === product.id);

    if (existingProductIndex > -1) {
      // Product already in cart, could increment quantity here if needed
      alert(`${product.name} is already in your cart.`);
    } else {
      // Add new product to cart
      cart.push(product);
      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`${product.name} has been added to the cart.`);
    }

    // Navigate to cart page
    this.router.navigate(['/cart']);
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
}
