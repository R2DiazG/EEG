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
  patient: InfoPaciente = new InfoPaciente();
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
