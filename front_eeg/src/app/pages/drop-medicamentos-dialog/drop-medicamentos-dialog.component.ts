import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MedicamentoService } from '../../services/medicamentos/medicamento.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-drop-medicamentos-dialog',
  templateUrl: './drop-medicamentos-dialog.component.html',
  styleUrls: ['./drop-medicamentos-dialog.component.scss']
})
export class DropMedicamentosDialogComponent implements OnInit {

  medicamentos$!: Observable<any[]>; // Esta es la declaración correcta para un Observable que se llenará con medicamentos.
  selectedMedicamentos: any[] = []; // Almacenará los medicamentos seleccionados.

  constructor(
    private dialogRef: MatDialogRef<DropMedicamentosDialogComponent>,
    private medicamentoService: MedicamentoService,
    @Inject(MAT_DIALOG_DATA) public data: any // Inyecta los datos pasados al diálogo.
  ) {}

  ngOnInit() {
    this.medicamentos$ = this.medicamentoService.obtenerMedicamentos();
    
    // Solo para depuración: suscribirse al Observable para ver los datos.
    this.medicamentos$.subscribe({
      next: (medicamentos) => {
        console.log('Medicamentos recibidos:', medicamentos);
      },
      error: (error) => {
        console.error('Error al obtener medicamentos:', error);
      }
    });
    if (this.data && this.data.selectedMedicamentos) {
      this.selectedMedicamentos = this.data.selectedMedicamentos;
    }
  }
  
  closeDialog() {
    this.dialogRef.close(this.selectedMedicamentos);
  }
}