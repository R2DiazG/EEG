import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { AuthService } from '../../services/login/auth.service';
import { InfoPaciente } from '../../models/info-paciente.model';

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
          // Suponiendo que 'data' es el objeto con los detalles del paciente.
          this.patient = this.mapToInfoPaciente(data); // Usamos la función de mapeo aquí.
          console.log('Datos del paciente:', this.patient);
        },
        error: (error) => console.error('Error al obtener detalles del paciente:', error)
      });
    } else {
      console.error('Información requerida para la llamada API no está disponible.');
    }
  }

  // Asegúrate de que el género puede ser 'male', 'female' o undefined
getGeneroDisplay(value: 'male' | 'female' | undefined): string {
  switch (value) {
    case 'male':
      return 'Masculino';
    case 'female':
      return 'Femenino';
    default:
      return 'No especificado'; // Si el valor es undefined o no reconocido
  }
}
  
  // Actualiza la función para que acepte un string o undefined
getEstadoCivil(value: string | undefined): string {
  if (value === undefined) return 'No especificado'; // Maneja el caso undefined
  
  switch (value) {
    case 'single':
      return 'Soltero/a';
    case 'married':
      return 'Casado/a';
    case 'divorced':
      return 'Divorciado/a';
    case 'widower':
      return 'Viudo/a';
    default:
      return 'No especificado';
  }
}

getLateralidadDisplay(value: string | undefined): string {
  switch (value) {
    case 'left':
      return 'Zurdo';
    case 'right':
      return 'Diestro';
    case 'ambidextrous':
      return 'Ambidiestro';
    default:
      return 'No especificado';
  }
}

getEscolaridadDisplay(value: string | undefined): string {
  switch (value) {
    case 'elementary':
      return 'Primaria';
    case 'secondary':
      return 'Secundaria';
    case 'highSchool':
      return 'Preparatoria';
    case 'university':
      return 'Universidad';
    case 'mastersDegree':
      return 'Maestría';
    case 'doctorate':
      return 'Doctorado';
    default:
      return 'No especificado';
  }
}

  // Asegúrate de tener una función para mapear los datos recibidos al modelo InfoPaciente
  private mapToInfoPaciente(data: any): InfoPaciente {
    const mapped: InfoPaciente = {
      id_paciente: data.id_paciente,
      nombre: data.nombre,
      apellido_paterno: data.apellido_paterno,
      apellido_materno: data.apellido_materno,
      fecha_nacimiento: new Date(data.fecha_nacimiento),
      genero: data.genero === 'Masculino' ? 'male' : 'female',
      estado_civil: data.estado_civil,
      escolaridad: data.escolaridad,
      ocupacion: data.ocupacion,
      lateralidad: data.lateralidad,
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
      // Asumiendo que las demás propiedades tienen el mismo nombre y formato
      historial_medico: data.historial_medico,
      medicamentos_actuales: data.medicamentos_actuales,
      // Asume que hay datos de contacto de emergencia
      nombre_contacto_emergencia: data.nombre_contacto_emergencia,
      apellido_paterno_contacto_emergencia: data.apellido_paterno_contacto_emergencia,
      apellido_materno_contacto_emergencia: data.apellido_materno_contacto_emergencia,
      parentesco_contacto_emergencia: data.parentesco_contacto_emergencia,
      telefono_contacto_emergencia: data.telefono_contacto_emergencia,
      correo_electronico_contacto_emergencia: data.correo_electronico_contacto_emergencia,
      direccion_contacto_emergencia: data.direccion_contacto_emergencia,
      ciudad_contacto_emergencia: data.ciudad_contacto_emergencia,
      estado_contacto_emergencia: data.estado_contacto_emergencia,
      codigo_postal_contacto_emergencia: data.codigo_postal_contacto_emergencia,
      pais_contacto_emergencia: data.pais_contacto_emergencia,
      notas_contacto_emergencia: data.notas_contacto_emergencia,
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
  

  cancelEdit(): void {
    this.isEditMode = false;
    this.router.navigate(['/ver-paciente', this.id_paciente]);
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  }

  onSubmit(): void {
    // Verifica que tanto isEditMode como id_usuario estén definidos y sean verdaderos,
    // y además asegúrate de que id_paciente no sea undefined.
    if (this.isEditMode && this.id_usuario && this.id_paciente !== undefined) {
      this.pacienteService.actualizarPacienteDeUsuario(this.id_usuario, this.id_paciente, this.patient).subscribe({
        next: () => {
          console.log('Información del paciente actualizada');
          this.isEditMode = false;
          // Navega a la vista del paciente actualizado
          this.router.navigate(['/ver-paciente', this.id_paciente]);
        },
        error: (error) => console.error('Error al actualizar el paciente:', error)
      });
    } else {
      // Aquí puedes manejar el caso en que id_paciente sea undefined,
      // o bien mostrar un mensaje al usuario o hacer otro tipo de manejo de error.
      console.error('No se puede actualizar: ID del paciente o usuario no definido.');
    }
  }

  addMedication(): void {
    if (!this.patient.medicamentos_actuales) {
      this.patient.medicamentos_actuales = [];
    }
    this.patient.medicamentos_actuales.push('');
  }

  removeMedication(index: number): void {
    if (this.patient.medicamentos_actuales) {
      this.patient.medicamentos_actuales.splice(index, 1);
    }
  }

  // Implementa confirmDelete y onCancel según sea necesario...
}
