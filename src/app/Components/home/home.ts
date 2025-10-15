import { Component } from '@angular/core';
import { SlideShow } from "../slide-show/slide-show";
import { HomeProducts } from "../home-products/home-products";
import { HomeCategories } from "../home-categories/home-categories";

@Component({
  selector: 'app-home',
  imports: [SlideShow, HomeProducts, HomeCategories],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
