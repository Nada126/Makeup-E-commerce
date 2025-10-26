import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-view-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-products.html',
  styleUrls: ['./view-products.css']
})
export class ViewProducts implements OnInit {
  products: any[] = [];
  dbProducts: any[] = [];
  jsonProducts: any[] = [];
  filteredProducts: any[] = [];
  editingProduct: any = null;
  
  // Fixed categories - only these 10 plus "All"
  categories: string[] = [
    'All',
    'lipstick',
    'foundation', 
    'eyeshadow',
    'eyeliner',
    'LipLinear',
    'Bronzer',
    'eyebrow',
    'nail_polish',
    'blush',
    'mascara'
  ];
  
  selectedCategory = 'All';
  searchText = '';
  loading = false;

  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  confirmVisible = false;
  productToDelete: any = null;

  currentPage = 1;
  itemsPerPage = 40;
  totalPages = 0;

  private dbUrl = 'http://localhost:3001/products';
  private jsonUrl = '/data.json';

  constructor(private http: HttpClient) { }

  async ngOnInit() {
    await this.loadAllProducts();
  }

  async loadAllProducts(): Promise<void> {
    this.loading = true;
    try {
      const allProducts: any[] = [];

      // DB products
      try {
        const dbData = await firstValueFrom(this.http.get<any[]>(this.dbUrl));
        this.dbProducts = dbData.map(p => ({
          ...p,
          source: 'db',
          image: p.image || p.image_link,
          // Normalize category to match our fixed list
          category: this.normalizeCategory(p.category || p.product_type)
        }));
        allProducts.push(...this.dbProducts);
      } catch {
        this.showMessage('Database not available.', 'error');
      }

      // JSON products
      try {
        const jsonData = await firstValueFrom(this.http.get<any>(this.jsonUrl));
        const jsonArray = jsonData.products || jsonData || [];
        this.jsonProducts = jsonArray.map((p: any, i: number) => ({
          ...p,
          id: p.id ?? `json-${i}`,
          source: 'json',
          image: p.image || p.image_link,
          // Normalize category to match our fixed list
          category: this.normalizeCategory(p.category || p.product_type)
        }));
        allProducts.push(...this.jsonProducts);
      } catch {
        this.showMessage('Local JSON not found.', 'error');
      }

      // Show all products immediately
      this.products = allProducts;
      await this.filterBrokenImages();
      this.applyFilters();
    } finally {
      this.loading = false;
    }
  }

  /**
   * Normalize category to match our fixed list
   */
  normalizeCategory(category: string): string {
    if (!category) return 'Other';
    
    const lowerCategory = category.toLowerCase().trim();
    
    // Map variations to our fixed categories
    const categoryMap: {[key: string]: string} = {
      'lipstick': 'lipstick',
      'foundation': 'foundation',
      'eyeshadow': 'eyeshadow',
      'eyeliner': 'eyeliner',
      'liplinear': 'LipLinear',
      'lip linear': 'LipLinear',
      'bronzer': 'Bronzer',
      'eyebrow': 'eyebrow',
      'nail polish': 'nail_polish',
      'nail_polish': 'nail_polish',
      'blush': 'blush',
      'mascara': 'mascara'
    };

    return categoryMap[lowerCategory] || 'Other';
  }

  /**
   * Accurate and fast broken-image filtering using HTML Image preload
   */
  async filterBrokenImages(): Promise<void> {
    const validProducts: any[] = [];

    // Use HEAD request (faster than loading images)
    const checkImage = async (url: string): Promise<boolean> => {
      if (!url) return false;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    };

    const results = await Promise.all(
      this.products.map(async p => {
        const ok = await checkImage(p.image);
        return ok ? p : null;
      })
    );

    // Keep only valid images
    this.products = results.filter(Boolean) as any[];
    this.dbProducts = this.dbProducts.filter(p =>
      this.products.some(x => String(x.id) === String(p.id))
    );
    this.jsonProducts = this.jsonProducts.filter(p =>
      this.products.some(x => String(x.id) === String(p.id))
    );

    this.applyFilters();
  }

  applyFilters(page: number = 1) {
    this.filteredProducts = this.products.filter(p => {
      // Category filter - use normalized category field
      const matchesCategory =
        this.selectedCategory === 'All' ||
        p.category === this.selectedCategory;

      // Search filter
      const matchesSearch =
        !this.searchText || 
        p.name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.brand?.toLowerCase().includes(this.searchText.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    this.updatePagination();
    this.currentPage = page;
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters(1); // Reset to first page when filtering
  }

  // ===== EDIT =====
  startEdit(product: any) {
    this.editingProduct = { ...product };
  }
  
  cancelEdit() {
    this.editingProduct = null;
  }
  
  saveEdit() {
    if (!this.editingProduct) return;
    const prod = this.editingProduct;

    if (prod.source === 'db') {
      this.http.put(`${this.dbUrl}/${prod.id}`, prod).subscribe({
        next: () => {
          const index = this.dbProducts.findIndex(p => String(p.id) === String(prod.id));
          if (index !== -1) this.dbProducts[index] = { 
            ...prod, 
            source: 'db',
            category: this.normalizeCategory(prod.category) // Ensure normalized category
          };
          this.combineProducts();
          this.editingProduct = null;
          this.showMessage('Product updated successfully!', 'success');
        },
        error: () => this.showMessage('Failed to update product', 'error')
      });
    } else {
      const newProd = {
        name: prod.name,
        brand: prod.brand,
        price: prod.price,
        category: this.normalizeCategory(prod.category), // Ensure normalized category
        rating: prod.rating ?? 0,
        image: prod.image || prod.image_link,
        product_type: prod.product_type
      };
      this.http.post(this.dbUrl, newProd).subscribe({
        next: (saved: any) => {
          this.dbProducts.push({ ...saved, source: 'db' });
          this.jsonProducts = this.jsonProducts.filter(p => p.id !== prod.id);
          this.combineProducts();
          this.editingProduct = null;
          this.showMessage('Product migrated to DB!', 'success');
        },
        error: () => this.showMessage('Failed to save product', 'error')
      });
    }
  }

  // ===== DELETE =====
  confirmDelete(product: any) {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.productToDelete = product;
      this.deleteConfirmed();
    }
  }

  deleteConfirmed() {
    if (!this.productToDelete) return;

    if (this.productToDelete.source === 'db') {
      this.http.delete(`${this.dbUrl}/${this.productToDelete.id}`).subscribe({
        next: () => {
          this.dbProducts = this.dbProducts.filter(p => p.id !== this.productToDelete.id);
          this.combineProducts();
          this.showMessage('Product deleted', 'success');
        },
        error: () => this.showMessage('Failed to delete', 'error')
      });
    } else {
      this.jsonProducts = this.jsonProducts.filter(p => p.id !== this.productToDelete.id);
      this.combineProducts();
      this.showMessage('JSON product removed', 'success');
    }

    this.productToDelete = null;
  }

  // ===== PAGINATION =====
  get paginatedProducts() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredProducts.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.scrollToTop();
    }
  }
  
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToTop();
    }
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.scrollToTop();
    }
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
  }

  combineProducts(): void {
    this.products = [...this.dbProducts, ...this.jsonProducts].filter(p => p.image);
    this.applyFilters(this.currentPage);
  }

  // ===== HELPERS =====
  getProductImage(product: any): string {
    return (
      product.image ||
      product.image_link ||
      'https://via.placeholder.com/100x100?text=No+Image'
    );
  }

  showMessage(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => (this.message = ''), 3000);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}