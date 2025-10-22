import { Routes } from '@angular/router';
import { ProductPage } from './Components/product-page/product-page';
import { GenericProductPage } from './Components/generic-product-page/generic-product-page';
import { Home } from './Components/home/home';
import { About } from './Components/about/about';
import { Login } from './Components/login/login';
import { Register } from './Components/register/register';
import { NotFound } from './Components/not-found/not-found';
import { ProductDetails } from './Components/product-details/product-details';
import { GenericBrandPage } from './Components/generic-brand-page/generic-brand-page';
import { Favorite } from './Components/favorite/favorite';
import { AdminDashboard } from './Components/admin-dashboard/admin-dashboard';
import { AdminGuard } from './Services/admin-guard';
import { NotAuthorized } from './Components/not-authorized/not-authorized';
import { PaymentComponent } from './Components/payment/payment';
import { CartComponent } from './Components/cart/cart';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full', title: 'Home' },
  { path: 'home', component: Home, title: 'Home' },
  { path: 'products', component: ProductPage, title: 'Products' },
  { path: 'products/:type', component: GenericProductPage, title: 'Product Category' },
  { path: 'brand/:brand', component: GenericBrandPage, title: 'Brand Products' }, // Add this route
  { path: 'product/:id', component: ProductDetails },
  { path: 'favorites', component: Favorite, title: 'My Favorites' }, // Add this line
  { path: 'about', component: About, title: 'About' },
  { path: 'login', component: Login, title: 'Login' },
  { path: 'register', component: Register, title: 'Register' },
  { path: 'cart', component: CartComponent, title: 'Cart' },
  { path: 'payment', component: PaymentComponent, title: 'Payment' },
  { path: 'admin', component: AdminDashboard, title: 'Dashboard', canActivate: [AdminGuard] },
  { path: 'not-authorized', component: NotAuthorized, title: 'Not-Authorized' },
  { path: '**', component: NotFound, title: 'Not Found' },
];
