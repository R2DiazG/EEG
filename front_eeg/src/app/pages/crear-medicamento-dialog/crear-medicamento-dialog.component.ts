import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MedicamentoService } from '../../services/medicamentos/medicamento.service';

@Component({
  selector: 'app-crear-medicamento-dialog',
  templateUrl: './crear-medicamento-dialog.component.html',
  styleUrls: ['./crear-medicamento-dialog.component.scss']
})
export class CrearMedicamentoDialogComponent {
  medicamento: any = {};

  constructor(
    public dialogRef: MatDialogRef<CrearMedicamentoDialogComponent>,
    private medicamentoService: MedicamentoService // Inyecta el servicio aquí
  ) {}

  crearMedicamento() {
    this.medicamentoService.crearMedicamento(this.medicamento).subscribe({
      next: (result) => {
        console.log('Medicamento creado exitosamente', result);
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error al crear el medicamento', error);
      }
    });
  }
}
