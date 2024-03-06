import { Component } from '@angular/core';
import { InfoPaciente } from '../../models/info-paciente.model';

@Component({
  selector: 'app-registrar-paciente',
  templateUrl: './registrar-paciente.component.html',
  styleUrl: './registrar-paciente.component.scss'
})
export class RegistrarPacienteComponent {
  patient: InfoPaciente = {
    firstName: '',
    lastName: '',
    consent: false
  };

  constructor() {}

onSubmit(): void {
  if (this.patient.consent) {
    console.log('Form Submitted', this.patient);
    // Here you would usually send the patient data to the server.
    // For example, using an Angular service to POST to your API.
  } else {
    // Handle the case where consent is not given.
    console.error('Consent not given');
  }
}
}
