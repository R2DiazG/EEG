import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { InfoPaciente } from '../../models/info-paciente.model';
import { Router } from '@angular/router';
import { Consulta } from '../../models/consulta';

@Component({
  selector: 'app-editar-paciente',
  templateUrl: './editar-paciente.component.html',
  styleUrls: ['./editar-paciente.component.scss']
})
export class EditarPacienteComponent {
  isEditMode: boolean = false;
  //patient: InfoPaciente = new InfoPaciente();
  patient = {
    firstName: 'Eugene',
    lastName: 'Fitzherbert',
    surname: 'Charming',
    birthDate: '15/02/2000', // Asegúrate de que el formato sea YYYY-MM-DD
    gender: 'male',
    civilStatus: 'married',
    laterality: 'right',
    educationLevel: 'university',
    occupation: 'Empresario',
    phone: '1234567890',
    email: 'eugene@example.com',
    address: 'calle 123',
    city: 'Monterrey',
    state: 'Nuevo LEon',
    zipCode: '12345',
    country: 'Mexico',
    currentMedications: ['Ninguno'], // Añade medicamentos actuales
    consultations: [
      {
        date: new Date('20/02/2024'), // Asegúrate de que el formato sea YYYY-MM-DD
        number: '1',
        diagnosis: 'Migraña'
      }
    ],
    relativeFirstName: 'Eugene',
    relativeLastName: 'Fitzherbert',
    relativeSurname: 'Rider',
    relativeRelationship: 'Padre',
    relativePhone: '1234567890',
    relativeEmail: 'fitzherbert&#64;gmail.com',
    relativeAddress: 'Calle 123',
    relativeCity: 'Monterrey',
    relativeState: 'Nuevo Leon',
    relativeZipCode: '12345',
    relativeCountry: 'Mexico',
    relativeNotes: 'No hay notas adicionales',
    medicalHistory: 'El paciente ha reportado episodios de cefalea y mareos intermitentes en las últimas dos semanas. Actualmente toma medicación para el control de la migraña. Se ha programado el EEG después de una noche de privación de sueño para evaluar la actividad cerebral durante episodios de fatiga extrema. No hay antecedentes familiares de epilepsia. Estudios previos de imagen no muestran anomalías estructurales.',
    // Añade más campos según sea necesario
  };
  activeTab: string = 'infoPatient'; // Default active tab

confirmDelete() {
throw new Error('Method not implemented.');
}
onCancel() {
throw new Error('Method not implemented.');
}
  constructor(private router: Router) {}

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
    // private patientService: PatientService // You'll need a service to handle data

  ngOnInit(): void {
    this.getPatientDetails();
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  }

  getPatientDetails() {
    // This would be populated by calling a service method to get patient details
    // this.patientService.getPatientDetails(id).subscribe(data => this.patient = data);
  }

  cancelEdit() { 
    this.isEditMode = false; // Desactiva el modo de edición
    // Opcionalmente navega de vuelta a la vista de solo lectura
    this.router.navigate(['/ver-paciente']);
  }

  onSubmit() {
    if (this.isEditMode) {
      // Implementa la lógica para actualizar los detalles del paciente
      // Por ejemplo, a través de un servicio que haga una petición HTTP
      console.log('Actualizando información del paciente', this.patient);
      this.isEditMode = false; // Desactiva el modo de edición después de guardar los cambios
    }
  }

  addMedication(): void {
    if (!this.patient.currentMedications) {
      this.patient.currentMedications = [];
    }
    this.patient.currentMedications.push(''); // Añade un string vacío para un nuevo medicamento
  }

  removeMedication(index: number): void {
    if (this.patient && this.patient.currentMedications) {
      this.patient.currentMedications.splice(index, 1);
    }
  }

  addConsultation(): void {
    const newConsultation: Consulta = {
      date: new Date(), // Asigna una fecha predeterminada o deja en blanco
      number: '', // Número de consulta inicial vacío
      diagnosis: '' // Diagnóstico previo inicial vacío
    };
    if (!this.patient.consultations) {
      this.patient.consultations = [];
    }
    this.patient.consultations.push(newConsultation);
  }

  removeConsultation(index: number): void {
    this.patient.consultations?.splice(index, 1);
  }
  

}
