import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Promise<any> {
      const body = JSON.stringify({email, password});
      return this.http.post('/api/login/', body, {
          headers: {
              'Content-Type': 'application/json'
          }
      }).toPromise();
  }

  // Implement logout and password reset methods here...
}
