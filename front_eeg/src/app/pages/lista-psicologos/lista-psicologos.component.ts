import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuarios/usuario.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-lista-psicologos',
  templateUrl: './lista-psicologos.component.html',
  styleUrls: ['./lista-psicologos.component.scss'],
})
export class ListaPsicologosComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'apellidos', 'username', 'correo', 'id_rol', 'aprobacion'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }  

  loadUsers() {
    // Comprueba si window está definido, lo que indica que estamos en el navegador
    if (typeof window !== 'undefined') {
      console.log('Token from localStorage:', localStorage.getItem('access_token'));
      this.usuarioService.obtenerUsuarios().subscribe({
        next: (data) => {
          this.dataSource.data = data;
        },
        error: (error) => {
          console.error('Error al recuperar usuarios:', error);
        }
      });
    } else {
      // Maneja el caso cuando no estás en un entorno de navegador, si es necesario
      console.log('localStorage no está disponible en este entorno.');
    }
  }

  toggleAprobacion(user: any): void {
    // Guarda el estado original de aprobación en caso de que necesitemos revertirlo
    const originalAprobacion = user.aprobacion;
  
    // Cambia el estado de aprobación en el front end primero para reactividad de la UI
    user.aprobacion = !user.aprobacion;
  
    // Llama al servicio para actualizar el estado de aprobación en el backend
    this.usuarioService.cambiarAprobacionUsuario(user.id_usuario, !user.aprobacion).subscribe({
      next: (response) => {
        // Actualización exitosa
        console.log('Aprobación actualizada correctamente', response);
      },
      error: (error) => {
        // En caso de error, revierte al estado original
        user.aprobacion = originalAprobacion;
        console.error('Error al actualizar la aprobación', error);
        // Informar al usuario del fallo mediante una notificación/alerta
      }
    });
  }
  
  getRoleName(idRol: number): string {
    switch (idRol) {
      case 1:
        return 'Admin';
      case 2:
        return 'Psicólogo';
      default:
        return 'Desconocido';
    }
  }

  registerPatient() {
    this.router.navigate(['/registrar-paciente']); // Navega a la ruta de registrar paciente
  }

  viewDetails(user: any) { // Asegúrate de pasar el usuario a la función
    // Aquí podrías pasar el ID del usuario o cualquier otra información relevante
    this.router.navigate(['/ver-paciente', user.id]); // Suponiendo que cada usuario tiene una propiedad 'id'
  }
}