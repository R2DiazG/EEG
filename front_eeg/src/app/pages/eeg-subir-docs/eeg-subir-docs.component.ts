import { Component } from '@angular/core';
import { EegService } from '../../services/sesiones/eeg.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MedicamentoService } from '../../services/medicamentos/medicamento.service';
import { CrearMedicamentoDialogComponent } from '../crear-medicamento-dialog/crear-medicamento-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-eeg-subir-docs',
  templateUrl: './eeg-subir-docs.component.html',
  styleUrls: ['./eeg-subir-docs.component.scss']
})
export class EegSubirDocsComponent {
  selectedFile: File | null = null;
  estadoGeneral: string = '';
  resumenSesionActual: string = '';
  idPaciente!: number;
  archivo_eeg!: File;
  medicamentos: any[] = [];
  seleccionados: number[] = [];

  estadosEspecificos: {[key: string]: boolean} = {
    hiperventilacion: false,
    estimulo_visual: false,
    estimulo_auditivo: false,
    ninguno: false,
  };

  constructor(
    private eegService: EegService, 
    private medicamentoService: MedicamentoService,
    public dialog: MatDialog,
    private router: Router, 
    private location: Location, 
    private route: ActivatedRoute
    ) {}

  ngOnInit() {
    console.log('Hola', this.route.params)
    this.route.paramMap.subscribe(params => {
      console.log(params);
      const id_paciente = params.get('id_paciente');
      if (id_paciente) {
        this.idPaciente = +id_paciente;
        console.log('ID del paciente recibido eeg documentos:', this.idPaciente);
      } else {
        console.error('No se recibió el ID del paciente');
      }
    });
  }
 
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  toggleEstadoEspecifico(estado: string, event: MatCheckboxChange): void {
    const isChecked = event.checked;
  
    if (estado === 'ninguno' && isChecked) {
      Object.keys(this.estadosEspecificos).forEach(key => {
        this.estadosEspecificos[key] = false;
      });
      this.estadosEspecificos['ninguno'] = true;
    } else if (estado !== 'ninguno' && isChecked) {
      this.estadosEspecificos['ninguno'] = false;
      this.estadosEspecificos[estado] = true;
    } else {
      this.estadosEspecificos[estado] = isChecked;
    }
  }
  
  onCancel(){
    this.location.back();
  }

  onUpload(): void {
    if (!this.selectedFile) {
      alert('Por favor, selecciona un archivo para subir.');
      return;
    }
  
    if (!this.idPaciente) {
      alert('El ID del paciente no está disponible.');
      return;
    }
  
    const formData = new FormData();
    formData.append('archivo_eeg', this.selectedFile, this.selectedFile.name);
    formData.append('estado_general', this.estadoGeneral);
    
    const estadosEspecificosSeleccionados = Object.entries(this.estadosEspecificos)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);
    
    formData.append('estado_especifico', estadosEspecificosSeleccionados.join(','));
    formData.append('resumen_sesion_actual', this.resumenSesionActual);
    formData.append('id_paciente', this.idPaciente.toString());
  
    formData.forEach((value, key) => {
      console.log(key + ':' + value);
    });
  
    this.eegService.crearNuevaSesion(formData).subscribe({
      next: (response) => {
        console.log(response);
        alert('EEG subido exitosamente.');
        this.location.back();
      },
      error: (error) => {
        console.error(error);
        alert('Hubo un problema al subir el EEG.');
      }
    });
  }
  
}
