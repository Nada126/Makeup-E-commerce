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
  categories: string[] = [];
  selectedCategory = 'All';
  searchText = '';
  loading = false;

  // UI state
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  confirmVisible = false;
  productToDelete: any = null;

  private dbUrl = 'http://localhost:3001/products';
  private jsonUrl = '/data.json';

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    await this.loadAllProducts();
  }

  async loadAllProducts(): Promise<void> {
    this.loading = true;
    try {
      // Load DB products
      let dbData: any[] = [];
      try {
        dbData = await firstValueFrom(this.http.get<any[]>(this.dbUrl));
      } catch {
        this.showMessage('Database not available.', 'error');
      }

      this.dbProducts = [];
      for (const p of dbData) {
        if (await this.isImageAvailable(p.image)) {
          this.dbProducts.push({ ...p, source: 'db' });
        }
      }

      // Load JSON products
      let jsonData: any = [];
      try {
        jsonData = await firstValueFrom(this.http.get<any>(this.jsonUrl));
      } catch {
        this.showMessage('Local JSON not found.', 'error');
      }
      const jsonDataArray = jsonData.products || jsonData || [];
      this.jsonProducts = [];
      for (let i = 0; i < jsonDataArray.length; i++) {
        const p = jsonDataArray[i];
        if (await this.isImageAvailable(p.image || p.image_link)) {
          this.jsonProducts.push({
            ...p,
            id: p.id ?? `json-${i}`,
            source: 'json'
          });
        }
      }

      this.combineProducts();
    } finally {
      this.loading = false;
    }
  }

  async isImageAvailable(url: string | undefined): Promise<boolean> {
    if (!url) return false;
    try {
      await firstValueFrom(this.http.head(url, { observe: 'response' }));
      return true;
    } catch {
      return false;
    }
  }

  combineProducts(): void {
    this.products = [...this.dbProducts, ...this.jsonProducts];
    this.applyFilters();
    this.updateCategories();
  }

  updateCategories(): void {
    const mainCategories = new Set<string>();
    this.products.forEach(p => {
      if (p.product_type) mainCategories.add(p.product_type);
    });
    this.categories = Array.from(mainCategories).sort();
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(p => {
      const matchesCategory = this.selectedCategory === 'All' || p.product_type === this.selectedCategory;
      const matchesSearch = !this.searchText || p.name.toLowerCase().includes(this.searchText.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

confirmDelete(product: any) {
  const confirmed = window.confirm(`Are you sure you want to delete "${product.name}"?`);
  if (confirmed) {
    this.productToDelete = product;
    this.deleteConfirmed();
  }
}


  cancelDelete() {
    this.productToDelete = null;
    this.confirmVisible = false;
  }

  deleteConfirmed() {
    if (!this.productToDelete) return;

    if (this.productToDelete.source === 'db') {
      this.http.delete(`${this.dbUrl}/${this.productToDelete.id}`).subscribe({
        next: () => {
          this.dbProducts = this.dbProducts.filter(p => p.id !== this.productToDelete.id);
          this.combineProducts();
          this.showMessage('Product deleted successfully', 'success');
        },
        error: () => this.showMessage('Failed to delete product', 'error')
      });
    } else if (this.productToDelete.source === 'json') {
      this.jsonProducts = this.jsonProducts.filter(p => p.id !== this.productToDelete.id);
      this.combineProducts();
      this.showMessage('JSON product removed successfully', 'success');
    }

    this.productToDelete = null;
    this.confirmVisible = false;
  }

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
    // Update DB product
    this.http.put(`${this.dbUrl}/${prod.id}`, prod).subscribe({
      next: () => {
        const index = this.dbProducts.findIndex(p => String(p.id) === String(prod.id));
        if (index !== -1) this.dbProducts[index] = { ...prod, source: 'db' };
        this.combineProducts();
        this.editingProduct = null;
        this.showMessage('Product updated in DB successfully!', 'success');
      },
      error: () => this.showMessage('Failed to update product', 'error')
    });
  } else if (prod.source === 'json') {
    // Prepare product for DB
    const productToSave = {
      name: prod.name,
      brand: prod.brand,
      price: prod.price,
      category: prod.category || prod.product_type,
      rating: prod.rating ?? 0,
      image: prod.image || prod.image_link,
      product_type: prod.product_type
    };

    // POST JSON product to DB
    this.http.post(this.dbUrl, productToSave).subscribe({
      next: (saved: any) => {
        // Add to dbProducts
        this.dbProducts.push({ ...saved, source: 'db', id: String(saved.id) });
        // Remove from jsonProducts immediately
        this.jsonProducts = this.jsonProducts.filter(p => p.id !== prod.id);
        // Recombine products for display
        this.combineProducts();
        this.editingProduct = null;
        this.showMessage('JSON product migrated to DB successfully!', 'success');
      },
      error: () => this.showMessage('Failed to save product to DB', 'error')
    });
  }
}


  showMessage(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => (this.message = ''), 3000);
  }

  getProductImage(product: any): string {
    return product.image || product.image_link || 'https://via.placeholder.com/100x100?text=No+Image';
  }
}
