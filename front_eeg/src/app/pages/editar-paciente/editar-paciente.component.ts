import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { AuthService } from '../../services/login/auth.service';
import { InfoPaciente } from '../../models/info-paciente.model';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-editar-paciente',
  templateUrl: './editar-paciente.component.html',
  styleUrls: ['./editar-paciente.component.scss']
})
export class EditarPacienteComponent implements OnInit {
  isEditMode: boolean = false;
  patient: InfoPaciente = new InfoPaciente();
  activeTab: string = 'infoPatient';
  id_paciente?: number;
  id_usuario: number | null = null;
  isConfirmDelete: boolean = false;
  isDeleted: boolean = false;
  fechaActual: string = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');

  consentimientoTemporal: { consentimiento: number; fecha_registro: string } = {
    consentimiento: 0,
    fecha_registro: this.fechaActual,
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pacienteService: PacienteService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.getCurrentUser();
    //this.patient.latestConsent = this.getLatestConsent(this.patient.consentimientos);
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id_usuario) {
          this.id_usuario = user.id_usuario;
          console.log('Usuario', user.id_usuario);
          console.log('ID de usuario actual:', this.id_usuario);

          // Ahora que tienes el id_usuario, determina cómo obtener el id_paciente.
          // Esto puede ser a través de la ruta (como se muestra abajo) o de otro método en tu flujo.
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
    // Ejemplo de obtención del id_paciente de la ruta, ajusta según tu lógica.
    this.route.params.subscribe(params => {
      this.id_paciente = +params['id_paciente']; // Asegúrate de que el nombre del parámetro coincida con tu configuración de ruta.
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
          // Suponiendo que 'data' es el objeto con los detalles del paciente.
          this.patient = this.mapToInfoPaciente(data); // Usamos la función de mapeo aquí.
          console.log('Datos del paciente completos:', this.patient);
        },
        error: (error) => console.error('Error al obtener detalles del paciente:', error)
      });
    } else {
      console.error('Información requerida para la llamada API no está disponible.');
    }
  }

  getGeneroDisplay(gender: string | undefined): string {
    return gender ?? 'No especificado'; // Si 'gender' es null o undefined, devuelve 'No especificado'
  }
  
  getEstadoCivil(civilStatus: string | undefined): string {
    return civilStatus ?? 'No especificado'; // Si 'civilStatus' es null o undefined, devuelve 'No especificado'
  }
  
  getEscolaridadDisplay(educationLevel: string | undefined): string {
    return educationLevel ?? 'No especificado'; // Si 'educationLevel' es null o undefined, devuelve 'No especificado'
  }
  
  getLateralidadDisplay(laterality: string | undefined): string {
    return laterality ?? 'No especificado'; // Si 'laterality' es null o undefined, devuelve 'No especificado'
  }
  
  getOcupationDisplay(occupation: string | undefined): string {
    return occupation ?? 'No especificado'; // Si 'occupation' es null o undefined, devuelve 'No especificado'
  }

  getConsentimientoDisplay(consentimientos: any): string {
    return this.patient.consentimientos[this.patient.consentimientos.length-1].consentimiento ? 'Sí dio su consentimiento' : 'No dio su consentimiento';
   }

  // Asegúrate de tener una función para mapear los datos recibidos al modelo InfoPaciente
  private mapToInfoPaciente(data: any): InfoPaciente {
  const mapped: InfoPaciente = {
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
      // Asume que puedes tener varios teléfonos y correos, por lo que mapea los arrays
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
      // Asume que hay datos de contacto de emergencia
      contacto_emergencia: {
        nombre: data.contacto_emergencia.nombre,
        apellido_paterno: data.contacto_emergencia.apellido_paterno,
        apellido_materno: data.contacto_emergencia.apellido_materno,
        parentesco: data.contacto_emergencia.parentesco,
        telefono: data.contacto_emergencia.telefono,
        correo_electronico: data.contacto_emergencia.correo_electronico,
        direccion: data.contacto_emergencia.direccion,
        ciudad: data.contacto_emergencia.ciudad,
        estado: data.contacto_emergencia.estado,
        codigo_postal: data.contacto_emergencia.codigo_postal,
        pais: data.contacto_emergencia.pais,
        notas: data.contacto_emergencia.notas,
      },
    // Para el consentimiento, debes revisar cómo se almacena y se recupera

      consentimientos: data.consentimientos ? data.consentimientos.map((consent: any) => ({
        consentimiento: consent.consentimiento, 
        fecha_registro: new Date(consent.fecha_registro)
      })) : []

    };
    return mapped;
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() devuelve un índice basado en cero (0-11)
    const day = date.getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  onDeletePatient(): void {
    // Verifica si ya se solicitó confirmación para eliminar
    if (!this.isConfirmDelete) {
      this.isConfirmDelete = true;
      // Establece un tiempo para revertir la solicitud de confirmación si el usuario no actúa
      setTimeout(() => this.isConfirmDelete = false, 3000);
    } else {
      // Verifica que tanto el ID del usuario como del paciente estén definidos
      if (this.id_usuario && this.id_paciente) {
        this.pacienteService.eliminarPaciente(this.id_usuario, this.id_paciente).subscribe({
          next: () => {
            console.log('Paciente eliminado con éxito.');
            this.isDeleted = true; // Marca el estado como eliminado
            // Redirige al usuario a la lista de pacientes o a una pantalla de confirmación
            this.router.navigate(['/lista-pacientes']);
          },
          error: (error) => {
            // Informa al usuario del error
            console.error('Error al eliminar el paciente:', error);
            this.isConfirmDelete = false; // Resetea la solicitud de confirmación en caso de error
            // Considera mostrar un mensaje de error al usuario aquí
          }
        });
      } else {
        console.error('Faltan datos necesarios para la eliminación.');
        // Considera informar al usuario de que falta información
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
/*
  onSubmit(): void {
    if (this.isEditMode && this.id_usuario && this.id_paciente !== undefined) {
      // Prepárate para enviar los datos actualizados al backend
      console.log('Datos del paciente actualizados:', this.patient);

      // Incluye la lógica para manejar los cambios de consentimiento aquí.
      // Puede ser tan simple como añadir el último consentimiento al array de consentimientos.
      this.pacienteService.actualizarPacienteDeUsuario(this.id_usuario, this.id_paciente, {
        ...this.patient,
        consentimientos: [...this.patient.consentimientos, this.patient.latestConsent]
      }).subscribe({
        next: () => {
          console.log('Información del paciente actualizada');
          this.isEditMode = false;
          // Navega a la vista de paciente o donde corresponda
          this.router.navigate(['/ver-paciente', this.id_paciente]);
        },
        error: (error) => console.error('Error al actualizar el paciente:', error)
      });
    } else {
      console.error('No se puede actualizar: ID del paciente o usuario no definido.');
    }
  }

  getLatestConsent(consentimientos: { consentimiento: boolean; fecha_registro: Date }[]): any {
    // Retorna el consentimiento más reciente o un objeto por defecto si no hay ninguno.
    // Esta función puede requerir lógica adicional basada en tu backend.
    return consentimientos?.length ? consentimientos[consentimientos.length - 1] : { consentimiento: false, fecha_registro: new Date() };
  }
  */
  
  onSubmit(): void {
    console.log('actualizando paciente')
    if (this.isEditMode && this.id_usuario && this.id_paciente !== undefined) {
      // Convertir valores de presentación a valores esperados por el backend si es necesario
      // Ejemplo: Si tu backend espera 'male' o 'female' para género, asegúrate de que esos sean los valores enviados.
      console.log('Datos del paciente actualizados:', this.patient);
      console.log('Consentimiento actualizado:', this.consentimientoTemporal);
      this.patient.consentimientos.push(this.consentimientoTemporal);
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
