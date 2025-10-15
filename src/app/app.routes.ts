import { Routes } from '@angular/router';
import { Home } from './Components/home/home';
import { About } from './Components/about/about';
export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full', title: 'Home' },
    { path: 'home', component: Home, title: 'Home' },
    { path: 'about', component: About, title: 'About' }
];
