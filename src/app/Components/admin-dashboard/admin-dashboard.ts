import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit{
users: any[] = [];
  private baseUrl = 'http://localhost:3001/users';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>(this.baseUrl).subscribe(data => this.users = data);
  }
}
