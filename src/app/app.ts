import { Component, signal } from '@angular/core';
import { ProductPage } from './Components/product-page/product-page';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductPage],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('E-commerce');
}
