import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { AuthService } from '../../services/login/auth.service';

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
  private idUsuarioActual: number | null = null; // Inicializa idUsuarioActual en null

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private pacienteService: PacienteService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService // Inyecta el AuthService aquí
  ) { }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id_usuario) {
          this.idUsuarioActual = user.id_usuario;
          // Llama a loadUsers solo si idUsuarioActual es un número
          if (this.idUsuarioActual !== null) {
            this.loadUsers(this.idUsuarioActual);
          }
        } else {
          console.error('ID de usuario no disponible. Redirigiendo a la página de inicio de sesión.');
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error('Error al obtener el usuario actual:', error);
        this.router.navigate(['/login']);
      }
    });

    this.searchControl.valueChanges.subscribe((value) => {
      this.applyFilter(value || '');
    });
  }

  loadUsers(idUsuario: number) {
    // Asegúrate de que idUsuario es un número antes de continuar
    if (typeof idUsuario === 'number') {
      // Realiza la solicitud con el idUsuario válido
      this.pacienteService.obtenerPacientesPorUsuario(idUsuario).subscribe({
        next: (data) => {
          this.dataSource.data = data;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al recuperar pacientes:', error);
        }
      });
    } else {
      console.error('loadUsers fue llamado sin un idUsuario válido.');
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onDeletePatient(patient: any) {
    if (this.idUsuarioActual === null) {
        console.error('Error: ID de usuario no disponible.');
        return; // Salir temprano si idUsuarioActual es null
    }

    if (patient.isConfirm) {
        // Usar aserción de tipo para afirmar que this.idUsuarioActual no es null
        this.pacienteService.eliminarPaciente(this.idUsuarioActual!, patient.id_paciente).subscribe({
            next: (resp) => {
                console.log('Paciente eliminado:', resp);
                // Ahora es seguro llamar a loadUsers, asumiendo que this.idUsuarioActual no es null
                this.loadUsers(this.idUsuarioActual!); // Usar aserción de tipo aquí también
            },
            error: (error) => {
                console.error('Error al eliminar paciente:', error);
                patient.isConfirm = false;
                this.cdr.detectChanges();
            }
        });
    } else {
        patient.isConfirm = true;
        this.cdr.detectChanges();
        setTimeout(() => {
            patient.isConfirm = false;
            this.cdr.detectChanges();
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
    this.router.navigate(['/editar-paciente', id_paciente]);
  }
}