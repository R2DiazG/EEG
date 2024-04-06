import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InfoPaciente } from '../../models/info-paciente.model';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { AuthService } from '../../services/login/auth.service';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-registrar-paciente',
  templateUrl: './registrar-paciente.component.html',
  styleUrls: ['./registrar-paciente.component.scss']
})
export class RegistrarPacienteComponent implements OnInit {
  patient: InfoPaciente = new InfoPaciente();
  activeTab: string = 'infoPatient';
  id_usuario: number | undefined;
  fechaActual: string = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');

  consentimientoTemporal: { consentimiento: number; fecha_registro: string } = {
    consentimiento: 0,
    fecha_registro: this.fechaActual,
  };

  constructor(
    private router: Router,
    private authService: AuthService, // Servicio de autenticación
    private pacienteService: PacienteService // Servicio de pacientes
  ) {}

  ngOnInit(): void {
    this.getCurrentUser(); // Llamada al método para obtener el usuario actual
  }

  // Método para obtener el ID del usuario actual
  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id_usuario) {
          this.id_usuario = user.id_usuario;
          console.log('ID de usuario actual:', this.id_usuario);
        } else {
          console.error('Usuario no identificado. Redireccionando al login.');
          this.router.navigate(['/login']); // Redirecciona al usuario al login si no está identificado
        }
      },
      error: (err) => {
        console.error('Error al obtener el usuario actual', err);
        this.router.navigate(['/login']); // Maneja errores posiblemente redirigiendo al login
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  addPhone(): void {
    this.patient.telefonos.push({ telefono: '' }); // Agrega un teléfono vacío al arreglo
  }

  addEmail(): void {
    this.patient.correos_electronicos.push({ correo_electronico: '' }); // Agrega un correo electrónico vacío al arreglo
  }

  addAddress(): void {
    this.patient.direcciones.push({
      calle_numero: '',
      colonia: '', // Opcional, puede ser cadena vacía
      ciudad: '',
      estado: '',
      pais: '',
      codigo_postal: '',
    }); // Agrega una dirección vacía al arreglo
  }

  cancelButton(): void {
    this.router.navigate(['/lista-pacientes']); // Redirige al usuario a la lista de pacientes
  }

  // En tu componente

// Método temporal para guardar la información actualizada
saveCurrentTabData(): void {
  // Aquí puedes validar o procesar los datos antes de asignarlos al paciente
  console.log('Datos guardados temporalmente:', this.patient);
  // Puedes mostrar una notificación al usuario de que los datos se han guardado temporalmente
}

// Método final para enviar todos los datos
registerPatient(): void {
  // Recorre el arreglo de consentimientos y asigna la fecha actual formateada a cada entrada
  //this.patient.consentimientos.forEach(consentimiento => {
  //  consentimiento.fecha_registro = new Date(); // Directamente asigna el objeto Date
  //});

  this.patient.consentimientos.push(this.consentimientoTemporal); // Agrega el consentimiento temporal al arreglo

  console.log('Datos finales a enviar:', this.patient);

  // Procede con la lógica para enviar los datos al servidor
  if (this.id_usuario) {
    this.pacienteService.crearPaciente(this.id_usuario, this.patient).subscribe({
      next: (response) => {
        console.log('Paciente registrado con éxito', response);
        this.router.navigate(['/lista-pacientes']); // Redirige al usuario a la lista de pacientes
      },
      error: (error) => {
        console.error('Error al registrar el paciente', error);
        // Aquí deberías manejar el error
      }
    });
  } else {
    console.error('ID de usuario no definido.');
    // Manejo de la falta del ID de usuario
  }
}


  /*onSubmit(): void {
    // Verifica si existe al menos un objeto de consentimiento con consentimiento === true
    const consentimientoOtorgado = this.patient.consentimientos.some(consent => consent.consentimiento === true);
  
    if (consentimientoOtorgado && this.id_usuario) {
      this.pacienteService.crearPaciente(this.id_usuario, this.patient).subscribe({
        next: (response) => {
          console.log('Paciente registrado con éxito', response);
          this.router.navigate(['/lista-pacientes']); // Redirige al usuario a la lista de pacientes
        },
        error: (error) => {
          console.error('Error al registrar el paciente', error);
        }
      });
    } else {
      console.error('El consentimiento es necesario para registrar al paciente');
    }
  }*/
  
}
