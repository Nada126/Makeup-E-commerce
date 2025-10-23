import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient, private router: Router) {}

  canActivate(): Observable<boolean> {
    const userId = localStorage.getItem('userId');
    console.log('AdminGuard: Checking access for user:', userId);
    
    if (!userId) {
      console.log('AdminGuard: No user ID, redirecting to login');
      this.router.navigate(['/login']);
      return of(false);
    }

    return this.http.get<any>(`${this.apiUrl}/${userId}`).pipe(
      map((user) => {
        console.log('AdminGuard: User role:', user?.role);
        if (user && user.role === 'admin') {
          console.log('AdminGuard: Access granted');
          return true;
        } else {
          console.log('AdminGuard: Access denied, not admin');
          this.router.navigate(['/not-authorized']);
          return false;
        }
      }),
      catchError((error) => {
        console.log('AdminGuard: Error checking user:', error);
        this.router.navigate(['/not-authorized']);
        return of(false);
      })
    );
  }
}
