import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private loginUrl = 'http://your-django-api-url/user/login/';

constructor(private http: HttpClient) { }

// Login method
login(email: string, password: string) {
  return this.http.post(this.loginUrl, { email, password });
}

// Logout method
logout() {
  // Your logout logic here, like clearing the localStorage
}
}
