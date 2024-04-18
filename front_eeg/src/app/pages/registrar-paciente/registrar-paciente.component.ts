import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InfoPaciente } from '../../models/info-paciente.model';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { AuthService } from '../../services/login/auth.service';
import { formatDate } from '@angular/common';
import { CodigoPostalService } from '../../services/codigoPostal/codigo-postal.service';

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
  mediaRecorder!: MediaRecorder;
  audioUrl!: string;
  recording: boolean = false;
  tabsOrder: string[] = ['infoPatient', 'contactPatient', 'infoFamily', 'consent'];


  consentimientoTemporal: { consentimiento: number; fecha_registro: string } = {
    consentimiento: 1,
    fecha_registro: this.fechaActual,
  };

  constructor(
    private router: Router,
    private authService: AuthService, // Servicio de autenticación
    private pacienteService: PacienteService, // Servicio de pacientes
    private codigoPostalService: CodigoPostalService // Servicio de códigos postales
  ) {}

  ngOnInit(): void {
    this.getCurrentUser(); // Llamada al método para obtener el usuario actual
    this.initDefaultContactInfo();
  }

  initDefaultContactInfo(): void {
    // Asegura que haya al menos tres teléfonos por defecto: Celular, Casa y Trabajo
    while (this.patient.telefonos.length < 3) {
      this.patient.telefonos.push({ telefono: '' });
    }
  
    // Asegura que haya al menos un campo para el correo electrónico
    if (this.patient.correos_electronicos.length === 0) {
      this.addEmail();
    }
  
    // Asegura que haya al menos una dirección
    if (this.patient.direcciones.length === 0) {
      this.addAddress();
    }
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
    this.patient.telefonos.push({ telefono: '' });
  }
  

  addEmail(): void {
    this.patient.correos_electronicos.push({ correo_electronico: '' });
  }

  addAddress(): void {
    this.patient.direcciones.push({
      calle_numero: '',
      colonia: '',
      ciudad: '',
      estado: '',
      pais: '',
      codigo_postal: '',
    }); // Agrega una dirección vacía al arreglo
  }

  fillAddressData(index: number, section: 'patientAddress' | 'emergencyContact') {
    // Usamos un tipo unión aquí para permitir strings y undefined.
    let postalCode: string | undefined;
  
    if (section === 'patientAddress') {
      postalCode = this.patient.direcciones[index]?.codigo_postal;
    } else {
      postalCode = this.patient.contacto_emergencia?.codigo_postal;
      // Dado que index no se usa para contacto de emergencia, simplemente lo ignoramos en este bloque.
    }
  
    // Verificamos si postalCode es undefined antes de continuar.
    if (postalCode) {
      this.codigoPostalService.getAddressByPostalCode(postalCode)
        .subscribe({
          next: (data) => {
            if (data && data.places && data.places.length > 0) {
              const place = data.places[0];
              if (section === 'patientAddress') {
                //this.patient.direcciones[index].ciudad = place['place name'];
                this.patient.direcciones[index].estado = place['state'];
                this.patient.direcciones[index].pais = 'México';
              } else {
                //this.patient.contacto_emergencia.ciudad = place['place name'];
                this.patient.contacto_emergencia.estado = place['state'];
                this.patient.contacto_emergencia.pais = 'México';
              }
            }
          },
          error: (error) => {
            console.error('Error al obtener datos de dirección', error);
          }
        });
    }
  }  

  cancelButton(): void {
    this.router.navigate(['/lista-pacientes']); // Redirige al usuario a la lista de pacientes
  }

  startRecording() {
    if (this.recording) {
      return; // Si ya se está grabando, no hacer nada
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.start();
      const audioChunks: BlobPart[] | undefined = [];
      this.mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks);
        this.audioUrl = URL.createObjectURL(audioBlob);
        // Limpia o reutiliza el stream según sea necesario
        stream.getTracks().forEach(track => track.stop());
      };
      this.recording = true;
    }).catch(e => {
      console.error('Error al obtener acceso al micrófono: ', e);
    });
  }

  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.recording = false;
    }
  }

  resetRecording() {
    // Si hay una URL de audio previa, libera el recurso
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
    this.audioUrl = '';
    this.recording = false;
    // Si está grabando, detiene la grabación
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  changeTab(direction: 'next' | 'back') {
    const currentIndex = this.tabsOrder.indexOf(this.activeTab);
    if (direction === 'next' && currentIndex < this.tabsOrder.length - 1) {
      // Mueve a la siguiente pestaña
      this.activeTab = this.tabsOrder[currentIndex + 1];
    } else if (direction === 'back' && currentIndex > 0) {
      // Mueve a la pestaña anterior
      this.activeTab = this.tabsOrder[currentIndex - 1];
    }
  }

registerPatient(): void {
  // Recorre el arreglo de consentimientos y asigna la fecha actual formateada a cada entrada
  //this.patient.consentimientos.forEach(consentimiento => {
  //  consentimiento.fecha_registro = new Date(); // Directamente asigna el objeto Date
  //});

  this.patient.consentimientos.push(this.consentimientoTemporal); // Agrega el consentimiento temporal al arreglo
  this.patient.telefonos = this.patient.telefonos.filter(phone => phone.telefono.trim() !== '');
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
