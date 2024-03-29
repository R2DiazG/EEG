import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-lista-pacientes',
  templateUrl: './lista-pacientes.component.html',
  styleUrl: './lista-pacientes.component.scss'
})
export class ListaPacientesComponent {
  //displayedColumns: string[] = ['nombre', 'apellidos', 'username', 'correo', 'id_rol', 'aprobacion'];
  // dataSource = new MatTableDataSource<any>([]);

  // @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor( private router: Router,) {}

  // ngOnInit(): void {
  //   this.loadUsers();
  // }

  // ngAfterViewInit() {
  //   if (this.paginator) {
  //     this.dataSource.paginator = this.paginator;
  //   }
  // }  

  // loadUsers() {
  //   this.usuarioService.obtenerUsuarios().subscribe({
  //     next: (data) => {
  //       this.dataSource.data = data;
  //     },
  //     error: (error) => {
  //       console.error('Error al recuperar usuarios:', error);
  //     }
  //   });
  // }

  // toggleAprobacion(user: any): void {
  //   // Almacena el estado original en caso de que necesitemos revertir
  //   const originalAprobacion = user.aprobacion;
  
  //   // Actualiza localmente la aprobación
  //   user.aprobacion = !user.aprobacion;
  
  //   // Actualiza el usuario en el backend
  //   this.usuarioService.actualizarUsuario(user.id_usuario, { aprobacion: user.aprobacion })
  //     .subscribe({
  //       next: (response) => {
  //         // Aquí podrías manejar la respuesta del backend si es necesario
  //         console.log('Estado de aprobación actualizado', response);
  //       },
  //       error: (error) => {
  //         // Revertir el cambio en caso de error
  //         user.aprobacion = originalAprobacion;
  //         console.error('Error al actualizar el estado de aprobación', error);
  //       }
  //     });
  // }  

  // getRoleName(idRol: number): string {
  //   switch (idRol) {
  //     case 1:
  //       return 'Admin';
  //     case 2:
  //       return 'Psicólogo';
  //     default:
  //       return 'Desconocido';
  //   }
  // }

  registerPatient() {
    this.router.navigate(['/registrar-paciente']); // Navega a la ruta de registrar paciente
  }

  viewDetails() { // Asegúrate de pasar el usuario a la función
    // Aquí podrías pasar el ID del usuario o cualquier otra información relevante
    this.router.navigate(['/ver-paciente']); // Suponiendo que cada usuario tiene una propiedad 'id'
  }
}
