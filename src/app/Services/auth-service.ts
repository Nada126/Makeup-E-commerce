import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() {}

  register(userData: any): boolean {
    if (!userData.name || !userData.email || !userData.password) {
      userData.message = '⚠️ All fields are required!';
      return false;
    }
    const users = this.getUsers();
    const exists = users.find(u => u.email === userData.email);
    if (exists) return false;

    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  }

  login(email: string, password: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  }

  isLoggedIn(): boolean {
    console.log(!!localStorage.getItem('token'));
    return !!localStorage.getItem('token');
  }

  private getUsers(): any[] {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }
}
