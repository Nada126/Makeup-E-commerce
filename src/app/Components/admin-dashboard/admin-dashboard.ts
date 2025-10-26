import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Import Chart.js
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit, OnDestroy {
  productsCount: number = 0;
  reviewsCount: number = 0;
  pendingReviewsCount: number = 0;
  categoriesCount: number = 0;

  // Analytics data
  topRatedProducts: any[] = [];
  reviewDistribution: any = {};
  averageRating: number = 0;
  categoryDistribution: any = {};
  ratingDistribution: any = {};

  private dbUrl = 'http://localhost:3001';
  private jsonUrl = '/data.json';
  private charts: any = {};

  constructor(private router: Router, private http: HttpClient) {}

  async ngOnInit() {
    await this.loadStatistics();
    await this.loadAnalytics();
    this.createCharts();
  }

  ngOnDestroy() {
    // Destroy charts when component is destroyed
    Object.values(this.charts).forEach((chart: any) => {
      if (chart) {
        chart.destroy();
      }
    });
  }

  async loadStatistics() {
    try {
      // Load ONLY from JSON file for accurate counts
      const jsonProducts = await this.loadJsonProducts();
      this.productsCount = jsonProducts.length;

      // Load reviews from DB
      try {
        const reviews = await firstValueFrom(this.http.get<any[]>(`${this.dbUrl}/reviews`));
        this.reviewsCount = reviews.length;
        this.pendingReviewsCount = reviews.filter(review =>
          review.status === 'pending' || !review.status
        ).length;
      } catch (error) {
        console.error('Error loading reviews:', error);
        this.reviewsCount = 0;
        this.pendingReviewsCount = 0;
      }

    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  async loadAnalytics() {
    try {
      // Load products from JSON file ONLY
      const jsonProducts = await this.loadJsonProducts();

      console.log('=== ANALYZING JSON DATA ===');
      console.log('Total products in JSON:', jsonProducts.length);

      // Show first product structure to understand data format
      if (jsonProducts.length > 0) {
        console.log('First product structure:', jsonProducts[0]);
        console.log('All keys in first product:', Object.keys(jsonProducts[0]));
      }

      // Calculate average rating from JSON products
      const productsWithRating = jsonProducts.filter(p => p.rating !== undefined && p.rating !== null);
      if (productsWithRating.length > 0) {
        this.averageRating = productsWithRating.reduce((sum, product) => sum + (product.rating || 0), 0) / productsWithRating.length;
      }

      // Get top rated products from JSON
      this.topRatedProducts = jsonProducts
        .filter(p => p.rating !== undefined && p.rating !== null)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);

      // Calculate category distribution from JSON products only
      this.calculateCategoryDistribution(jsonProducts);

      // Calculate rating distribution from JSON products
      this.calculateRatingDistribution(jsonProducts);

      // Load reviews for distribution
      try {
        const reviews = await firstValueFrom(this.http.get<any[]>(`${this.dbUrl}/reviews`));

        this.reviewDistribution = {
          approved: reviews.filter(r => r.status === 'approved').length,
          pending: reviews.filter(r => r.status === 'pending' || !r.status).length,
          rejected: reviews.filter(r => r.status === 'rejected').length
        };
      } catch (error) {
        console.error('Error loading reviews for analytics:', error);
        this.reviewDistribution = { approved: 0, pending: 0, rejected: 0 };
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  async loadJsonProducts(): Promise<any[]> {
    try {
      const jsonData = await firstValueFrom(this.http.get<any>(this.jsonUrl));
      console.log('=== RAW JSON DATA STRUCTURE ===');
      console.log('Full JSON data:', jsonData);

      // Handle different possible JSON structures
      let products: any[] = [];

      if (Array.isArray(jsonData)) {
        // If the JSON file is directly an array of products
        products = jsonData;
      } else if (jsonData.products && Array.isArray(jsonData.products)) {
        // If the JSON has a products array
        products = jsonData.products;
      } else {
        // If it's a single product or different structure
        products = [jsonData];
      }

      console.log('Final products array length:', products.length);
      return products;

    } catch (error) {
      console.error('Error loading JSON products:', error);
      return [];
    }
  }
calculateCategoryDistribution(products: any[]) {
  const categories: { [key: string]: number } = {};

  console.log('=== CALCULATING CLEAN CATEGORY DISTRIBUTION ===');
  console.log('Total products:', products.length);

  products.forEach((p, index) => {
    // Normalize the category field (like in Manage Products)
    const normalized =
      (p.product_type ||
       p.category ||
       p.productCategory ||
       p.product_category ||
       'Uncategorized')
        .toString()
        .trim()
        .toLowerCase();

    if (!normalized || normalized === 'n/a' || normalized === 'uncategorized') return;

    categories[normalized] = (categories[normalized] || 0) + 1;

    if (index < 10) {
      console.log(`🧩 Product ${index + 1}:`, p.name || p.title || 'Unnamed');
      console.log(`   → Normalized Category: ${normalized}`);
    }
  });

  this.categoryDistribution = categories;
  this.categoriesCount = Object.keys(categories).length;

  console.log('✅ FINAL CATEGORY DISTRIBUTION:', this.categoryDistribution);
  console.log('✅ TOTAL UNIQUE CATEGORIES:', this.categoriesCount);
}


  private findExactCategoryField(product: any): string {
    // List all possible field names that might contain category
    const possibleFields = [
      'category',
      'product_type',
      'type',
      'productCategory',
      'category_name',
      'productCategoryName',
      'classification',
      'group',
      'family'
    ];

    // Check each possible field
    for (const field of possibleFields) {
      if (product[field] && typeof product[field] === 'string') {
        const value = product[field].trim();
        if (value && value !== '') {
          return value;
        }
      }
    }

    // If no category found, check if there are any other string fields that might be categories
    const stringFields = Object.keys(product).filter(key =>
      typeof product[key] === 'string' &&
      product[key].trim() !== '' &&
      !['name', 'title', 'description', 'id', '_id', 'image', 'images'].includes(key)
    );

    if (stringFields.length > 0) {
      console.log('Other possible category fields:', stringFields);
      return product[stringFields[0]] || 'Uncategorized';
    }

    return 'Uncategorized';
  }

  calculateRatingDistribution(products: any[]) {
    const ratings: { [key: string]: number } = {
      '5 Stars': 0,
      '4 Stars': 0,
      '3 Stars': 0,
      '2 Stars': 0,
      '1 Star': 0
    };

    products.forEach(product => {
      if (product.rating !== undefined && product.rating !== null) {
        const rating = Math.floor(Number(product.rating));
        if (rating === 5) ratings['5 Stars']++;
        else if (rating === 4) ratings['4 Stars']++;
        else if (rating === 3) ratings['3 Stars']++;
        else if (rating === 2) ratings['2 Stars']++;
        else if (rating === 1) ratings['1 Star']++;
      }
    });

    this.ratingDistribution = ratings;
    console.log('Rating Distribution:', this.ratingDistribution);
  }

  createCharts() {
    this.createReviewDistributionChart();
    this.createCategoryDistributionChart();
    this.createRatingDistributionChart();
    this.createTopProductsChart();
  }

  createReviewDistributionChart() {
    const ctx = document.getElementById('reviewDistributionChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.charts.reviewDistribution) {
      this.charts.reviewDistribution.destroy();
    }

    this.charts.reviewDistribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [{
          data: [
            this.reviewDistribution.approved || 0,
            this.reviewDistribution.pending || 0,
            this.reviewDistribution.rejected || 0
          ],
          backgroundColor: [
            '#48bb78', // Green for approved
            '#ed8936', // Orange for pending
            '#f56565'  // Red for rejected
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#718096',
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: 'Review Status Distribution',
            color: '#ff6f91',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      }
    });
  }

  createCategoryDistributionChart() {
    const categories = Object.keys(this.categoryDistribution);
    const counts = Object.values(this.categoryDistribution);

    console.log('=== CHART DATA ===');
    console.log('Categories for chart:', categories);
    console.log('Counts for chart:', counts);

    const ctx = document.getElementById('categoryDistributionChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.charts.categoryDistribution) {
      this.charts.categoryDistribution.destroy();
    }

    // Only create chart if we have real data
    if (categories.length === 0 || counts.length === 0) {
      console.error('No category data available for chart');
      return;
    }

    this.charts.categoryDistribution = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Number of Products',
          data: counts,
          backgroundColor: [
            '#ff9a9e', '#fad0c4', '#ff6f91', '#ffb6c1', '#ff8ba7',
            '#ffa8ba', '#ffc2d1', '#ffd6e7', '#ffebf3', '#fff0f5'
          ],
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Products by Category ',
            color: '#ff6f91',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Products: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Products',
              color: '#718096'
            },
            ticks: {
              color: '#718096',
              stepSize: 1
            },
            grid: {
              color: '#f7fafc'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Categories',
              color: '#718096'
            },
            ticks: {
              color: '#718096',
              maxRotation: 45
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  createRatingDistributionChart() {
    const ctx = document.getElementById('ratingDistributionChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.charts.ratingDistribution) {
      this.charts.ratingDistribution.destroy();
    }

    this.charts.ratingDistribution = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
        datasets: [{
          data: [
            this.ratingDistribution['5 Stars'] || 0,
            this.ratingDistribution['4 Stars'] || 0,
            this.ratingDistribution['3 Stars'] || 0,
            this.ratingDistribution['2 Stars'] || 0,
            this.ratingDistribution['1 Star'] || 0
          ],
          backgroundColor: [
            '#48bb78', // Green for 5 stars
            '#68d391', // Light green for 4 stars
            '#ed8936', // Orange for 3 stars
            '#f56565', // Red for 2 stars
            '#e53e3e'  // Dark red for 1 star
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#718096',
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: 'Product Ratings Distribution',
            color: '#ff6f91',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      }
    });
  }

  createTopProductsChart() {
    const productNames = this.topRatedProducts.map(p =>
      p.name?.length > 20 ? p.name.substring(0, 20) + '...' : p.name || 'Unknown Product'
    );
    const ratings = this.topRatedProducts.map(p => p.rating || 0);

    const ctx = document.getElementById('topProductsChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.charts.topProducts) {
      this.charts.topProducts.destroy();
    }

    this.charts.topProducts = new Chart(ctx, {
      type: 'line',
      data: {
        labels: productNames,
        datasets: [{
          label: 'Rating',
          data: ratings,
          backgroundColor: 'rgba(255, 111, 145, 0.1)',
          borderColor: '#ff6f91',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ff6f91',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Top Rated Products',
            color: '#ff6f91',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              color: '#718096',
              stepSize: 1
            },
            grid: {
              color: '#f7fafc'
            }
          },
          x: {
            ticks: {
              color: '#718096'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }


}
