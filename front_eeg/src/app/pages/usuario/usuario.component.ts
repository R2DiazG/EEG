import { Component } from '@angular/core';
import { AuthService } from '../../services/login/auth.service';

@Component({
  selector: 'app-usuario',
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent {

  isSidebarActive: boolean = false;
  activeLink: string | undefined;
  userInfo: { nombre: string, apellidos: string, id_rol: number } | undefined;

  constructor(private authService: AuthService) { }

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

}