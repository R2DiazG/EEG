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
  styleUrls: ['./medicamentos.component.scss'] // Asegúrate de que el path sea correcto
})
export class MedicamentosComponent implements OnInit {
  displayedColumns: string[] = ['nombre_comercial', 'principio_activo', 'presentacion', 'eliminar'];
  dataSource = new MatTableDataSource<any>([]);
  searchControl = new FormControl('');

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

  /*cargarMedicamentos() {
    this.medicamentoService.obtenerMedicamentos().subscribe({
      next: (medicamentos) => {
        this.dataSource.data = medicamentos;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al recuperar medicamentos:', error);
      }
    });
  }*/

  cargarMedicamentos() {
    this.medicamentoService.obtenerMedicamentos().subscribe({
      next: (medicamentos) => {
        // Inicializa isConfirm, isDeleteInitiated, y isDeleted en false para cada medicamento
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

  /*eliminarMedicamento(medicamento: any) {
    // Verifica si ya se ha confirmado la intención de eliminar
    if (medicamento.isConfirm) {
      // Realiza la llamada al servicio para eliminar el medicamento
      this.medicamentoService.eliminarMedicamento(medicamento.id_medicamento).subscribe({
        next: () => {
          console.log('Medicamento eliminado exitosamente');
          this.cargarMedicamentos(); // Recarga la lista de medicamentos
        },
        error: (error) => {
          console.error('Error al eliminar el medicamento:', error);
          medicamento.isConfirm = false; // Restablece el estado de confirmación en caso de error
          this.cdr.detectChanges(); // Actualiza la vista si es necesario
        }
      });
    } else {
      // Establece el estado de confirmación a true para pedir confirmación
      medicamento.isConfirm = true;
      this.cdr.detectChanges(); // Asegúrate de que el cambio se refleje en la vista
  
      // Restablece el estado de confirmación después de un tiempo si el usuario no confirma
      setTimeout(() => {
        medicamento.isConfirm = false;
        this.cdr.detectChanges(); // Actualiza la vista para reflejar el cambio
      }, 3000); // Ajusta el tiempo según sea necesario
    }
  }*/

  eliminarMedicamento(medicamento: any) {
    if (!medicamento.isConfirm && !medicamento.isDeleteInitiated) {
      // Si es la primera vez que se hace clic, solo se muestra el texto 'Eliminar'
      medicamento.isDeleteInitiated = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        if (!medicamento.isConfirm) { // Si aún no está confirmado, revertir
          medicamento.isDeleteInitiated = false;
          this.cdr.detectChanges();
        }
      }, 3000);
    return;
    }
  
    if (medicamento.isConfirm) {
      // Realiza la llamada al servicio para eliminar el medicamento
      this.medicamentoService.eliminarMedicamento(medicamento.id_medicamento).subscribe({
        next: () => {
          console.log('Medicamento eliminado exitosamente');
          medicamento.isDeleted = true; // Marcar el medicamento como eliminado
          medicamento.isDeleteInitiated = false; // Restablece esto para el próximo uso del botón
          this.cdr.detectChanges(); // Actualiza la vista
          this.cargarMedicamentos(); // Recarga la lista de medicamentos
        },
        error: (error) => {
          console.error('Error al eliminar el medicamento:', error);
          medicamento.isConfirm = false;
          medicamento.isDeleteInitiated = false; // Restablece también esta propiedad en caso de error
          this.cdr.detectChanges(); // Actualiza la vista si es necesario
        }
      });
    } else {
      // Establece el estado de confirmación a true para pedir confirmación
      medicamento.isConfirm = true;
      this.cdr.detectChanges(); // Asegúrate de que el cambio se refleje en la vista
  
      // Restablece el estado de confirmación y isDeleteInitiated después de un tiempo si el usuario no confirma
      setTimeout(() => {
        if (!medicamento.isDeleted) { // Si no se ha eliminado, revertir
          medicamento.isConfirm = false;
          medicamento.isDeleteInitiated = false;
          this.cdr.detectChanges();
        }
      }, 3000);
    }
  }
  
  
  abrirDialogoCrearMedicamento() {
    const dialogRef = this.dialog.open(CrearMedicamentoDialogComponent, {
      width: '500px', // Ajusta el tamaño según sea necesario
    });
  
    dialogRef.afterClosed().subscribe(result => {
      console.log('El diálogo fue cerrado');
      this.cargarMedicamentos(); // Recargar la lista de medicamentos tras cerrar el diálogo
    });
  }
}  