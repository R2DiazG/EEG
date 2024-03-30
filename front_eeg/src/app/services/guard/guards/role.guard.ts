import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { AuthService } from '../../login/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Aquí usamos la sintaxis de corchetes para acceder a 'expectedRole'
    const expectedRole = route.data['expectedRole'];

    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (user && user.id_rol === expectedRole) {
          // Si el rol coincide, permitir el acceso
          return true;
        } else {
          // Si no coincide, redirigir al login y negar acceso
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
