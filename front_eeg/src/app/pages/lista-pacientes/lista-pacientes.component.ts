import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-pacientes',
  templateUrl: './lista-pacientes.component.html',
  styleUrl: './lista-pacientes.component.scss'
})
export class ListaPacientesComponent {
  patients = [

    // Populate with patient data, typically fetched from a server
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients() {
    // This method would be responsible for loading patients from the backend
  }

  registerPatient() {
    this.router.navigate(['/registrar-paciente']); // Navega a la ruta de registrar paciente
  }

  // viewDetails(patient) {
  //   // Logic to view details for a given patient
  // }
}
