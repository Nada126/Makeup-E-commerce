import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../modules/Product';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FavoriteService } from '../../Services/favorite.service';

@Component({
  selector: 'app-generic-brand-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './generic-brand-page.html',
  styleUrls: ['./generic-brand-page.css'],
})
export class GenericBrandPage implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];

  brandName: string = '';
  pageTitle: string = '';
  categories: string[] = [];
  selectedType = 'All';

  currentPage = 1;
  itemsPerPage = 25;
  loading = false;
  hasProducts = true;

  // Only 10 carefully selected working brands
  brandNames: { [key: string]: string } = {
    'almay': 'Almay',                    
    'annabelle': 'Annabelle',
    'essie': 'Essie',
    'covergirl': 'CoverGirl',
    'nyx': 'NYX',
    'maybelline': 'Maybelline',
    'pacifica': 'Pacifica',
    'revlon': 'Revlon',
    'stila': 'Stila',
    'clinique': 'Clinique'
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    public favoriteService: FavoriteService
  ) {}

  openDetail(product: Product | undefined) {
    if (!product || product.id == null) return;
    this.router.navigate(['/product', product.id], { state: { product } });
  }

  toggleFavorite(product: Product, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (this.favoriteService.isFavorite(product.id)) {
      this.favoriteService.removeFromFavorites(product.id);
      product.isFavorite = false;
    } else {
      this.favoriteService.addToFavorites(product);
      product.isFavorite = true;
    }
  }

  navigateToProducts() {
    this.router.navigate(['/products']);
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const brand = params.get('brand');
      if (brand) {
        this.brandName = brand;
        this.pageTitle = this.brandNames[brand] || this.formatBrandName(brand);
        this.fetchProducts();
      }
    });
  }

  private formatBrandName(brand: string): string {
    return brand
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  fetchProducts() {
    this.loading = true;
    this.hasProducts = true;

    //const url = `https://makeup-api.herokuapp.com/api/v1/products.json?brand=${this.brandName}`;
    const url = './data.json';

    this.http.get<Product[]>(url).subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          this.hasProducts = false;
          this.loading = false;
          return;
        }

        const validProducts: Product[] = [];

        // Convert price/rating to numbers
        const allProducts = data.map((p) => ({
          ...p,
          price: Number(p.price) || 0,
          rating: Number(p.rating) || 0,
          isFavorite: this.favoriteService.isFavorite(p.id),
        }));

        // Check if image exists
        const checkImagePromises = allProducts.map((product) =>
          this.http
            .head(product.image_link || '', { observe: 'response' })
            .toPromise()
            .then(() => validProducts.push(product))
            .catch(() => null)
        );

        Promise.all(checkImagePromises).then(() => {
          this.products = validProducts;
          this.filteredProducts = this.products;

          if (this.products.length === 0) {
            this.hasProducts = false;
          } else {
            // Extract unique categories from the products
            this.categories = [...new Set(this.products.map((p) => p.category).filter(Boolean))];
          }

          console.log(`Available categories for ${this.brandName}:`, this.categories);
          this.loading = false;
        });
      },
      error: (err) => {
        console.error(`Error fetching ${this.brandName} products:`, err);
        this.hasProducts = false;
        this.loading = false;
      },
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
      this.filteredProducts = this.products.filter((p) => {
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
}
