import { Component } from '@angular/core';

@Component({
  selector: 'app-lista-pacientes',
  templateUrl: './lista-pacientes.component.html',
  styleUrl: './lista-pacientes.component.scss'
})
export class ListaPacientesComponent {
  patients = [

    // Populate with patient data, typically fetched from a server
  ];

  constructor() { }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients() {
    // This method would be responsible for loading patients from the backend
  }

  registerPatient() {
    // Logic to navigate to the patient registration form
  }

  viewDetails(patient) {
    // Logic to view details for a given patient
  }
}
