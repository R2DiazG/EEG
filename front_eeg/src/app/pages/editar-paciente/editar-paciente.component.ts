import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { AuthService } from '../../services/login/auth.service';
import { UpdatePaciente } from '../../models/update-paciente.model';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-editar-paciente',
  templateUrl: './editar-paciente.component.html',
  styleUrls: ['./editar-paciente.component.scss']
})
export class EditarPacienteComponent implements OnInit {
  isEditMode: boolean = false;
  patient: UpdatePaciente = new UpdatePaciente();
  activeTab: string = 'infoPatient';
  id_paciente?: number;
  id_usuario: number | null = null;
  isConfirm: boolean = false;
  isDeleted: boolean = false;
  isDeleteInitiated: boolean = false;
  fechaActual: string = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
  tabsOrder: string[] = ['infoPatient', 'contactPatient', 'infoFamily', 'consent'];

  consentimientoDisplay: string = "Consentimiento grabado (haz clic para reproducir)";
  private apiUrl = 'http://127.0.0.1:5000';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pacienteService: PacienteService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id_usuario) {
          this.id_usuario = user.id_usuario;
          console.log('Usuario', user.id_usuario);
          console.log('ID de usuario actual:', this.id_usuario);

          this.setIdPaciente();
        } else {
          console.error('Usuario no identificado');
          this.router.navigate(['/login']);
        }
      },
      error: (err) => console.error('Error al obtener el usuario actual', err)
    });
  }

  setIdPaciente(): void {
    this.route.params.subscribe(params => {
      this.id_paciente = +params['id_paciente'];
      if (this.id_paciente) {
        this.getPatientDetails();
      } else {
        console.error('ID de paciente no proporcionado');
      }
    });
  }

  getPatientDetails(): void {
    if (this.id_usuario && this.id_paciente) {
      this.pacienteService.obtenerDetallesPaciente(this.id_paciente).subscribe({
        next: (data) => {
          console.log("Respuesta del servidor:", data);
          this.patient = this.mapToUpdatePaciente(data);
          console.log('Datos del paciente completos:', this.patient);
        },
        error: (error) => console.error('Error al obtener detalles del paciente:', error)
      });
    } else {
      console.error('Información requerida para la llamada API no está disponible.');
    }
  }

  getGeneroDisplay(gender: string | undefined): string {
    return gender ?? 'No especificado';
  }
  
  getEstadoCivil(civilStatus: string | undefined): string {
    return civilStatus ?? 'No especificado';
  }
  
  getEscolaridadDisplay(educationLevel: string | undefined): string {
    return educationLevel ?? 'No especificado';
  }
  
  getLateralidadDisplay(laterality: string | undefined): string {
    return laterality ?? 'No especificado';
  }
  
  getOcupationDisplay(occupation: string | undefined): string {
    return occupation ?? 'No especificado';
  }

  getConsentimientoDisplay(): string {
    if (this.patient.consentimientos && this.patient.consentimientos.length > 0) {
      return 'Consentimiento dado el ' + this.patient.consentimientos[0].fecha_registro;
    }
    return 'No se ha proporcionado consentimiento';
  }

  getAudioUrl(filename: string): string {
    const normalizedFilename = filename.replace(/\\/g, '/');
    const url = `${this.apiUrl}/${normalizedFilename}`;
    return url;
  }

  private mapToUpdatePaciente(data: any): UpdatePaciente {
  const mapped: UpdatePaciente = {
      id_paciente: data.id_paciente,
      nombre: data.nombre,
      apellido_paterno: data.apellido_paterno,
      apellido_materno: data.apellido_materno,
      fecha_nacimiento: this.formatDate(new Date(data.fecha_nacimiento)),
      genero: data.genero === 'No especificado' ? undefined : data.genero,
      estado_civil: data.estado_civil == 'No especificado' ? undefined : data.estado_civil,
      escolaridad: data.escolaridad == 'No especificado' ? undefined : data.escolaridad,
      ocupacion: data.ocupacion == 'No especificado' ? undefined : data.ocupacion,
      lateralidad: data.lateralidad === 'No especificado' ? undefined : data.lateralidad,
      telefonos: data.telefonos.map((tel: any) => ({ telefono: tel.telefono })),
      correos_electronicos: data.correos_electronicos.map((email: any) => ({ correo_electronico: email.correo_electronico })),
      direcciones: data.direcciones.map((dir: any) => ({
        calle_numero: dir.calle_numero,
        colonia: dir.colonia,
        ciudad: dir.ciudad,
        estado: dir.estado,
        pais: dir.pais,
        codigo_postal: dir.codigo_postal,
      })),
      contacto_emergencia: {
        nombre: data.contacto_emergencia.nombre,
        apellido_paterno: data.contacto_emergencia.apellido_paterno,
        apellido_materno: data.contacto_emergencia.apellido_materno,
        parentesco: data.contacto_emergencia.parentesco,
        telefono: data.contacto_emergencia.telefono,
        correo_electronico: data.contacto_emergencia.correo_electronico,
        direccion: data.contacto_emergencia.direccion,
        colonia: data.contacto_emergencia.colonia,
        ciudad: data.contacto_emergencia.ciudad,
        estado: data.contacto_emergencia.estado,
        codigo_postal: data.contacto_emergencia.codigo_postal,
        pais: data.contacto_emergencia.pais,
        notas: data.contacto_emergencia.notas,
      },
      consentimientos: data.consentimientos.map((consent: any) => ({
        consentimiento: consent.consentimiento,
        fecha_registro: consent.fecha_registro,
        audio_filename: consent.audio_filename
      }))
    };
    console.log('Datos del paciente mapeados:', mapped);
    return mapped;
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  onDeletePatient(): void {
    if (!this.isConfirm && !this.isDeleteInitiated) {
      this.isConfirm = true;
      this.isDeleteInitiated = true;
      setTimeout(() => {
        if (!this.isConfirm) {
          this.isDeleteInitiated = false;
        }
      }, 3000);
      return;
    } else {
      if (this.id_usuario && this.id_paciente) {
        this.pacienteService.eliminarPaciente(this.id_usuario, this.id_paciente).subscribe({
          next: () => {
            console.log('Paciente eliminado con éxito.');
            this.isDeleted = true;
            this.isDeleteInitiated = false;
            this.router.navigate(['/lista-pacientes']);
          },
          error: (error) => {
            console.error('Error al eliminar el paciente:', error);
            this.isConfirm = false;
            this.isDeleteInitiated = false;
          }
        });
      } else {
        this.isConfirm = true;
        console.error('Faltan datos necesarios para la eliminación.');
      
        setTimeout(() => {
          if (!this.isDeleted) {
            this.isConfirm = false;
            this.isDeleteInitiated = false;
          }
        }, 3000);
      
      }
    }
  }
  
  regresar(){
    this.router.navigate(['/lista-pacientes']);
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.router.navigate(['/ver-paciente', this.id_paciente]);
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  }
  changeTab(direction: 'next' | 'back') {
    const currentIndex = this.tabsOrder.indexOf(this.activeTab);
    if (direction === 'next' && currentIndex < this.tabsOrder.length - 1) {
      this.activeTab = this.tabsOrder[currentIndex + 1];
    } else if (direction === 'back' && currentIndex > 0) {
      this.activeTab = this.tabsOrder[currentIndex - 1];
    }
  }

  onSubmit(): void {
    console.log('actualizando paciente')
    if (this.isEditMode && this.id_usuario && this.id_paciente !== undefined) {
      console.log('Datos del paciente actualizados:', this.patient);
      this.pacienteService.actualizarPacienteDeUsuario(this.id_usuario, this.id_paciente, this.patient).subscribe({
        next: () => {
          console.log('Información del paciente actualizada');
          this.isEditMode = false;
          this.router.navigate(['/editar-paciente', this.id_paciente]);
        },
        error: (error) => console.error('Error al actualizar el paciente:', error)
      });
    } else {
      console.error('No se puede actualizar: ID del paciente o usuario no definido.');
    }
  }
}
