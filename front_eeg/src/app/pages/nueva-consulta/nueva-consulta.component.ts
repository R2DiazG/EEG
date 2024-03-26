import { Component } from '@angular/core';
import { InfoPaciente } from '../../models/info-paciente.model';
import { Consulta } from '../../models/consulta';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nueva-consulta',
  templateUrl: './nueva-consulta.component.html',
  styleUrls: ['./nueva-consulta.component.scss']
})
export class NuevaConsultaComponent {

  constructor(private router: Router) {}  

  patient: InfoPaciente = new InfoPaciente();

  ngOnInit() {
    this.patient.consultations = [{
      date: new Date(),  // Aquí debes decidir qué valor inicial quieres para la fecha
      number: '',  // Inicialización de la cadena vacía para el número
      diagnosis: '' // Inicialización de la cadena vacía para el diagnóstico
    }];
  }

  // addConsultation(): void {
  //   if (!this.patient.consultations) {
  //     this.patient.consultations = [];
  //   }
  //   this.patient.consultations.push({
  //     date: new Date(), // Usa la fecha actual como valor predeterminado o déjalo en blanco
  //     number: '',
  //     diagnosis: ''
  //   });
  // }

  // Método para eliminar una consulta existente
  removeConsultation(index: number): void {
    if (this.patient.consultations) {
      this.patient.consultations.splice(index, 1);
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
  cancel() {
    this.router.navigate(['/graficas-paciente']);
  }
  saveConsultation() {
    console.log('Form Submitted', this.patient);
    // Here you would usually send the patient data to the server.
    // For example, using an Angular service to POST to your API.
  }
}
