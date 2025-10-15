import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../../app/modules/Product';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-page.html',
  styleUrls: ['./product-page.css']
})
export class ProductPage implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  subCategories: string[] = [];
  selectedCategory = 'All';
  selectedSubCategory = 'All';

  currentPage = 1;
  itemsPerPage = 25; // 👈 you said you want 25 per page
  loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchProducts();
  }

  fetchProducts() {
    this.loading = true;
    const url = 'https://makeup-api.herokuapp.com/api/v1/products.json';

    this.http.get<Product[]>(url).subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = data;
        this.categories = [...new Set(data.map(p => p.product_type).filter(Boolean))];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.loading = false;
      }
    });
  }

  // Total number of pages
  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  // Array of page numbers (used in template)
  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Products to show in current page
  get pagedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.selectedSubCategory = 'All';

    if (category === 'All') {
      this.filteredProducts = this.products;
      this.subCategories = [];
    } else {
      this.subCategories = [...new Set(this.products
        .filter(p => p.product_type === category)
        .map(p => p.product_category)
        .filter(Boolean))];

      this.filteredProducts = this.products.filter(p => p.product_type === category);
    }

    this.currentPage = 1;
  }

  filterBySubCategory(subCategory: string) {
    this.selectedSubCategory = subCategory;
    this.filteredProducts = this.products.filter(
      p => p.product_type === this.selectedCategory && p.product_category === subCategory
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
}
