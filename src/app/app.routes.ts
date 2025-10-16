import { Routes } from '@angular/router';
import { ProductPage } from './Components/product-page/product-page';
import { GenericProductPage } from './Components/generic-product-page/generic-product-page';

export const routes: Routes = [
  {
    path: '',
    component: ProductPage
  },
  {
    path: ':type', // This will handle ALL product types dynamically
    component: GenericProductPage
  }
];
