import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Product } from '../modules/Product';
import { AddedProduct } from '../modules/Added-Product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private localUrl = './data.json';
  private serverUrl = 'http://localhost:3001/products';

  constructor(private http: HttpClient) {}

  fetchAllProducts(): Observable<Product[]> {
    return forkJoin({
      local: this.http.get<Product[]>(this.localUrl),
      server: this.http.get<AddedProduct[]>(this.serverUrl),
    }).pipe(
      map(({ local, server }) => {
        console.log('🟢 Local products:', local.length);
        console.log('🟣 Server products:', server.length);

        const normalizedLocal = local.map((p) => this.normalizeLocal(p));
        const normalizedServer = server.map((p) => this.normalizeServer(p));

        const merged = this.mergeProducts(normalizedLocal, normalizedServer);

        // ✅ Debug checks after merge
        console.log('✅ Total merged products:', merged.length);
        console.log(
          '📦 Products with source=db:',
          merged.filter((p) => (p as any).source === 'db')
        );
        console.log('🧩 Categories:', [...new Set(merged.map((p) => p.category))]);
        console.log(
          '🧩 Missing product_type:',
          merged.filter((p) => !p.product_type)
        );
        return merged;
      }),
      catchError((err) => {
        console.error('Error fetching products:', err);
        return [];
      })
    );
  }
  getServerProductsByType(productType: string) {
    return this.http.get<AddedProduct[]>(this.serverUrl).pipe(
      map((products) => {
        const filtered = products.filter(
          (p) => (p.product_type || '').toLowerCase().trim() === productType.toLowerCase().trim()
        );

        console.log(`🟣 Found ${filtered.length} products of type '${productType}' in JSON server`);
        return filtered;
      })
    );
  }
  private normalizeLocal(p: Product): Product {
    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      rating: p.rating || 0,
      image_link: p.image_link,
      product_type: p.product_type,
      product_category: p.product_category,
      category: p.category,
      isFavorite: p.isFavorite || false,
    };
  }

  private normalizeServer(p: AddedProduct): Product {
    const normalizedType =
    (p.product_type || p.category || '').toLowerCase().replace(/\s+/g, '_');
    return {
      id: Number(p.id) || Math.random(),
      name: p.name,
      brand: p.brand,
      price: p.price ?? 0,
      rating: p.rating ?? 0,
      image_link: p.image || '',
      product_type: normalizedType,
      product_category: p.category,
      category: p.category,
      isFavorite: false,
      source: p.source || 'db',
    } as Product & { source?: string };
  }

  private mergeProducts(local: Product[], server: Product[]): Product[] {
    const mergedMap = new Map<string, Product>();
    for (const p of local) {
      if (p.name) mergedMap.set(p.name.toLowerCase().trim(), p);
    }
    for (const p of server) {
      if (p.name) mergedMap.set(p.name.toLowerCase().trim(), p); // overwrite duplicate
    }
    return Array.from(mergedMap.values());
  }
}
