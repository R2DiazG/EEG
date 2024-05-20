import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('audioControl') audioControl!: ElementRef;
  patient: InfoPaciente = new InfoPaciente();
  activeTab: string = 'infoPatient';
  id_usuario: number | undefined;
  fechaActual: string = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
  mediaRecorder!: MediaRecorder;
  audioUrl!: string;
  recording: boolean = false;
  audioBlob!: Blob;
  tabsOrder: string[] = ['infoPatient', 'contactPatient', 'infoFamily', 'consent'];

  consentimientoTemporal: { consentimiento: number; fecha_registro: string, audio_filename: string } = {
    consentimiento: 1,
    fecha_registro: this.fechaActual,
    audio_filename: ''
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private pacienteService: PacienteService,
    private codigoPostalService: CodigoPostalService
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.initDefaultContactInfo();
  }

  initDefaultContactInfo(): void {
    while (this.patient.telefonos.length < 3) {
      this.patient.telefonos.push({ telefono: '' });
    }

    if (this.patient.correos_electronicos.length === 0) {
      this.addEmail();
    }

    if (this.patient.direcciones.length === 0) {
      this.addAddress();
    }
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id_usuario) {
          this.id_usuario = user.id_usuario;
          console.log('ID de usuario actual:', this.id_usuario);
        } else {
          console.error('Usuario no identificado. Redireccionando al login.');
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        console.error('Error al obtener el usuario actual', err);
        this.router.navigate(['/login']);
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
    });
  }

  fillAddressData(index: number, section: 'patientAddress' | 'emergencyContact') {
    let postalCode: string | undefined;

    if (section === 'patientAddress') {
      postalCode = this.patient.direcciones[index]?.codigo_postal;
    } else {
      postalCode = this.patient.contacto_emergencia?.codigo_postal;
    }

    if (postalCode) {
      this.codigoPostalService.getAddressByPostalCode(postalCode)
        .subscribe({
          next: (data) => {
            if (data && data.places && data.places.length > 0) {
              const place = data.places[0];
              if (section === 'patientAddress') {
                this.patient.direcciones[index].estado = place['state'];
                this.patient.direcciones[index].pais = 'México';
              } else {
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
    this.router.navigate(['/lista-pacientes']);
  }

  startRecording(): void {
    if (this.recording) {
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.start();
      const audioChunks: BlobPart[] = [];
      this.mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };
      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(audioChunks);
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      this.recording = true;
    }).catch(e => {
      console.error('Error al obtener acceso al micrófono: ', e);
    });
  }

  stopRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.recording = false;
    }
  }

  resetRecording(): void {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
    this.audioUrl = '';
    this.recording = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  changeTab(direction: 'next' | 'back') {
    const currentIndex = this.tabsOrder.indexOf(this.activeTab);
    if (direction === 'next' && currentIndex < this.tabsOrder.length - 1) {
      this.activeTab = this.tabsOrder[currentIndex + 1];
    } else if (direction === 'back' && currentIndex > 0) {
      this.activeTab = this.tabsOrder[currentIndex - 1];
    }
  }

  registerPatient(): void {
    this.patient.consentimientos.push(this.consentimientoTemporal);
    this.patient.telefonos = this.patient.telefonos.filter(phone => phone.telefono.trim() !== '');
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(this.patient)], { type: 'application/json' }));
    if (this.audioUrl) {
      fetch(this.audioUrl)
        .then(response => response.blob())
        .then(blob => {
          const audioFile = new File([blob], 'consentimiento.mp3', { type: 'audio/mp3' });
          formData.append('audio_consentimiento', audioFile);
          if (this.id_usuario) {
            // Debug: Log the FormData content
            formData.forEach((value, key) => {
              console.log(`FormData key: ${key}, value:`, value);
            });
            this.pacienteService.crearPaciente(this.id_usuario, formData).subscribe({
              next: (response) => {
                console.log('Paciente registrado con éxito', response);
                this.router.navigate(['/lista-pacientes']);
              },
              error: (error) => {
                console.error('Error al registrar el paciente', error);
              }
            });
          } else {
            console.error('ID de usuario no definido.');
          }
        })
        .catch(error => {
          console.error('Error al convertir el audio a Blob', error);
        });
    } else {
      console.error('No hay URL de audio disponible');
      if (this.id_usuario) {
        // Debug: Log the FormData content
        formData.forEach((value, key) => {
          console.log(`FormData key: ${key}, value:`, value);
        });
        this.pacienteService.crearPaciente(this.id_usuario, formData).subscribe({
          next: (response) => {
            console.log('Paciente registrado con éxito', response);
            this.router.navigate(['/lista-pacientes']);
          },
          error: (error) => {
            console.error('Error al registrar el paciente', error);
          }
        });
      } else {
        console.error('ID de usuario no definido.');
      }
    }
  }
}
