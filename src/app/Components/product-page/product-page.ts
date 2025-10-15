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
  itemsPerPage = 30; // show 50 per page
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
      const validProducts: Product[] = [];

      // convert price/rating to numbers
      const allProducts = data.map(p => ({
        ...p,
        price: Number(p.price) || 0,
        rating: Number(p.rating) || 0
      }));

      // Check if image exists
      const checkImagePromises = allProducts.map(product =>
        this.http.head(product.image_link || '', { observe: 'response' }).toPromise()
          .then(() => validProducts.push(product))
          .catch(() => null) 
      );

      Promise.all(checkImagePromises).then(() => {
        this.products = validProducts;
        this.filteredProducts = this.products;
        this.categories = [...new Set(this.products.map(p => p.product_type).filter(Boolean))];
        this.loading = false;
      });
    },
    error: (err) => {
      console.error('Error fetching products:', err);
      this.loading = false;
    }
  });
}


  // pagination
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

 sortByPrice(event: any) {
  const value = event.target.value;
  if (value === 'low') {
    this.filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (value === 'high') {
    this.filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
  }
this.currentPage = 1;
}

sortByRating(event: any) {
  const value = event.target.value;
  if (value === 'low') {
    this.filteredProducts.sort((a, b) => Number(a.rating) - Number(b.rating));
  } else if (value === 'high') {
    this.filteredProducts.sort((a, b) => Number(b.rating) - Number(a.rating));
  }
this.currentPage = 1;
}

getStarsArray(rating: any): boolean[] {
  const stars = Math.round(Number(rating) || 0);
  return Array.from({ length: 5 }, (_, i) => i < stars);
}
getCategoryIcon(category: string): string {
  switch(category.toLowerCase()) {
    case 'lipstick': return 'bi bi-brush';
    case 'eyeshadow': return 'bi bi-palette';
    case 'blush': return 'bi bi-circle-half';
    case 'foundation': return 'bi bi-droplet';
    default: return 'bi bi-tag';
  }
}


}
