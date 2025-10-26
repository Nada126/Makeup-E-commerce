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
  categoriesCount: number = 10;
  
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
      const allProducts = await this.loadAllProducts();
      this.productsCount = allProducts.length;

      // Load reviews
      try {
        const reviews = await firstValueFrom(this.http.get<any[]>(`${this.dbUrl}/reviews`));
        this.reviewsCount = reviews.length;
        this.pendingReviewsCount = reviews.filter(review => 
          review.status === 'pending' || !review.status
        ).length;
      } catch (error) {
        console.error('Error loading reviews:', error);
      }

    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  async loadAnalytics() {
    try {
      const allProducts = await this.loadAllProducts();

      // Calculate average rating
      const productsWithRating = allProducts.filter(p => p.rating);
      if (productsWithRating.length > 0) {
        this.averageRating = productsWithRating.reduce((sum, product) => sum + (product.rating || 0), 0) / productsWithRating.length;
      }

      // Get top rated products
      this.topRatedProducts = allProducts
        .filter(p => p.rating)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);

      // Calculate category distribution
      this.calculateCategoryDistribution(allProducts);

      // Calculate rating distribution
      this.calculateRatingDistribution(allProducts);

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
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  async loadAllProducts(): Promise<any[]> {
    const allProducts: any[] = [];

    // DB products
    try {
      const dbProducts = await firstValueFrom(this.http.get<any[]>(`${this.dbUrl}/products`));
      allProducts.push(...dbProducts);
    } catch (error) {
      console.error('Error loading DB products:', error);
    }

    // JSON products
    try {
      const jsonData = await firstValueFrom(this.http.get<any>(this.jsonUrl));
      const jsonProducts = jsonData.products || jsonData || [];
      allProducts.push(...jsonProducts);
    } catch (error) {
      console.error('Error loading JSON products:', error);
    }

    return allProducts;
  }

  calculateCategoryDistribution(products: any[]) {
    const categories: { [key: string]: number } = {};
    
    products.forEach(product => {
      const category = product.category || product.product_type || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });

    this.categoryDistribution = categories;
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
      if (product.rating) {
        const rating = Math.floor(product.rating);
        if (rating === 5) ratings['5 Stars']++;
        else if (rating === 4) ratings['4 Stars']++;
        else if (rating === 3) ratings['3 Stars']++;
        else if (rating === 2) ratings['2 Stars']++;
        else if (rating === 1) ratings['1 Star']++;
      }
    });

    this.ratingDistribution = ratings;
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

    const ctx = document.getElementById('categoryDistributionChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.charts.categoryDistribution = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Products',
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
            text: 'Products by Category',
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
            ticks: {
              color: '#718096'
            },
            grid: {
              color: '#f7fafc'
            }
          },
          x: {
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
      p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name
    );
    const ratings = this.topRatedProducts.map(p => p.rating || 0);

    const ctx = document.getElementById('topProductsChart') as HTMLCanvasElement;
    if (!ctx) return;

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

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
}