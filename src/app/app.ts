import { Component, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ProductPage } from "./Components/product-page/product-page";
import { Navbar } from "./Components/navbar/navbar";
import { Footer } from "./Components/footer/footer";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProductPage, Navbar, RouterModule, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('E-commerce');
}
