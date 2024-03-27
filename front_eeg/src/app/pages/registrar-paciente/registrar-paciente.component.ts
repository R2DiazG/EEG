import { Component } from '@angular/core';
import { InfoPaciente } from '../../models/info-paciente.model';
import { Router } from '@angular/router';
import { Consulta } from '../../models/consulta';

@Component({
  selector: 'app-registrar-paciente',
  templateUrl: './registrar-paciente.component.html',
  styleUrls: ['./registrar-paciente.component.scss']
})

export class RegistrarPacienteComponent {

  patient: InfoPaciente = new InfoPaciente();
  activeTab: string = 'infoPatient'; // Default active tab

  constructor(private router: Router) {}

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  addMedication(): void {
    if (!this.patient.currentMedications) {
      this.patient.currentMedications = [];
    }
    this.patient.currentMedications.push('');
  }

  addConsultation(): void {
    if (!this.patient.consultations) {
      this.patient.consultations = [];
    }
    this.patient.consultations.push({
      date: new Date(), // Usa la fecha actual como valor predeterminado o déjalo en blanco
      number: '',
      diagnosis: ''
    });
  }

  // Método para eliminar una consulta existente
  removeConsultation(index: number): void {
    if (this.patient.consultations) {
      this.patient.consultations.splice(index, 1);
    }
  }

  addPhone() {
    const phoneInputs = document.getElementById('phoneInputs');
    if (phoneInputs) { // Verifica si phoneInputs no es null
      const newInput = document.createElement('input');
      newInput.setAttribute('type', 'text');
      newInput.setAttribute('placeholder', 'Teléfono');
      newInput.setAttribute('name', 'phone[]');
      
      const newIndex = phoneInputs.children.length + 1;
      newInput.setAttribute('id', `phone${newIndex}`);
      
      phoneInputs.appendChild(newInput);
    } else {
      console.error('El elemento #phoneInputs no fue encontrado en el DOM.');
    }
  }  

  addEmail() {
    const emailInputs = document.getElementById('emailInputs');
    if (emailInputs) { // Verifica si phoneInputs no es null
      const newInput = document.createElement('input');
      newInput.setAttribute('type', 'email');
      newInput.setAttribute('placeholder', 'Correo electronico');
      newInput.setAttribute('name', 'email[]');
      
      const newIndex = emailInputs.children.length + 1;
      newInput.setAttribute('id', `email${newIndex}`);
      
      emailInputs.appendChild(newInput);
    } else {
      console.error('El elemento #emailInputs no fue encontrado en el DOM.');
    }
  }  

  onSubmit(): void {
    if (this.patient.consent) {
      console.log('Form Submitted', this.patient);
      // Here you would usually send the patient data to the server.
      // For example, using an Angular service to POST to your API.
    } else {
    // //   // Handle the case where consent is not given.
            console.error('Consent not given');
    }
  }
}
