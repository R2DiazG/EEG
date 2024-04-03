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
    // Suscripción a eventos del router, filtrando solo los eventos de tipo NavigationEnd
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => {
      // Actualizar el enlace activo basado en la URL después de las redirecciones
      this.activeLink = event.urlAfterRedirects;
    });
  }


  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        // Asegúrate de que tu backend esté enviando 'id_rol' en la respuesta
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


  // Método para comprobar si un enlace está activo
  isActive(url: string): boolean {
    return this.activeLink === url;
  }

  // Método para alternar la visibilidad del sidebar
  toggleSidebar(): void {
    this.isSidebarActive = !this.isSidebarActive;
  }

  // Método para navegar a una ruta específica
  navigateTo(route: string): void {
    console.log('Navegando a:', route);
    this.router.navigate([`/${route}`]);
    this.isSidebarActive = false; // Opcional: Ocultar el sidebar después de la navegación en pantallas pequeñas
  }

  // Método para manejar el cierre de sesión del usuario
  // Método para manejar el cierre de sesión del usuario
logout(): void {
  this.authService.logout();
  console.log('Usuario ha cerrado la sesión');
  // Navegar de vuelta al login después del logout
  this.router.navigate(['/login']);
}

}
