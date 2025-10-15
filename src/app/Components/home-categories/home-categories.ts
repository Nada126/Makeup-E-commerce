import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home-categories',
  imports: [FormsModule, CommonModule],
  templateUrl: './home-categories.html',
  styleUrl: './home-categories.css'
})

export class HomeCategories implements OnInit {
    categories: Category[] = [];

  ngOnInit(): void {
    this.categories = [
      {name: 'Blush', url: '' ,image:'images/Blush.jpg'},
      {name: 'Bronzer', url: '', image:'images/bronzer.jpg'},
      {name: 'Eyebrow', url: '' ,image:'images/eyebrow.jpg'},
      {name: 'Eyeliner', url: '' ,image:'images/eyeliner.png'},
      {name: 'Eyeshadow', url: '',image:'images/eyeshadow.png' },
      {name: 'Foundation', url: '', image:'images/foundation.png' },
      {name: 'Lip liner', url: '', image:'images/lipliner.jpg' },
      {name: 'Lipstick', url: '', image:'images/lipstick.jpg' },
      {name: 'Mascara', url: '', image:'images/mascara.png' },
      {name: 'Nail polish', url: '', image:'images/nailbolish.png' },
    ];
  }
}
interface Category{
  name:string
  url:string
  image:string
}
