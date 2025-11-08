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
  styleUrls: ['./view-products.css'],
})
export class ViewProducts implements OnInit {
  products: any[] = [];
  dbProducts: any[] = [];
  jsonProducts: any[] = [];
  filteredProducts: any[] = [];
  editingProduct: any = null;
  categories: string[] = [];
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
        this.dbProducts = dbData.map((p) => ({
          ...p,
          source: 'db',
          image: p.image || p.image_link,
        }));
        allProducts.push(...this.dbProducts);
      } catch (error) {
        console.error('Database error:', error);
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
        }));
        allProducts.push(...this.jsonProducts);
      } catch (error) {
        console.error('JSON error:', error);
        this.showMessage('Local JSON not found.', 'error');
      }

      // Show all products immediately
      this.products = allProducts;

      // ✅ Normalize category names (important fix)
      this.products.forEach((p) => {
        p.product_type = (p.product_type || p.category || p.product_category || 'N/A')
          .toString()
          .trim();

        if (p.product_type !== 'N/A') {
          p.product_type = p.product_type.toLowerCase();
        }
      });

      await this.filterBrokenImages();
      this.updateCategories();
      this.applyFilters();
    } finally {
      this.loading = false;
    }
  }

  /**
   * Accurate and fast broken-image filtering using HTML Image preload
   */
  async filterBrokenImages(): Promise<void> {
    if (this.products.length === 0) return;

    const validProducts: any[] = [];

    // Use HEAD request (faster than loading images)
    const checkImage = async (url: string): Promise<boolean> => {
      if (!url || url === '') return false;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    };

    const results = await Promise.all(
      this.products.map(async (p) => {
        const ok = await checkImage(p.image);
        return ok ? p : null;
      })
    );

    this.products = results.filter(Boolean) as any[];

    this.dbProducts = this.dbProducts.filter((p) =>
      this.products.some((x) => String(x.id) === String(p.id))
    );
    this.jsonProducts = this.jsonProducts.filter((p) =>
      this.products.some((x) => String(x.id) === String(p.id))
    );
    this.updateCategories();
    this.updatePagination();
  }
  updateCategories(): void {
    if (!this.products || this.products.length === 0) {
      this.categories = [];
      return;
    }
    const freq = new Map<string, { original: string; count: number }>();

    this.products.forEach((p) => {
      const raw = (p.product_type ?? p.category ?? p.product_category ?? '').toString().trim();
      if (!raw) return;

      const key = raw.toLowerCase();
      if (!freq.has(key)) freq.set(key, { original: raw, count: 0 });
      freq.get(key)!.count++;
    });

    const freqArr = Array.from(freq.entries()).map(([k, v]) => ({
      key: k,
      label: v.original,
      count: v.count,
    }));
    console.log('🔢 product_type frequencies:', freqArr);
    const THRESHOLD = 2;
    const mainTypes = freqArr.filter((x) => x.count >= THRESHOLD).map((x) => x.label);
    const selectedTypes = mainTypes.length ? mainTypes : freqArr.map((x) => x.label);
    const uniqueSorted = Array.from(new Set(selectedTypes.map((s) => s.trim()))).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    this.categories = ['All', ...uniqueSorted];
  }
  applyFilters(page: number = 1) {
    this.filteredProducts = this.products.filter((p) => {
      const category = p.product_type?.toLowerCase() || 'n/a';
      const matchesCategory =
        this.selectedCategory === 'All' || category === this.selectedCategory.toLowerCase();

      const matchesSearch =
        !this.searchText ||
        p.name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.brand?.toLowerCase().includes(this.searchText.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    this.updatePagination();
    this.currentPage = Math.max(1, Math.min(page, this.totalPages || 1));
  }

  // Also update the saveEdit method to handle categories correctly
  async saveEdit() {
    if (!this.editingProduct) return;
    const prod = this.editingProduct;

    try {
      if (prod.source === 'db') {
        await firstValueFrom(this.http.put(`${this.dbUrl}/${prod.id}`, prod));
        const index = this.dbProducts.findIndex((p) => String(p.id) === String(prod.id));
        if (index !== -1) this.dbProducts[index] = { ...prod, source: 'db' };
        this.combineProducts();
        this.editingProduct = null;
        this.showMessage('Product updated successfully!', 'success');
      } else {
        const newProd = {
          name: prod.name,
          brand: prod.brand,
          price: prod.price,
          category: prod.product_type, // Use product_type as category for DB
          rating: prod.rating ?? 0,
          image: prod.image || prod.image_link,
          product_type: prod.product_type,
        };
        const saved: any = await firstValueFrom(this.http.post(this.dbUrl, newProd));
        this.dbProducts.push({ ...saved, source: 'db' });
        this.jsonProducts = this.jsonProducts.filter((p) => p.id !== prod.id);
        this.combineProducts();
        this.editingProduct = null;
        this.showMessage('Product migrated to DB!', 'success');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showMessage('Failed to save product', 'error');
    }
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters(1); // Reset to page 1 when filtering
  }

  // ===== EDIT =====
  startEdit(product: any) {
    this.editingProduct = { ...product };
  }

  cancelEdit() {
    this.editingProduct = null;
  }

  // ===== DELETE =====

  confirmDelete(product: any) {
    this.productToDelete = product;
    this.confirmVisible = true;
  }

  cancelDelete() {
    this.confirmVisible = false;
    this.productToDelete = null;
  }

  async deleteConfirmed() {
    if (!this.productToDelete) return;

    try {
      if (this.productToDelete.source === 'db') {
        await firstValueFrom(this.http.delete(`${this.dbUrl}/${this.productToDelete.id}`));
        this.dbProducts = this.dbProducts.filter((p) => p.id !== this.productToDelete.id);
        this.combineProducts();
        this.showMessage('Product deleted successfully!', 'success');
      } else {
        this.jsonProducts = this.jsonProducts.filter((p) => p.id !== this.productToDelete.id);
        this.combineProducts();
        this.showMessage('Product removed successfully!', 'success');
      }
    } catch (error) {
      console.error('Delete error:', error);
      this.showMessage('Failed to delete product', 'error');
    } finally {
      this.confirmVisible = false;
      this.productToDelete = null;
    }
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
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  combineProducts(): void {
    this.products = [...this.dbProducts, ...this.jsonProducts].filter((p) => p.image);
    this.products.forEach((p) => {
      p.product_type = (p.product_type || p.category || p.product_category || 'unknown')
        .toString()
        .trim()
        .toLowerCase();
    });
    this.applyFilters(this.currentPage);
  }

  // ===== HELPERS =====
  getProductImage(product: any): string {
    return (
      product.image || product.image_link || 'https://via.placeholder.com/100x100?text=No+Image'
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

  // Add trackBy function for better performance
  trackByProductId(index: number, product: any): string {
    return `${product.source}-${product.id}`;
  }
}
