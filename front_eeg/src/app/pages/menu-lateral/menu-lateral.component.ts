import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/login/auth.service';
import { access } from 'fs';

@Component({
  selector: 'app-menu-lateral',
  templateUrl: './menu-lateral.component.html',
  styleUrls: ['./menu-lateral.component.scss']
})
export class MenuLateralComponent {
  isSidebarActive: boolean = false;
  activeLink: string | undefined;
  userInfo: { nombre: string, apellidos: string, id_rol: number } | undefined;


  constructor(private router: Router, private authService: AuthService) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.activeLink = event.urlAfterRedirects;
    });
  }


  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.userInfo = { 
          nombre: user.nombre, 
          apellidos: user.apellidos, 
          id_rol: user.id_rol 
        };
        console.log('Usuario actual:', this.userInfo);
      },
      error: (error) => {
        console.error('Error al obtener información del usuario:', error);
      }
    });
  }

  isActive(url: string): boolean {
    return this.activeLink === url;
  }

  toggleSidebar(): void {
    this.isSidebarActive = !this.isSidebarActive;
  }

  navigateTo(route: string): void {
    console.log('Navegando a:', route);
    this.router.navigate([`/${route}`]);
    this.isSidebarActive = false;
  }

logout(): void {
  this.authService.logout();
  console.log('Usuario ha cerrado la sesión');
  this.router.navigate(['/login']);
}

}
