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
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) 
  {

    console.log('RoleGuard constructor');
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const expectedRole = route.data['expectedRole'];
    console.log('Rol esperado:', expectedRole);
    return this.authService.getCurrentUser().pipe(
      tap(user => {
        if (!user || user.id_rol !== expectedRole) {
          this.router.navigate(['/login']);
        }
      }),
      map(user => user && user.id_rol === expectedRole)
    );
  }
}
