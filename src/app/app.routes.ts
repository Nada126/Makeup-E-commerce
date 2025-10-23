import { Routes } from '@angular/router';
import { ProductPage } from './Components/product-page/product-page';
import { GenericProductPage } from './Components/generic-product-page/generic-product-page';
import { Home } from './Components/home/home';
import { About } from './Components/about/about';
import { Login } from './Components/login/login';
import { Register } from './Components/register/register';
import { NotFound } from './Components/not-found/not-found';
import { ProductDetails } from './Components/product-details/product-details';
import { AdminDashboard } from './Components/admin-dashboard/admin-dashboard';
import { AdminGuard } from './Services/admin-guard';
import { NotAuthorized } from './Components/not-authorized/not-authorized';
import { DataDeletion } from './Components/data-deletion/data-deletion';
import { Cart } from './Components/cart/cart';
import { Favourites } from './Components/favourite/favourite';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full', title: 'Home' },
    { path: 'home', component: Home, title: 'Home' },
    { path: 'products', component: ProductPage, title: 'Products' },
    { path: 'products/:type', component: GenericProductPage, title: 'Product Category' },
    {path: 'product/:id', component: ProductDetails },
    { path: 'about', component: About, title: 'About' },
    { path: 'login', component: Login, title: 'Login' },
    { path: 'register', component: Register, title: 'Register' },
    // { path: 'admin', component: AdminDashboard, title: 'Dashboard', canActivate:[AdminGuard] },
    { path: 'not-authorized', component: NotAuthorized, title: 'Not-Authorized' },
<<<<<<< HEAD
// ✅ Admin routes
{
  path: 'admin',
  canActivate: [AdminGuard],
  children: [
    { path: '', loadComponent: () => import('./Components/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard) },
    { path: 'add-product', loadComponent: () => import('./Components/admin-dashboard/add-product/add-product').then(m => m.AddProduct) },
    { path: 'products', loadComponent: () => import('./Components/admin-dashboard/view-products/view-products').then(m => m.ViewProducts) },
    { path: 'reviews', loadComponent: () => import('./Components/admin-dashboard/manage-reviews/manage-reviews').then(m => m.ManageReviews) },
  ],
},

    { path: '**', component: NotFound, title: 'Not Found' },
];
=======
    { path: 'data-deletion', component: DataDeletion, title: 'Data-Deletion' },
    { path: 'cart', component: Cart, title:'Cart' },
    { path: 'favourites', component: Favourites },

    { path: '**', component: NotFound, title: 'Not Found' }
]
>>>>>>> b601b4a8f7cf20530ccd706749cbc7aeb4b51e8b
