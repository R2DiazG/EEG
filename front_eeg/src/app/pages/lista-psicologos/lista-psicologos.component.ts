import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuarios/usuario.service';

@Component({
  selector: 'app-lista-psicologos',
  templateUrl: './lista-psicologos.component.html',
  styleUrls: ['./lista-psicologos.component.scss']
})
export class ListaPsicologosComponent implements OnInit {
  users: any[] = []; // Cambiado de patients a users para coincidir con tu caso de uso

  constructor(
    private usuarioService: UsuarioService, // Inyectar el servicio de usuarios
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (data) => {
        this.users = data; // Asigna la respuesta a la propiedad users
      },
      error: (error) => {
        console.error('Error al recuperar usuarios:', error);
      }
    });
  }

  registerPatient() {
    this.router.navigate(['/registrar-paciente']); // Navega a la ruta de registrar paciente
  }

  viewDetails(user: any) { // Asegúrate de pasar el usuario a la función
    // Aquí podrías pasar el ID del usuario o cualquier otra información relevante
    this.router.navigate(['/ver-paciente', user.id]); // Suponiendo que cada usuario tiene una propiedad 'id'
  }
}