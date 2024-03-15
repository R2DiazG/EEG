import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { InfoPaciente } from '../../models/info-paciente.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editar-paciente',
  templateUrl: './editar-paciente.component.html',
  styleUrl: './editar-paciente.component.scss'
})
export class EditarPacienteComponent {
confirmDelete() {
throw new Error('Method not implemented.');
}
onCancel() {
throw new Error('Method not implemented.');
}
addMedication() {
throw new Error('Method not implemented.');
}
  patient: InfoPaciente = new InfoPaciente();

  constructor( private router: Router
    // private patientService: PatientService // You'll need a service to handle data
  ) {}

  ngOnInit(): void {
    this.getPatientDetails();
  }

  getPatientDetails() {
    // This would be populated by calling a service method to get patient details
    // this.patientService.getPatientDetails(id).subscribe(data => this.patient = data);
  }

  cancelEdit() { 
    this.router.navigate(['/ver-paciente']);
  }

  onSubmit() {
    // Here you would call a service to update the patient details
    // this.patientService.updatePatientDetails(this.patient).subscribe(...);
  }
  removeMedication(index: number): void {
    if (this.patient && this.patient.currentMedications) {
      this.patient.currentMedications.splice(index, 1);
    }
  }

}
