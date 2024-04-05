import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MedicamentoService } from '../../services/medicamentos/medicamento.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-drop-medicamentos-dialog',
  templateUrl: './drop-medicamentos-dialog.component.html',
  styleUrls: ['./drop-medicamentos-dialog.component.scss'] // Asegúrate de que esté "styleUrls" en plural
})
export class DropMedicamentosDialogComponent implements OnInit { // Asegúrate de implementar OnInit

  medicamentos$!: Observable<any[]>;
  selectedMedicamentos: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<DropMedicamentosDialogComponent>,
    private medicamentoService: MedicamentoService // Inyecta el MedicamentoService aquí
  ) {}

  ngOnInit() {
    this.medicamentos$ = this.medicamentoService.obtenerMedicamentos(); // Asignación correcta dentro de ngOnInit
  }

  closeDialog() {
    this.dialogRef.close(this.selectedMedicamentos); // Devuelve los medicamentos seleccionados cuando se cierra el diálogo
  }
}
