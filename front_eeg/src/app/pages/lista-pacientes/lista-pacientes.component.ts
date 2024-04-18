import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { AuthService } from '../../services/login/auth.service';
import { EegService } from '../../services/sesiones/eeg.service';

@Component({
  selector: 'app-lista-pacientes',
  templateUrl: './lista-pacientes.component.html',
  styleUrls: ['./lista-pacientes.component.scss']
})
export class ListaPacientesComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'apellido_paterno', 'apellido_materno', 'edad', 'numero_de_sesiones', 'notas_ultima_sesion', 'acciones', 'sesion', 'eliminar'];
  dataSource = new MatTableDataSource<any>([]);
  public editModeMap: { [userId: number]: boolean } = {};
  searchControl = new FormControl('');
  idUsuarioActual!: number;
  idRol!: number; // Agregado para almacenar el rol del usuario

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private pacienteService: PacienteService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private eegService: EegService, 
    private authService: AuthService // Inyecta el AuthService aquí
  ) { }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id_usuario) {
          this.idUsuarioActual = user.id_usuario;
          this.idRol = user.id_rol; // Almacena el id_rol obtenido
          this.loadUsers();
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

  loadUsers() {
    if (this.idRol === 2) {
      this.pacienteService.obtenerPacientesPorUsuario(this.idUsuarioActual).subscribe({
        next: (data) => {
          this.dataSource.data = data.map(patient => ({
            ...patient,
            isConfirm: false,
            isDeleteInitiated: false,
            isDeleted: false,
          }));
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al recuperar pacientes:', error);
        }
      });
    } else if (this.idRol === 1) {
      this.pacienteService.obtenerPacientesAgrupadosPorPsicologo().subscribe({
        next: (data) => {
          const flattenedData = data.reduce((acc: any, group: { pacientes: any; }) => [...acc, ...group.pacientes], []);
          this.dataSource.data = flattenedData.map((patient: any) => ({
            ...patient,
            isConfirm: false,
            isDeleteInitiated: false,
            isDeleted: false,
          }));
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al recuperar pacientes agrupados:', error);
        }
      });
    } else {
      console.error('ID de rol no válido o no definido.');
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

  /*
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
}*/

onDeletePatient(patient: any) {
  if (this.idUsuarioActual === null) {
    console.error('Error: ID de usuario no disponible.');
    return; // Salir temprano si idUsuarioActual es null
  }

  // Inicializar el proceso de eliminación en el primer clic
  if (!patient.isConfirm && !patient.isDeleteInitiated) {
    patient.isDeleteInitiated = true;
    this.cdr.detectChanges();
    // Establece un timeout para revertir el estado si no hay confirmación
    setTimeout(() => {
      if (!patient.isConfirm) { // Si aún no está confirmado, revertir
        patient.isDeleteInitiated = false;
        this.cdr.detectChanges();
      }
    }, 3000);
    return;
  }

  if (patient.isConfirm) {
    this.pacienteService.eliminarPaciente(this.idUsuarioActual, patient.id_paciente).subscribe({
      next: (resp) => {
        console.log('Paciente eliminado:', resp);
        patient.isDeleted = true;
        patient.isDeleteInitiated = false;
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar paciente:', error);
        patient.isConfirm = false;
        patient.isDeleteInitiated = false;
        this.cdr.detectChanges();
      }
    });
  } else {
    // Solicitar confirmación en el segundo clic
    patient.isConfirm = true;
    this.cdr.detectChanges();
    // Si el usuario no confirma dentro de 3 segundos, revertir
    setTimeout(() => {
      if (!patient.isDeleted) { // Si no se ha eliminado, revertir
        patient.isConfirm = false;
        patient.isDeleteInitiated = false;
        this.cdr.detectChanges();
      }
    }, 3000);
  }
}

getLastSession(idPaciente: number): void {
  console.log('Obteniendo la última sesión para el paciente con ID:', idPaciente);
  this.eegService.obtenerUltimaSesion(idPaciente).subscribe({
    next: (sesion) => {
      if (sesion && sesion.id_sesion) {
        console.log('La última sesión es:', sesion);
        this.router.navigate(['/graficas-paciente', sesion.id_sesion]);
      } else {
        console.log('No se encontró la última sesión para este paciente. Redirigiendo a la página de subida de EEG.');
        this.router.navigate(['/eeg-subir-docs', idPaciente]);
      }
    },
    error: (error) => {
      console.error('Error al obtener la última sesión:', error);
    }
  });
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