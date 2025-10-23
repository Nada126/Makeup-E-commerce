import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../../app/modules/Product';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-page.html',
  styleUrls: ['./product-page.css'],
})
export class ProductPage implements OnInit {
  searchQuery: string = '';
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

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  subCategories: string[] = [];
  selectedCategory = 'All';
  selectedSubCategory = 'All';

  currentPage = 1;
  itemsPerPage = 25;
  loading = false;

  constructor(private http: HttpClient, private router: Router) { }

  openDetail(product: Product | undefined) {
    if (!product || product.id == null) return;
    this.router.navigate(['/product', product.id], { state: { product } });
  }

  navigateToProductType(productType: string) {
    this.router.navigate(['/products', productType]);
  }

  ngOnInit() {
    this.fetchProducts();
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
        this.fetchLocalProducts();
      },
    });
  }

  fetchLocalProducts() {
    const localUrl = './data.json'; // Path to public folder

    this.http.get<Product[]>(localUrl).subscribe({
      next: (data) => {
        this.processProducts(data);
      },
      error: (err) => {
        console.error('Error fetching local products:', err);
        this.loading = false;
        this.products = [];
        this.filteredProducts = [];
        this.categories = [];
      },
    });
  }

  processProducts(data: Product[]) {
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

    Promise.all(checkImagePromises).then(() => {
      this.products = validProducts;
      this.filteredProducts = this.products;
      this.categories = [...new Set(this.products.map((p) => p.product_type).filter(Boolean))];
      this.loading = false;
    });
  }

  toggleFavorite(product: Product) {
    product.isFavorite = !product.isFavorite;
  }

  // pagination
  // ... rest of your existing methods
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

  // addToCart(product: Product) {
  //   alert(${product.name} added to cart!);
  // }

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
          (p.name?.toLowerCase().includes(query) ||
            p.brand?.toLowerCase().includes(query))
      );
    }
    this.currentPage = 1;
  }
  onSearch(event: any) {
    const searchValue = event.target.value.toLowerCase().trim();

    this.filteredProducts = this.products.filter(p =>
      p.name?.toLowerCase().includes(searchValue) ||
      p.brand?.toLowerCase().includes(searchValue) ||
      p.category?.toLowerCase().includes(searchValue)
    );

    this.currentPage = 1;
  }
}