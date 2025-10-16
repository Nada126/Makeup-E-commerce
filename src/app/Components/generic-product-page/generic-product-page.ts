import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../modules/Product';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-generic-product-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './generic-product-page.html',
  styleUrls: ['./generic-product-page.css']
})
export class GenericProductPage implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];

  productType: string = '';
  pageTitle: string = '';
  categories: string[] = [];
  selectedType = 'All';

  currentPage = 1;
  itemsPerPage = 25;
  loading = false;

  // Map product types to display names
  productTypeNames: { [key: string]: string } = {
    'lipstick': 'Lipstick',
    'lip_liner': 'Lip Liner',
    'foundation': 'Foundation',
    'eyeliner': 'Eyeliner',
    'eyeshadow': 'Eyeshadow',
    'blush': 'Blush',
    'bronzer': 'Bronzer',
    'mascara': 'Mascara',
    'eyebrow': 'Eyebrow',
    'nail_polish': 'Nail Polish'
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  navigateToProducts() {
    this.router.navigate(['/']);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.productType = params['type'];
      this.pageTitle = this.productTypeNames[this.productType] || this.formatProductType(this.productType);
      this.fetchProducts();
    });
  }

  private formatProductType(type: string): string {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  fetchProducts() {
    this.loading = true;
    const url = `https://makeup-api.herokuapp.com/api/v1/products.json?product_type=${this.productType}`;

    this.http.get<Product[]>(url).subscribe({
      next: (data) => {
        const validProducts: Product[] = [];

        // Convert price/rating to numbers
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

          // Extract unique categories from the products
          this.categories = [...new Set(this.products.map(p => p.category).filter(Boolean))];

          console.log(`Available categories for ${this.productType}:`, this.categories);
          this.loading = false;
        });
      },
      error: (err) => {
        console.error(`Error fetching ${this.productType} products:`, err);
        this.loading = false;
      }
    });
  }

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

  filterByType(type: string) {
    this.selectedType = type;

    if (type === 'All') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => {
        if (!p.category) return false;
        const productCategory = p.category.toLowerCase().trim();
        const filterType = type.toLowerCase().trim();
        return productCategory === filterType;
      });
    }

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

  getStarsArray(rating: any): boolean[] {
    const stars = Math.round(Number(rating) || 0);
    return Array.from({ length: 5 }, (_, i) => i < stars);
  }
}
