import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MedicamentoService } from '../../services/medicamentos/medicamento.service';
import { EegService } from '../../services/sesiones/eeg.service';

@Component({
  selector: 'app-drop-medicamentos-dialog',
  templateUrl: './drop-medicamentos-dialog.component.html',
  styleUrls: ['./drop-medicamentos-dialog.component.scss']
})
export class DropMedicamentosDialogComponent implements OnInit {
  medicamentos: any[] = [];
  filteredMedicamentos: any[] = [];
  selectedMedicamentos: any[] = [];
  placeholderText = 'Buscar medicamentos';
  idSesion!: number;

  constructor(
    private dialogRef: MatDialogRef<DropMedicamentosDialogComponent>,
    private medicamentoService: MedicamentoService,
    private eegService: EegService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.medicamentoService.obtenerMedicamentos().subscribe({
      next: (medicamentos) => {
        this.medicamentos = medicamentos;
        this.filteredMedicamentos = medicamentos;
        this.populateMedicamentosList();
      },
      error: (error) => {
        console.error('Error al obtener medicamentos:', error);
      }
    });

    if (this.data && this.data.idSesion) {
      this.idSesion = this.data.idSesion;
    }

    if (this.data && this.data.selectedMedicamentos) {
      this.selectedMedicamentos = this.data.selectedMedicamentos;
      this.updateSelectedMedicamentos();
    }

    this.updatePlaceholder();
  }

  populateMedicamentosList() {
    const medicamentosList = document.getElementById('medicamentosList') as HTMLUListElement;
    medicamentosList.innerHTML = '';
    this.filteredMedicamentos.forEach(medicamento => {
      const li = document.createElement('li');
      li.textContent = medicamento.nombre_comercial;
      li.dataset['id'] = medicamento.id_medicamento;
      li.addEventListener('click', () => this.selectMedicamento(medicamento));
      medicamentosList.appendChild(li);
    });
    this.toggleMedicamentosList();
  }

  selectMedicamento(medicamento: any) {
    if (!this.selectedMedicamentos.some(m => m.id_medicamento === medicamento.id_medicamento)) {
      this.selectedMedicamentos.push(medicamento);
      this.updateSelectedMedicamentos();
    }
  }

  updateSelectedMedicamentos() {
    const selectedContainer = document.getElementById('selectedMedicamentos') as HTMLDivElement;
    selectedContainer.innerHTML = '';
    this.selectedMedicamentos.forEach(medicamento => {
      const span = document.createElement('span');
      span.textContent = medicamento.nombre_comercial;
      span.classList.add('medicamento-tag');
      span.dataset['id'] = medicamento.id_medicamento;
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'x';
      closeBtn.classList.add('close-btn');
      closeBtn.addEventListener('click', () => this.removeMedicamento(medicamento.id_medicamento));
      span.appendChild(closeBtn);
      selectedContainer.appendChild(span);
    });
    this.updatePlaceholder();
  }

  removeMedicamento(id: number) {
    this.selectedMedicamentos = this.selectedMedicamentos.filter(m => m.id_medicamento !== id);
    this.updateSelectedMedicamentos();
  }

  updatePlaceholder() {
    const input = document.getElementById('medicamentosInput') as HTMLInputElement;
    input.placeholder = this.selectedMedicamentos.length > 0 ? '' : 'Buscar medicamentos';
  }

  guardarSeleccion() {
    if (this.idSesion && this.selectedMedicamentos.length > 0) {
      const selectedIds = this.selectedMedicamentos.map(m => m.id_medicamento);
      this.eegService.agregarMedicamentosSesion(this.idSesion, selectedIds).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          this.dialogRef.close(this.selectedMedicamentos);
        },
        error: (error) => {
          console.error('Error al agregar medicamentos a la sesión:', error);
        }
      });
    } else {
      this.dialogRef.close(null);
    }
  }

  closeDialog() {
    this.dialogRef.close(null);
  }

  toggleMedicamentosList() {
    const medicamentosList = document.getElementById('medicamentosList') as HTMLUListElement;
    if (this.filteredMedicamentos.length > 0) {
      medicamentosList.classList.remove('hidden');
    } else {
      medicamentosList.classList.add('hidden');
    }
  }

  filterMedicamentos() {
    const input = document.getElementById('medicamentosInput') as HTMLInputElement;
    const filter = input.value.toLowerCase();
    this.filteredMedicamentos = this.medicamentos.filter(medicamento =>
      medicamento.nombre_comercial.toLowerCase().includes(filter)
    );
    this.populateMedicamentosList();
  }
}