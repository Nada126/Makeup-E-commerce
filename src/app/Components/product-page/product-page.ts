// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { Product } from '../../../app/modules/Product';
// import { Router, RouterModule } from '@angular/router';
// import { FavoriteService } from '../../Services/favorite.service';


// @Component({
//   selector: 'app-product-page',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './product-page.html',
//   styleUrls: ['./product-page.css'],
// })
// export class ProductPage implements OnInit {
//   handleCategoryClick(category: string) {
//     // List of product types that should navigate to their own pages
//     const specialProductTypes = [
//       'lipstick',
//       'lip_liner',
//       'foundation',
//       'eyeliner',
//       'eyeshadow',
//       'blush',
//       'bronzer',
//       'mascara',
//       'eyebrow',
//       'nail_polish',
//     ];

//     if (specialProductTypes.includes(category)) {
//       this.navigateToProductType(category);
//     } else {
//       this.filterByCategory(category);
//     }
//   }

//   products: Product[] = [];
//   filteredProducts: Product[] = [];
//   categories: string[] = [];
//   subCategories: string[] = [];
//   selectedCategory = 'All';
//   selectedSubCategory = 'All';

//   currentPage = 1;
//   itemsPerPage = 25;
//   loading = false;

//   constructor(private http: HttpClient, private router: Router,public favoriteService: FavoriteService,) {}

//   openDetail(product: Product | undefined) {
//     if (!product || product.id == null) return;
//     this.router.navigate(['/product', product.id], { state: { product } });
//   }

//   navigateToProductType(productType: string) {
//     this.router.navigate(['/products', productType]);
//   }

//   ngOnInit() {
//     this.fetchProducts();
//       if (this.products) {
//     this.products.forEach(product => {
//       product.isFavorite = this.favoriteService.isFavorite(product.id);
//     });
//   }
//   }

//   fetchProducts() {
//     this.loading = true;
//     const url = 'https://makeup-api.herokuapp.com/api/v1/products.json';

//     this.http.get<Product[]>(url).subscribe({
//       next: (data) => {
//         const validProducts: Product[] = [];

//         const allProducts = data.map((p) => ({
//           ...p,
//           price: Number(p.price) || 0,
//           rating: Number(p.rating) || 0,
//           isFavorite: false,
//         }));

//         // Check if image exists
//         const checkImagePromises = allProducts.map((product) =>
//           this.http
//             .head(product.image_link || '', { observe: 'response' })
//             .toPromise()
//             .then(() => validProducts.push(product))
//             .catch(() => null)
//         );

//         Promise.all(checkImagePromises).then(() => {
//           this.products = validProducts;
//           this.filteredProducts = this.products;
//           this.categories = [...new Set(this.products.map((p) => p.product_type).filter(Boolean))];
//           this.loading = false;
//         });
//       },
//       error: (err) => {
//         console.error('Error fetching products:', err);
//         this.loading = false;
//       },
//     });
//   }

// toggleFavorite(product: Product, event?: Event) {
//   if (event) {
//     event.stopPropagation(); // Prevent card click when clicking favorite
//   }

//   if (this.favoriteService.isFavorite(product.id)) {
//     this.favoriteService.removeFromFavorites(product.id);
//     product.isFavorite = false;
//   } else {
//     this.favoriteService.addToFavorites(product);
//     product.isFavorite = true;
//   }
// }

//   // pagination
//   // ... rest of your existing methods
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

//   filterByAll() {
//     this.filteredProducts = this.products;
//     this.selectedCategory = 'All';
//     this.subCategories = [];
//   }

//   filterByCategory(category: string) {
//     this.selectedCategory = category;
//     this.selectedSubCategory = 'All';

//     if (category === 'All') {
//       this.filteredProducts = this.products;
//       this.subCategories = [];
//     } else {
//       this.subCategories = [
//         ...new Set(
//           this.products
//             .filter((p) => p.product_type === category)
//             .map((p) => p.product_category)
//             .filter(Boolean)
//         ),
//       ];

//       this.filteredProducts = this.products.filter((p) => p.product_type === category);
//     }

//     this.currentPage = 1;
//   }

//   filterBySubCategory(subCategory: string) {
//     this.selectedSubCategory = subCategory;
//     this.filteredProducts = this.products.filter(
//       (p) => p.product_type === this.selectedCategory && p.product_category === subCategory
//     );
//     this.currentPage = 1;
//   }

//   changePage(page: number) {
//     if (page >= 1 && page <= this.totalPages) {
//       this.currentPage = page;
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   }

//   // addToCart(product: Product) {
//   //   alert(${product.name} added to cart!);
//   // }

//   sortByPrice(event: any) {
//     const value = event.target.value;
//     if (value === 'low-high') {
//       this.filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
//     } else if (value === 'high-low') {
//       this.filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
//     }
//     this.currentPage = 1;
//   }

//   sortByRating(event: any) {
//     const value = event.target.value;
//     if (value === 'low-high') {
//       this.filteredProducts.sort((a, b) => Number(a.rating) - Number(b.rating));
//     } else if (value === 'high-low') {
//       this.filteredProducts.sort((a, b) => Number(b.rating) - Number(a.rating));
//     }
//     this.currentPage = 1;
//   }

//   getStarsArray(rating: any): boolean[] {
//     const stars = Math.round(Number(rating) || 0);
//     return Array.from({ length: 5 }, (_, i) => i < stars);
//   }
//   getCategoryIcon(category: string): string {
//     switch (category.toLowerCase()) {
//       case 'lipstick':
//         return 'bi bi-brush';
//       case 'eyeshadow':
//         return 'bi bi-palette';
//       case 'blush':
//         return 'bi bi-circle-half';
//       case 'foundation':
//         return 'bi bi-droplet';
//       default:
//         return 'bi bi-tag';
//     }
//   }
// }

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../../app/modules/Product';
import { Router, RouterModule } from '@angular/router';
import { FavoriteService } from '../../Services/favorite.service';
import { ProductService } from '../../Services/product.service';


@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-page.html',
  styleUrls: ['./product-page.css'],
})
export class ProductPage implements OnInit {
  handleCategoryClick(category: string) {
    // List of product types that should navigate to their own pages
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

  constructor(private http: HttpClient, private router: Router,public favoriteService: FavoriteService,  private productService: ProductService,
) {}

  openDetail(product: Product | undefined) {
    if (!product || product.id == null) return;
    this.router.navigate(['/product', product.id], { state: { product } });
  }

  navigateToProductType(productType: string) {
    this.router.navigate(['/products', productType]);
  }

  ngOnInit() {
    this.fetchProducts();
      if (this.products) {
    this.products.forEach(product => {
      product.isFavorite = this.favoriteService.isFavorite(product.id);
    });
  }
  }

  // fetchProducts() {
  //   this.loading = true;
  //   const url = 'https://makeup-api.herokuapp.com/api/v1/products.json';

  //   this.http.get<Product[]>(url).subscribe({
  //     next: (data) => {
  //       const validProducts: Product[] = [];

  //       const allProducts = data.map((p) => ({
  //         ...p,
  //         price: Number(p.price) || 0,
  //         rating: Number(p.rating) || 0,
  //         isFavorite: false,
  //       }));

  //       // Check if image exists
  //       const checkImagePromises = allProducts.map((product) =>
  //         this.http
  //           .head(product.image_link || '', { observe: 'response' })
  //           .toPromise()
  //           .then(() => validProducts.push(product))
  //           .catch(() => null)
  //       );

  //       Promise.all(checkImagePromises).then(() => {
  //         this.products = validProducts;
  //         this.filteredProducts = this.products;
  //         this.categories = [...new Set(this.products.map((p) => p.product_type).filter(Boolean))];
  //         this.loading = false;
  //       });
  //     },
  //     error: (err) => {
  //       console.error('Error fetching products:', err);
  //       this.loading = false;
  //     },
  //   });
  // }

toggleFavorite(product: Product, event?: Event) {
  if (event) {
    event.stopPropagation(); // Prevent card click when clicking favorite
  }

  if (this.favoriteService.isFavorite(product.id)) {
    this.favoriteService.removeFromFavorites(product.id);
    product.isFavorite = false;
  } else {
    this.favoriteService.addToFavorites(product);
    product.isFavorite = true;
  }
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


  fetchProducts() {
  this.loading = true;

  this.productService.getProducts().subscribe({
    next: (products) => {
      this.products = products.map(p => ({
        ...p,
        isFavorite: this.favoriteService.isFavorite(p.id)
      }));
      this.filteredProducts = this.products;
      this.categories = [...new Set(this.products.map((p) => p.product_type).filter(Boolean))];
      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading products:', err);
      this.loading = false;
    }
  });
}
//   fetchProducts() {
//   this.loading = true;

//   const apiUrl = 'https://makeup-api.herokuapp.com/api/v1/products.json';
//   const fallbackUrl = '/assets/products.json'; // Path to your local file

//   // First try the API
//   this.http.get<Product[]>(apiUrl).subscribe({
//     next: (data) => {
//       console.log('✅ API connected successfully, using live data');
//       this.processProducts(data);
//     },
//     error: (err) => {
//       console.warn('❌ API is down, falling back to local data');
//       // If API fails, try local JSON file
//       this.http.get<any>(fallbackUrl).subscribe({
//         next: (localData) => {
//           console.log('✅ Using local products data');
//           this.processProducts(localData.products || localData);
//         },
//         error: (localErr) => {
//           console.error('❌ Both API and local data failed:', localErr);
//           this.loading = false;
//           // You could show a user-friendly error message here
//         }
//       });
//     }
//   });
// }

// Helper method to process products from either source
private processProducts(products: Product[]) {
  const validProducts: Product[] = [];

  const allProducts = products.map((p) => ({
    ...p,
    price: Number(p.price) || 0,
    rating: Number(p.rating) || 0,
    isFavorite: this.favoriteService.isFavorite(p.id),
  }));

  // Check if images exist (only for API products, skip for local)
  if (products.length > 0 && products[0].id !== 1) { // Simple check if it's API data
    const checkImagePromises = allProducts.map((product) =>
      this.http
        .head(product.image_link || '', { observe: 'response' })
        .toPromise()
        .then(() => validProducts.push(product))
        .catch(() => null)
    );

    Promise.all(checkImagePromises).then(() => {
      this.finalizeProductLoading(validProducts);
    });
  } else {
    // For local data, skip image validation
    this.finalizeProductLoading(allProducts);
  }
}

// Helper method to finalize the loading process
private finalizeProductLoading(products: Product[]) {
  this.products = products;
  this.filteredProducts = this.products;
  this.categories = [...new Set(this.products.map((p) => p.product_type).filter(Boolean))];
  this.loading = false;

  console.log(`📊 Loaded ${this.products.length} products`);
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

  addToCart(product: Product) {
    // Get existing cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Check if product already exists in cart
    const existingProductIndex = cart.findIndex((item: any) => item.id === product.id);

    if (existingProductIndex > -1) {
      // Product already in cart, could increment quantity here if needed
      alert(`${product.name} is already in your cart.`);
    } else {
      // Add new product to cart
      cart.push(product);
      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`${product.name} has been added to the cart.`);
    }

    // Navigate to cart page
    this.router.navigate(['/cart']);
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
}
