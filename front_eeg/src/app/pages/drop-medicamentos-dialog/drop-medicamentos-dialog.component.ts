import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MedicamentoService } from '../../services/medicamentos/medicamento.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-drop-medicamentos-dialog',
  templateUrl: './drop-medicamentos-dialog.component.html',
  styleUrls: ['./drop-medicamentos-dialog.component.scss']
})
export class DropMedicamentosDialogComponent implements OnInit {
  medicamentos$!: Observable<any[]>; 
  selectedMedicamentos: number[] = []; // Ahora es un array para múltiples IDs de medicamentos
  placeholderText = 'Buscar medicamentos'; // Placeholder inicial

  constructor(
    private dialogRef: MatDialogRef<DropMedicamentosDialogComponent>,
    private medicamentoService: MedicamentoService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.medicamentos$ = this.medicamentoService.obtenerMedicamentos();
    console.log('Medicamentos Observable:', this.medicamentos$);

    this.medicamentos$.subscribe({
      next: (medicamentos) => {
        console.log('Medicamentos recibidos:', medicamentos);
      },
      error: (error) => {
        console.error('Error al obtener medicamentos:', error);
      }
    });

    // Actualiza selectedMedicamentos si existen algunos pasados en data
    if (this.data && this.data.selectedMedicamentos) {
      this.selectedMedicamentos = this.data.selectedMedicamentos;
    }
    this.updatePlaceholder();
  }

  onMedicamentosSelected() {
    // Llamado cuando se seleccionan nuevos medicamentos
    this.updatePlaceholder();
  }

  onMedicamentosCleared() {
    // Llamado cuando se limpia la selección
    this.selectedMedicamentos = [];
    this.updatePlaceholder();
  }

  updatePlaceholder() {
    // Cambia el placeholder según si hay medicamentos seleccionados
    this.placeholderText = this.selectedMedicamentos.length > 0 ? '' : 'Buscar medicamentos';
  }

  guardarSeleccion() {
    // Aquí deberías agregar tu lógica para procesar los medicamentos seleccionados
    console.log('Medicamentos seleccionados:', this.selectedMedicamentos);
    // Procesa los medicamentos seleccionados
    this.dialogRef.close(this.selectedMedicamentos); // Cierra el diálogo y devuelve los medicamentos seleccionados
  }

  closeDialog() {
    this.dialogRef.close(null); // Cierra el diálogo sin devolver nada si se pulsa "Cerrar"
  }
}
