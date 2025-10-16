import { Routes } from '@angular/router';
import { ProductPage } from './Components/product-page/product-page';
import { GenericProductPage } from './Components/generic-product-page/generic-product-page';
import { Home } from './Components/home/home';
import { About } from './Components/about/about';

export const routes: Routes = [
  {
    path: '',
    component: ProductPage
  },
  {
    path: ':type', // This will handle ALL product types dynamically
    component: GenericProductPage
  },
    { path: '', redirectTo: 'home', pathMatch: 'full', title: 'Home' },
    { path: 'home', component: Home, title: 'Home' },
    { path: 'about', component: About, title: 'About' }
];
