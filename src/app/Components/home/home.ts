import { Component } from '@angular/core';
import { SlideShow } from "../slide-show/slide-show";
import { HomeProducts } from "../home-products/home-products";

@Component({
  selector: 'app-home',
  imports: [SlideShow, HomeProducts],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
