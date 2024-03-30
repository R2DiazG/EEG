import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { UsuarioService } from '../../services/usuarios/usuario.service';

@Component({
  selector: 'app-lista-pacientes',
  templateUrl: './lista-pacientes.component.html',
  styleUrls: ['./lista-pacientes.component.scss']
})
export class ListaPacientesComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'apellido_paterno', 'apellido_materno', 'edad', 'numero_de_sesiones', 'notas_ultima_sesion', 'eliminar', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  public editModeMap: { [userId: number]: boolean } = {};
  searchControl = new FormControl('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private pacienteService: PacienteService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) { }

  getCurrentUserId(): number | null {
    const userJson = localStorage.getItem('currentUser');
    if (userJson && userJson !== "undefined") {
      try {
        const user = JSON.parse(userJson);
        return user.id_usuario; // Ensure this is the correct property for the user ID
      } catch (e) {
        console.error('Error parsing user JSON:', e);
      }
    }
    return null;
  }
  

  ngOnInit(): void {
    const idUsuarioActual = this.getCurrentUserId();
    if (idUsuarioActual === null) {
      // Handle the case when the user ID is not found
      console.error('ID de usuario no disponible. El usuario puede que no haya iniciado sesión.');
      this.router.navigate(['/login']).then(() => {
        console.log('Usuario no autenticado. Redirigiendo a la página de inicio de sesión.');
      });
      return; // Exit the ngOnInit if no user ID is found
    }
    
    this.loadUsers();
    this.searchControl.valueChanges.subscribe((value) => {
      this.applyFilter(value || '');
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadUsers() {
    const idUsuarioActual = this.getCurrentUserId();
    if (idUsuarioActual !== null) {
      this.pacienteService.obtenerPacientesPorUsuario(idUsuarioActual).subscribe({
        next: (data) => {
          this.dataSource.data = data;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al recuperar pacientes:', error);
        }
      });
    } else {
      console.error('ID de usuario no disponible. El usuario puede que no haya iniciado sesión.');
      // Redirect the user to the login page or show a message
      this.router.navigate(['/login']).then(() => {
        // You can display a message or do something once the user is redirected.
        console.log('Usuario no autenticado. Redirigiendo a la página de inicio de sesión.');
      });
    }
  }   

  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onDeletePatient(user: any, patient: any) {
    if (patient.isConfirm) {
      this.pacienteService.eliminarPaciente(user.id_usuario, patient.id_paciente).subscribe({
        next: (resp) => {
          console.log('Paciente eliminado:', resp);
          this.loadUsers(); // Recargar los pacientes
        },
        error: (error) => {
          console.error('Error al eliminar paciente:', error);
          patient.isConfirm = false; // Restablecer el estado
          this.cdr.detectChanges(); // Actualizar la vista
        }
      });
    } else {
      patient.isConfirm = true;
      this.cdr.detectChanges(); // Actualizar la vista para mostrar "¿Estás seguro?"
      setTimeout(() => {
        patient.isConfirm = false;
        this.cdr.detectChanges(); // Volver al estado original después de 3 segundos
      }, 3000);
    }
  }

  registerPatient() {
    this.router.navigate(['/registrar-paciente']);
  }

  isEditMode(user: any): boolean {
    return this.editModeMap[user.id_usuario];
  }

  viewDetails(id_paciente: number) {
    this.router.navigate(['/ver-paciente', id_paciente]);
  }
}