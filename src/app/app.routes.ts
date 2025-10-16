import { Routes } from '@angular/router';
import { ProductPage } from './Components/product-page/product-page';
import { ProductDetails } from './Components/product-details/product-details';

export const routes: Routes = [
  { path: '', component: ProductPage },
  { path: 'product/:id', component: ProductDetails }
];
