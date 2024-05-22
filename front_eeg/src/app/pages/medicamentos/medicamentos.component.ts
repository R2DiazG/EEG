import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MedicamentoService } from '../../services/medicamentos/medicamento.service'; // Asegúrate de tener la ruta correcta
import { AuthService } from '../../services/login/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { CrearMedicamentoDialogComponent } from '../crear-medicamento-dialog/crear-medicamento-dialog.component'; // Asegúrate de tener la ruta correcta

@Component({
  selector: 'app-medicamentos',
  templateUrl: './medicamentos.component.html',
  styleUrls: ['./medicamentos.component.scss']
})
export class MedicamentosComponent implements OnInit {
  displayedColumns: string[] = ['nombre_comercial', 'principio_activo', 'presentacion', 'acciones', 'eliminar'];
  dataSource = new MatTableDataSource<any>([]);
  searchControl = new FormControl('');
  editModeMap: { [key: number]: boolean } = {};

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private medicamentoService: MedicamentoService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.cargarMedicamentos();
    this.searchControl.valueChanges.subscribe((value) => {
      this.applyFilter(value || '');
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  cargarMedicamentos() {
    this.medicamentoService.obtenerMedicamentos().subscribe({
      next: (medicamentos) => {
        this.dataSource.data = medicamentos.map(medicamento => ({
          ...medicamento,
          isConfirm: false,
          isDeleteInitiated: false,
          isDeleted: false,
        }));
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al recuperar medicamentos:', error);
      }
    });
  }
  

  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  enableEditMode(medicamento: any) {
    this.editModeMap[medicamento.id_medicamento] = true;
    this.cdr.detectChanges();
  }

  saveMedicamento(medicamento: any) {
    if (this.editModeMap[medicamento.id_medicamento]) {
      this.medicamentoService.actualizarMedicamento(medicamento.id_medicamento, medicamento).subscribe({
        next: (res) => {
          console.log('Medicamento actualizado exitosamente', res);
          this.editModeMap[medicamento.id_medicamento] = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al actualizar el medicamento:', error);
        }
      });
    }
  }

  cancelEditMode(medicamento: any) {
    this.editModeMap[medicamento.id_medicamento] = false;
    this.cdr.detectChanges();
  }

  eliminarMedicamento(medicamento: any) {
    if (!medicamento.isConfirm && !medicamento.isDeleteInitiated) {
      medicamento.isDeleteInitiated = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        if (!medicamento.isConfirm) {
          medicamento.isDeleteInitiated = false;
          this.cdr.detectChanges();
        }
      }, 3000);
    return;
    }
  
    if (medicamento.isConfirm) {
      this.medicamentoService.eliminarMedicamento(medicamento.id_medicamento).subscribe({
        next: () => {
          console.log('Medicamento eliminado exitosamente');
          medicamento.isDeleted = true;
          medicamento.isDeleteInitiated = false;
          this.cdr.detectChanges();
          this.cargarMedicamentos();
        },
        error: (error) => {
          console.error('Error al eliminar el medicamento:', error);
          medicamento.isConfirm = false;
          medicamento.isDeleteInitiated = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      medicamento.isConfirm = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        if (!medicamento.isDeleted) {
          medicamento.isConfirm = false;
          medicamento.isDeleteInitiated = false;
          this.cdr.detectChanges();
        }
      }, 3000);
    }
  }
  
  
  abrirDialogoCrearMedicamento() {
    const dialogRef = this.dialog.open(CrearMedicamentoDialogComponent, {
      width: '500px',
    });
  
    dialogRef.afterClosed().subscribe(result => {
      console.log('El diálogo fue cerrado');
      this.cargarMedicamentos();
    });
  }
}  