import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../modules/Product';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CartService } from '../../Services/cart-service';
import { ChangeDetectorRef } from '@angular/core';
import { FavoriteService } from '../../Services/favourite-service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-generic-product-page',
  standalone: true,
  imports: [CommonModule, RouterModule,FormsModule],
  templateUrl: './generic-product-page.html',
  styleUrls: ['./generic-product-page.css']
})
export class GenericProductPage implements OnInit {
  searchQuery: string = '';
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

    favoriteIds = new Set<number>();


  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private favService: FavoriteService,
    private cdr: ChangeDetectorRef,
  ) {}

  openDetail(product: Product | undefined) {
    if (!product || product.id == null) return;
    this.router.navigate(['/product', product.id], { state: { product } });
  }
  
  navigateToProducts() {
    this.router.navigate(['/products']);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const type = params.get('type');
      if(type){
        this.productType = type;
        this.pageTitle = this.productTypeNames[type] ||this.formatProductType(type)
        this.fetchProducts();
      }
    });
    this.favService.items$.subscribe(items => {
    const ids = new Set<number>();
    (items || []).forEach(i => {
      const idNum = Number(i?.productId);
      if (!Number.isNaN(idNum)) ids.add(idNum);
    });
    this.favoriteIds = ids;

    this.cdr.detectChanges();
  });
  }

  private formatProductType(type: string): string {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  fetchProducts() {
  this.loading = true;
  const apiUrl = `https://makeup-api.herokuapp.com/api/v1/products.json?product_type=${this.productType}`;

  this.http.get<Product[]>(apiUrl).subscribe({
    next: (data) => {
      this.processProducts(data);
    },
    error: (err) => {
      console.error(`Error fetching ${this.productType} products from API, trying local data:`, err);
      this.fetchLocalProducts();
    }
  });
}

fetchLocalProducts() {
  const localUrl = './data.json';
  
  this.http.get<Product[]>(localUrl).subscribe({
    next: (data) => {
      // Filter local data by product type
      const filteredData = data.filter(product => 
        product.product_type?.toLowerCase() === this.productType.toLowerCase()
      );
      this.processProducts(filteredData);
    },
    error: (err) => {
      console.error('Error fetching local products:', err);
      this.loading = false;
      this.products = [];
      this.filteredProducts = [];
      this.categories = [];
    }
  });
}

processProducts(data: Product[]) {
  const validProducts: Product[] = [];

  // Convert price/rating to numbers
  const allProducts = data.map(p => ({
    ...p,
    price: Number(p.price) || 0,
    rating: Number(p.rating) || 0,
    isFavorite: false
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

  addToCart(product: Product, event?: MouseEvent) {
  if (event) event.stopPropagation(); 
  if (!product || product.id == null) return;
  const item = {
    productId: product.id,
    name: product.name,
    price: Number(product.price) || 0,
    image: product.image_link ,
    quantity: 1,
    product
  };
  this.cartService.addItem(item);
  alert(`${product.name} added to cart`);
}

isFavorite(product: any): boolean {
  const rawId = product?.id ?? product?.productId;
  const id = rawId == null ? null : Number(rawId);
  if (id == null || Number.isNaN(id)) return false;
  return this.favoriteIds.has(id);
}

toggleFavorite(product: any, event?: MouseEvent) {
  if (event) {
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  }

  const rawId = product?.id ?? product?.productId;
  const id = rawId == null ? null : Number(rawId);
  if (id == null || Number.isNaN(id)) return;

  if (this.favoriteIds.has(id)) {
    this.favoriteIds.delete(id);
  } else {
    this.favoriteIds.add(id);
  }

  this.cdr.detectChanges();

  try {
    const newState = this.favService.toggle(product); // returns boolean

    if (newState !== this.favoriteIds.has(id)) {
      if (newState) this.favoriteIds.add(id);
      else this.favoriteIds.delete(id);
      this.cdr.detectChanges();
    }
  } catch (err) {
    
    console.error('fav toggle error', err);
    // revert optimistic
    if (this.favoriteIds.has(id)) this.favoriteIds.delete(id);
    else this.favoriteIds.add(id);
    this.cdr.detectChanges();
  }
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
  onSearch(event: any) {
  const searchValue = event.target.value.toLowerCase().trim();
  
  this.filteredProducts = this.products.filter(p =>
    p.name?.toLowerCase().includes(searchValue) ||
    p.brand?.toLowerCase().includes(searchValue) ||
    p.category?.toLowerCase().includes(searchValue)
  );
  
  this.currentPage = 1;
}

}