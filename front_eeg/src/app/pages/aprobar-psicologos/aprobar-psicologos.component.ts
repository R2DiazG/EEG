import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-aprobar-psicologos',
  templateUrl: './aprobar-psicologos.component.html',
  styleUrl: './aprobar-psicologos.component.scss'
})
export class AprobarPsicologosComponent {
  patients = [

    // Populate with patient data, typically fetched from a server
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    // This method would be responsible for loading patients from the backend
  }

  // viewDetails(patient) {
  //   // Logic to view details for a given patient
  // }
}
