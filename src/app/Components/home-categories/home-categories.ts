import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-categories',
  imports: [FormsModule, CommonModule],
  templateUrl: './home-categories.html',
  styleUrl: './home-categories.css'
})

export class HomeCategories implements OnInit {
    categories: Category[] = [];

    constructor(private router: Router){}
    ngOnInit(): void {
      this.categories = [
        {name: 'Blush', url: 'blush' ,image:'images/Blush.jpg'},
        {name: 'Bronzer', url: 'bronzer', image:'images/bronzer.jpg'},
        {name: 'Eyebrow', url: 'eyebrow' ,image:'images/eyebrow.jpg'},
        {name: 'Eyeliner', url: 'eyeliner' ,image:'images/eyeliner.png'},
        {name: 'Eyeshadow', url: 'eyeshadow',image:'images/eyeshadow.png' },
        {name: 'Foundation', url: 'foundation', image:'images/foundation.png' },
        {name: 'Lip liner', url: 'lip_liner', image:'images/lipliner.jpg' },
        {name: 'Lipstick', url: 'lipstick', image:'images/lipstick.jpg' },
        {name: 'Mascara', url: 'mascara', image:'images/mascara.png' },
        {name: 'Nail polish', url: 'nail_polish', image:'images/nailbolish.png' },
      ];
    }

    GoToCategory(category:string){
      this.router.navigate(['/products', category])
    }
}
interface Category{
  name:string
  url:string
  image:string
}
