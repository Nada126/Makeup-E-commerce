// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { Product } from '../../../app/modules/Product';
// import { Router, RouterModule } from '@angular/router'; // Make sure Router is imported

// @Component({
//   selector: 'app-lipstick-page',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './lipstick-page.html',
//   styleUrls: ['./lipstick-page.css']
// })
// export class LipstickPage implements OnInit {
//   products: Product[] = [];
//   filteredProducts: Product[] = [];

//   // These should match the 'category' values from the API
//   lipCategories: string[] = ['lipstick', 'lip_gloss', 'liquid', 'lip_stain'];
//   selectedType = 'All';

//   currentPage = 1;
//   itemsPerPage = 25;
//   loading = false;

//   constructor(private http: HttpClient, private router: Router) {} // Add Router here

//   // Add navigation method to go back to main products
//   navigateToProducts() {
//     this.router.navigate(['/']);
//   }

//   ngOnInit() {
//     this.fetchLipProducts();
//   }

//   fetchLipProducts() {
//     this.loading = true;
//     const url = 'https://makeup-api.herokuapp.com/api/v1/products.json?product_type=lipstick';

//     this.http.get<Product[]>(url).subscribe({
//       next: (data) => {
//         this.products = data;
//         this.filteredProducts = data;

//         // Debug: Check what categories are actually available
//         const availableCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
//         console.log('Available categories in data:', availableCategories);

//         // Also check what product_category contains
//         const availableProductCategories = [...new Set(data.map(p => p.product_category).filter(Boolean))];
//         console.log('Available product_categories in data:', availableProductCategories);

//         this.loading = false;
//       },
//       error: (err) => {
//         console.error('Error fetching lip products:', err);
//         this.loading = false;
//       }
//     });
//   }

//   get totalPages(): number {
//     return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
//   }

//   get totalPagesArray(): number[] {
//     return Array.from({ length: this.totalPages }, (_, i) => i + 1);
//   }

//   get pagedProducts(): Product[] {
//     const start = (this.currentPage - 1) * this.itemsPerPage;
//     return this.filteredProducts.slice(start, start + this.itemsPerPage);
//   }

//   filterByType(type: string) {
//     this.selectedType = type;

//     if (type === 'All') {
//       this.filteredProducts = this.products;
//     } else {
//       // Filter by the 'category' field from the API
//       this.filteredProducts = this.products.filter(p => {
//         if (!p.category) return false;

//         const productCategory = p.category.toLowerCase().trim();
//         const filterType = type.toLowerCase().trim();

//         return productCategory === filterType;
//       });
//     }

//     console.log(`Filtered by ${type}:`, this.filteredProducts.length, 'products found');
//     this.currentPage = 1;
//   }

//   changePage(page: number) {
//     if (page >= 1 && page <= this.totalPages) {
//       this.currentPage = page;
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   }

//   addToCart(product: Product) {
//     alert(`${product.name} added to cart!`);
//   }
// }
