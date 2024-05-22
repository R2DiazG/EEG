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
  selector: 'app-lista-psicologos',
  templateUrl: './lista-psicologos.component.html',
  styleUrls: ['./lista-psicologos.component.scss'],
})
export class ListaPsicologosComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'apellidos', 'username', 'correo', 'id_rol', 'aprobacion','acciones', 'eliminar'];
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
    console.log('entre al onInit')
    this.loadUsers();
    console.log('Token from localStorage:', localStorage.getItem('access_token'));
    this.searchControl.valueChanges
      .subscribe(value => {
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
    if (typeof window !== 'undefined') {
      console.log('Token from localStorage:', localStorage.getItem('access_token'));
      this.usuarioService.obtenerUsuarios().subscribe({ 
        next: (data) => {
          this.dataSource.data = data.map(user => ({
            ...user,
            isConfirm: false,
            isDeleted: false, 
            isDeleteInitiated: false
          }));
          this.dataSource.paginator = this.paginator;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al recuperar usuarios:', error);
        }
      });
    } else {
      console.log('localStorage no está disponible en este entorno.');
    }
  } 

  toggleAprobacion(user: any): void {
    const originalAprobacion = user.aprobacion;
  
    user.aprobacion = !user.aprobacion;
  
    this.usuarioService.cambiarAprobacionUsuario(user.id_usuario, !user.aprobacion).subscribe({
      next: (response) => {
        console.log('Aprobación actualizada correctamente', response);
      },
      error: (error) => {
        user.aprobacion = originalAprobacion;
        console.error('Error al actualizar la aprobación', error);
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
    if (!user.isConfirm && !user.isDeleteInitiated) {
      user.isDeleteInitiated = true;
      this.cdr.detectChanges();
    setTimeout(() => {
      if (!user.isConfirm) { 
        user.isDeleteInitiated = false;
        this.cdr.detectChanges();
      }
    }, 3000);
      return;
    }
  
    if (user.isConfirm) {
      console.log('Token from localStorage:', localStorage.getItem('access_token'));
      console.log('Eliminando usuario', user.id_usuario);
      this.usuarioService.eliminarUsuario(user.id_usuario).subscribe({
        next: (resp) => {
          console.log('Usuario eliminado', resp);
          user.isDeleted = true;
          user.isDeleteInitiated = false;
          console.log('User:', user.isDeleted);
          this.cdr.detectChanges();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error al eliminar usuario', error);
          user.isConfirm = false;
          user.isDeleteInitiated = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      user.isConfirm = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        if (!user.isDeleted) {
          user.isConfirm = false;
          user.isDeleteInitiated = false;
          this.cdr.detectChanges();
        }
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
    const updatedUser = {
      nombre: user.nombre,
      apellidos: user.apellidos,
      username: user.username,
      correo: user.correo,
      id_rol: user.id_rol,
      aprobacion: user.aprobacion
    };
  
    this.usuarioService.actualizarUsuario(user.id_usuario, updatedUser).subscribe({
      next: (response) => {
        console.log('Usuario actualizado exitosamente', response);
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error al actualizar usuario', error);
      },
      complete: () => {
        this.editModeMap[user.id_usuario] = false;
        this.cdr.detectChanges();
      }
    });
  }

  isEditMode(user: any): boolean {
    return this.editModeMap[user.id_usuario];
  }

  registerUser() {
    this.router.navigate(['/admin-registra-psicologo']);
  }

  viewDetails(user: any) {
    this.router.navigate(['/ver-paciente', user.id]);
  }
}