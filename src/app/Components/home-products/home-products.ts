import { Component, OnInit } from '@angular/core';
import { HttpClientModule,HttpClient } from '@angular/common/http';
import { CommonModule} from '@angular/common';

@Component({
  selector: 'app-home-products',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './home-products.html',
  styleUrl: './home-products.css'
})
export class HomeProducts implements OnInit{
  products: any[] = [];
  isLoading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http
    .get<any[]>('http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline')
    .subscribe({
      next: (data) => {
        this.products = data.slice(0,3); 
        this.isLoading = false;        
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
    this.http
    .get<any[]>('https://makeup-api.herokuapp.com/api/v1/products.json?brand=covergirl')
    .subscribe({
      next: (data2) => {
        this.products.push(...data2.slice(0, 3));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching second API', err);
        this.isLoading = false;
      }
    });
  }
}
