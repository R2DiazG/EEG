import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MedicamentoService } from '../../services/medicamentos/medicamento.service';
import { Observable } from 'rxjs';
import { EegService } from '../../services/sesiones/eeg.service';

@Component({
  selector: 'app-drop-medicamentos-dialog',
  templateUrl: './drop-medicamentos-dialog.component.html',
  styleUrls: ['./drop-medicamentos-dialog.component.scss']
})
export class DropMedicamentosDialogComponent implements OnInit {
  medicamentos$!: Observable<any[]>; 
  selectedMedicamentos: number[] = []; // Ahora es un array para múltiples IDs de medicamentos
  placeholderText = 'Buscar medicamentos'; // Placeholder inicial
  idSesion!: number; // ID de la sesión

  constructor(
    private dialogRef: MatDialogRef<DropMedicamentosDialogComponent>,
    private medicamentoService: MedicamentoService,
    private eegService: EegService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.medicamentos$ = this.medicamentoService.obtenerMedicamentos();
    console.log('Medicamentos Observable:', this.medicamentos$);

    if (this.data && this.data.idSesion) {
      this.idSesion = this.data.idSesion;
    }
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
    if (this.idSesion && this.selectedMedicamentos.length > 0) {
      console.log('Medicamentos seleccionados:', this.selectedMedicamentos);
      console.log('ID de la sesión:', this.idSesion);
      // Envía los IDs de medicamentos seleccionados al servidor
      this.eegService.agregarMedicamentosSesion(this.idSesion, this.selectedMedicamentos)
        .subscribe({
          next: (response) => {
            console.log('Respuesta del servidor:', response);
            this.dialogRef.close(this.selectedMedicamentos); // Devuelve los medicamentos seleccionados
          },
          error: (error) => {
            console.error('Error al agregar medicamentos a la sesión:', error);
          }
        });
    } else {
      // Cierra el diálogo sin realizar cambios si no se seleccionó ningún medicamento o falta el ID de sesión
      this.dialogRef.close(null);
    }
  }

  closeDialog() {
    this.dialogRef.close(null); // Cierra el diálogo sin devolver nada si se pulsa "Cerrar"
  }
}
