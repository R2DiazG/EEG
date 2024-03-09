import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-graficas-paciente',
  templateUrl: './graficas-paciente.component.html',
  styleUrl: './graficas-paciente.component.scss'
})
export class GraficasPacienteComponent {

  activeTab: string = 'rawEEG'; // Default active tab

  constructor(private router: Router) {}

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  searchPatient(query: string) {
    console.log('Searching for patient:', query);
    // Implement your search logic here
  }

  uploadEEG() {
    this.router.navigate(['/eeg-subir-docs']);
    console.log('Uploading EEG');
    // Implement your upload logic here
  }

}
