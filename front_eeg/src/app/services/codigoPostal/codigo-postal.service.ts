import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CodigoPostalService {

  constructor(private http: HttpClient) { }

  getAddressByPostalCode(postalCode: string, countryCode: string = 'MX'): Observable<any> {
    return this.http.get(`http://api.zippopotam.us/${countryCode}/${postalCode}`);
  }

}
