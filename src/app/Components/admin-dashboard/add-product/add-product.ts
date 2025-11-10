import { CommonModule } from '@angular/common';
import { HttpClient} from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.css']
})
export class AddProduct {
  product = {
    name: '',
    brand: '',
    price: null,
    category: '',
    product_type: '',
    rating: 0,
    image: '',
    description: '',
    stock: null,
  };

  private baseUrl = 'http://localhost:3001/products';
  showSuccessToast = false;

  constructor(private http: HttpClient, private router: Router) { }

  addProduct() {
    if (!this.product.name || !this.product.price || !this.product.product_type) {
      alert('Please fill in all required fields.');
      return;
    }

    const productToAdd = {
      ...this.product,
      price: Number(this.product.price),
      stock: this.product.stock ? Number(this.product.stock) : 0,
      rating: this.product.rating ? Number(this.product.rating) : 0,
      product_type: this.product.product_type?.trim() || '',
      id: String(Date.now()),
      source: 'db'
    };

    this.http.post(this.baseUrl, productToAdd).subscribe({
      next: () => {
        // Reset form
        this.product = {
          name: '',
          brand: '',
          price: null,
          category: 'any',
          product_type: '',
          rating: 0,
          image: '',
          description: '',
          stock: null,
        };
this.showSuccessToast = true;

// Navigate after 2s so user sees the toast
setTimeout(() => {
  this.router.navigateByUrl('/admin/products');
}, 2000);

      },
      error: (err) => {
        console.error('Error adding product:', err);
        alert('❌ Failed to add product.');
      },
    });
  }
}
