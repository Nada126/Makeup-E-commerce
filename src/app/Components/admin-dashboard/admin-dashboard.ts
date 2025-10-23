import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard {
  
  constructor(private router: Router) {}

  logout() {
    // Clear admin authentication
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    
    // Redirect to login page
    this.router.navigate(['/login']);
  }
}