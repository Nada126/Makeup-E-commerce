import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:3001/users'; // json-server endpoint

  private currentUserSubject = new BehaviorSubject<any>(this.getCurrentUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private updateCurrentUser(user: any) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  saveUser(userData: any): Observable<any> {
    return this.http.get<any[]>(`${this.baseUrl}?email=${userData.email}`).pipe(
      switchMap((users) => {
        if (users.length === 0) {
          return this.http.post(this.baseUrl, userData).pipe(
            map((savedUser) => {
              this.updateCurrentUser(savedUser);
              return savedUser;
            })
          );
        } else {
          this.updateCurrentUser(users[0]);
          return of(users[0]);
        }
      })
    );
  }

  // ✅ Register user → adds to db.json
  register(userData: any): Observable<boolean> {
    console.log(userData);
    // Check if email already exists
    return this.http.get<any[]>(this.baseUrl).pipe(
      switchMap((users) => {
        const exists = users.find((u) => u.email === userData.email);
        if (exists) return of(false);

        // Assign auto avatar
        userData.avatar = `https://randomuser.me/api/portraits/women/${
          Math.floor(Math.random() * 90) + 1
        }.jpg`;
        userData.role = 'user';
        // Add user to db.json
        return this.http.post(this.baseUrl, userData).pipe(map(() => true));
      })
    );
  }

  // ✅ Login → verifies from db.json
  login(email: string, password: string): Observable<boolean> {
    return this.http.get<any[]>(`${this.baseUrl}?email=${email}&password=${password}`).pipe(
      map((users) => {
        if (users && users.length > 0) {
          const user = users[0];
          localStorage.setItem('token', 'fake-jwt-token');
          // localStorage.setItem('currentUser', JSON.stringify(user));
          this.updateCurrentUser(user)
          return true;
        }
        return false;
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser');

    // both token and user must exist
    if (!token || !user) {
      this.logout();
      return false;
    }
    return true;
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }
}
