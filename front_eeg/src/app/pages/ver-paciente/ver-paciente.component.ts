import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-ver-paciente',
  templateUrl: './ver-paciente.component.html',
  styleUrl: './ver-paciente.component.scss'
})
export class VerPacienteComponent {
  constructor(private router: Router, public dialog: MatDialog) { }

  editPatient() { 
    this.router.navigate(['/editar-paciente']); // Navega a la ruta de editar paciente
  }
  deletePatient(): void {
    // Abre el diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '250px',
      data: { message: '¿Estás seguro de que quieres eliminar a este paciente?' }
    });

    // Después de cerrar el diálogo, revisa si el usuario confirmó la acción
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        // Aquí es donde llamarías al servicio que maneja la eliminación del paciente
        console.log('El paciente ha sido eliminado');
        // Por ejemplo: this.patientService.deletePatient(patientId).subscribe(...)
      }
    });
  }
}