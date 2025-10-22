import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3001/users'; // json-server endpoint

  constructor(private http: HttpClient) { }

  // ✅ Register user → adds to db.json
  register(userData: any): Observable<boolean> {
    console.log(userData);
    // Check if email already exists
    return this.http.get<any[]>(this.baseUrl).pipe(
      switchMap(users => {
        const exists = users.find(u => u.email === userData.email);
        if (exists) return of(false);

        // Assign auto avatar
        userData.avatar = `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 90) + 1}.jpg`;
        userData.role = 'user'
        // Add user to db.json
        return this.http.post(this.baseUrl, userData).pipe(
          map(() => true)
        );
      })
    );
  }

    // Observable for login state changes
  private loginState = new BehaviorSubject<boolean>(this.isLoggedIn());
  loginState$ = this.loginState.asObservable();

  // ✅ Login → verifies from db.json
  login(email: string, password: string): Observable<boolean> {
    return this.http.get<any[]>(`${this.baseUrl}?email=${email}&password=${password}`).pipe(
      map(users => {
        if (users.length > 0) {
          const user = users[0];
          localStorage.setItem('token', 'fake-jwt-token');
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.loginState.next(true); // Notify login state change
          return true;
        }
        return false;
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.loginState.next(false); // Notify login state change
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }
}
