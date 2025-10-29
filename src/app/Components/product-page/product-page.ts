import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../../app/modules/Product';
import { Router, RouterModule } from '@angular/router';
import { FavoriteService } from '../../Services/favorite.service';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../Services/cart-service';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';
import { ProductService } from '../../Services/product-service';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-page.html',
  styleUrls: ['./product-page.css'],
})
export class ProductPage implements OnInit {
  searchQuery: string = '';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  subCategories: string[] = [];
  selectedCategory = 'All';
  selectedSubCategory = 'All';

  currentPage = 1;
  itemsPerPage = 25;
  loading = false;

  favoriteIds = new Set<number>();

  constructor(
    private http: HttpClient,
    private router: Router,
    public favoriteService: FavoriteService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private productService: ProductService
  ) { }

  handleCategoryClick(category: string) {
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

  openDetail(product: Product | undefined) {
    if (!product || product.id == null) return;
    this.router.navigate(['/product', product.id], { state: { product } });
  }

  navigateToProductType(productType: string) {
    this.router.navigate(['/products', productType]);
  }

  ngOnInit() {
    this.fetchProducts();

    // Subscribe to favorites for real-time updates
    this.favoriteService.favorites$.subscribe((favorites: Product[]) => {
      this.favoriteIds.clear();
      favorites.forEach((fav: Product) => {
        const id = Number(fav.id);
        if (!Number.isNaN(id)) {
          this.favoriteIds.add(id);
        }
      });
      this.cdr.detectChanges();
    });
  }

  fetchProducts() {
    this.loading = true;
    const apiUrl = 'https://makeup-api.herokuapp.com/api/v1/products.json';

    this.http.get<Product[]>(apiUrl).subscribe({
      next: (data) => {
        this.processProducts(data);
      },
      error: (err) => {
        console.error('Error fetching products from API, trying local data:', err);
        this.LoadProducts();
      },
    });
  }

  // Unified toggleFavorite method
  toggleFavorite(product: Product, event?: Event) {
    if (event) {
      event.stopPropagation(); // Prevent card click when clicking favorite
    }

    // Use service-based approach (primary)
    if (this.favoriteService.isFavorite(product.id)) {
      this.favoriteService.removeFromFavorites(product.id);
      product.isFavorite = false;
      this.favoriteIds.delete(product.id);
    } else {
      this.favoriteService.addToFavorites(product);
      product.isFavorite = true;
      this.favoriteIds.add(product.id);
    }

    this.cdr.detectChanges();
  }

  // Check if product is favorite using both methods
  isFavorite(product: any): boolean {
    const rawId = product?.id ?? product?.productId;
    const id = rawId == null ? null : Number(rawId);
    if (id == null || Number.isNaN(id)) return false;

    // Use service as primary, local state as fallback
    return this.favoriteService.isFavorite(id) || this.favoriteIds.has(id);
  }

  LoadProducts() {
    this.productService.fetchAllProducts().subscribe({
      next: (data) => {
        this.processProducts(data)
      },
      error: (err) => {
        console.error('Error fetching local products:', err);
        this.loading = false;
        this.products = [];
        this.filteredProducts = [];
        this.categories = [];
      },
    })
  }
  // Process products with proper favorite state initialization
  processProducts(data: Product[]) {
    const validProducts: Product[] = [];
    const allProducts = data.map((p) => ({
      ...p,
      price: Number(p.price) || 0,
      rating: Number(p.rating) || 0,
      isFavorite: this.isFavorite(p), // Use unified isFavorite method
    }));
    // Image validation
    const checkImagePromises = allProducts.map((product) =>
      this.http
        .head(product.image_link || '', { observe: 'response' })
        .toPromise()
        .then(() => validProducts.push(product))
        .catch(() => null)
    );
    Promise.all(checkImagePromises).then(() => {
      this.products = validProducts;
      this.filteredProducts = this.products;
      this.categories = [...new Set(this.products.map((p) => p.product_type).filter(Boolean))];
      this.loading = false;
    });
  }

  // pagination
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

  filterByAll() {
    this.filteredProducts = this.products;
    this.selectedCategory = 'All';
    this.subCategories = [];
    this.currentPage = 1;
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

      this.filteredProducts = this.products.filter((p) => p.product_type === category);
    }

    this.currentPage = 1;
  }

  filterBySubCategory(subCategory: string) {
    this.selectedSubCategory = subCategory;
    this.filteredProducts = this.products.filter(
      (p) => p.product_type === this.selectedCategory && p.product_category === subCategory
    );
    this.currentPage = 1;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Consistent addToCart method for all components
  addToCart(product: Product, event?: Event) {
    if (event) event.stopPropagation();
    if (!product || product.id == null) return;

    const item = {
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image: product.image_link || product.image_link,
      quantity: 1,
      product,
    };

    this.cartService.addItem(item);

    // SweetAlert notification
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Added to Cart!',
      text: `${product.name} has been added to your cart`,
      showConfirmButton: false,
      timer: 2000,
      toast: true,
      background: '#f8f9fa',
      iconColor: '#28a745',
    });
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
    switch (category.toLowerCase()) {
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

  filterBySearch() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredProducts = this.products.filter(
        (p) => this.selectedCategory === 'All' || p.product_type === this.selectedCategory
      );
    } else {
      this.filteredProducts = this.products.filter(
        (p) =>
          (this.selectedCategory === 'All' || p.product_type === this.selectedCategory) &&
          (p.name?.toLowerCase().includes(query) || p.brand?.toLowerCase().includes(query))
      );
    }
    this.currentPage = 1;
  }

  onSearch(event: any) {
    const searchValue = event.target.value.toLowerCase().trim();

    this.filteredProducts = this.products.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchValue) ||
        p.brand?.toLowerCase().includes(searchValue) ||
        p.category?.toLowerCase().includes(searchValue)
    );

    this.currentPage = 1;
  }
}
