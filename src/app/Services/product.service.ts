import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Product } from '../modules/Product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://makeup-api.herokuapp.com/api/v1/products.json';
  private localUrl = '/assets/products.json';

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      catchError(() => {
        console.warn('API unavailable, using local data');
        return this.http.get<{products: Product[]}>(this.localUrl).pipe(
          map(data => data.products || data)
        );
      }),
      map(products => products.map(p => ({
        ...p,
        price: Number(p.price) || 0,
        rating: Number(p.rating) || 0
      })))
    );
  }
}
