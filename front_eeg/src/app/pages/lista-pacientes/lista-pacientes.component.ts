import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuarios/usuario.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ChangeDetectorRef } from '@angular/core';
import { set } from 'date-fns';
import { access } from 'fs';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-lista-pacientes',
  templateUrl: './lista-pacientes.component.html',
  styleUrl: './lista-pacientes.component.scss'
})
export class ListaPacientesComponent {
  displayedColumns: string[] = ['nombre', 'apellidos', 'username', 'correo', 'id_rol', 'aprobacion','eliminar','acciones'];
  //displayedColumns: string[] = ['nombre', 'apellido_paterno', 'apellido_paterno', 'edad', 'numero_de_sesiones', 'notas_ultima_sesion', 'eliminar','acciones'];
  dataSource = new MatTableDataSource<any>([]);
  public editModeMap: { [userId: number]: boolean } = {};
  searchControl = new FormControl('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {

    this.dataSource = new MatTableDataSource<any>([]);

  }

  ngOnInit(): void {
    this.loadUsers();
    this.searchControl.valueChanges
      .subscribe(value => {
        // Se proporciona una cadena vacía como valor por defecto si value es null
        this.applyFilter(value || '');
      });
  }

  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
          // Inicializamos las propiedades isConfirm e isDeleted para cada usuario
          this.dataSource.data = data.map(user => ({
            ...user, // Mantenemos las propiedades existentes del usuario
            isConfirm: false, // Agregamos la propiedad isConfirm inicializada en false
            isDeleted: false  // Agregamos la propiedad isDeleted inicializada en false
          }));
          this.dataSource.paginator = this.paginator; // Asigna el paginator a la nueva data
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al recuperar usuarios:', error);
        }
      });
    } else {
      // Maneja el caso cuando no estás en un entorno de navegador
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

  rolesList = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Psicólogo' },
  ];

  onDeleteUser(user: any) {
    if (user.isConfirm) {
      // Usuario ya confirmado, proceder a eliminar
      console.log('Token from localStorage:', localStorage.getItem('access_token'));
      console.log('Eliminando usuario', user.id_usuario);
      this.usuarioService.eliminarUsuario(user.id_usuario).subscribe({
        next: (resp) => {
          console.log('Usuario eliminado', resp);
          user.isDeleted = true; // Marcar como eliminado
          console.log('User:', user.isDeleted);
          this.cdr.detectChanges(); // Actualizar la vista
          this.loadUsers(); // Cargar de nuevo los usuarios
        },
        error: (error) => {
          console.error('Error al eliminar usuario', error);
          user.isConfirm = false; // Restablecer el estado
          this.cdr.detectChanges(); // Actualizar la vista
        }
      });
    } else {
      // No confirmado, marcar como confirmado
      user.isConfirm = true;
      this.cdr.detectChanges(); // Actualizar la vista para mostrar "¿Estás seguro?"
      setTimeout(() => {
        user.isConfirm = false;
        this.cdr.detectChanges(); // Volver a mostrar el icono de la papelera después de 3 segundos
      }, 3000);
    }
  }

  enableEditMode(user: any): void {
    this.editModeMap[user.id_usuario] = true;
  }

  startEdit(user: any): void {
    this.editModeMap[user.id_usuario] = true;
  }

  cancelEditMode(user: any): void {
    this.editModeMap[user.id_usuario] = false;
  }

  saveUser(user: any): void {
    // Preparar el modelo de usuario para la actualización
    const updatedUser = {
      nombre: user.nombre,
      apellidos: user.apellidos,
      username: user.username,
      correo: user.correo,
      id_rol: user.id_rol,
      aprobacion: user.aprobacion
      // Incluye todos los campos que necesites actualizar
    };
  
    // Llamada al servicio para actualizar el usuario
    this.usuarioService.actualizarUsuario(user.id_usuario, updatedUser).subscribe({
      next: (response) => {
        console.log('Usuario actualizado exitosamente', response);
        // Aquí manejarías la respuesta y realizarías acciones como refrescar la lista de usuarios si es necesario
        // Por ejemplo, podrías recargar la lista de usuarios para obtener la versión más reciente desde el servidor
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error al actualizar usuario', error);
        // Aquí manejarías errores, por ejemplo, mostrando un mensaje al usuario
      },
      complete: () => {
        // Esto se ejecutará independientemente de que la actualización haya sido exitosa o no
        this.editModeMap[user.id_usuario] = false; // Salir del modo de edición
        this.cdr.detectChanges(); // Detecta los cambios para actualizar la vista
      }
    });
  }
  

  registerPatient() {
    this.router.navigate(['/registrar-paciente']); // Navega a la ruta de registrar paciente
  }

  isEditMode(user: any): boolean {
    return this.editModeMap[user.id_usuario];
  }

  viewDetails(user: any) { // Asegúrate de pasar el usuario a la función
    // Aquí podrías pasar el ID del usuario o cualquier otra información relevante
    this.router.navigate(['/ver-paciente', user.id]); // Suponiendo que cada usuario tiene una propiedad 'id'
  }
}