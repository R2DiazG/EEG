import { Component } from '@angular/core';
import { EegService } from '../../services/sesiones/eeg.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-eeg-subir-docs',
  templateUrl: './eeg-subir-docs.component.html',
  styleUrls: ['./eeg-subir-docs.component.scss']
})
export class EegSubirDocsComponent {
  selectedFile: File | null = null;
  fecha: string = ''; // Asigna un string vacío como valor inicial
  estadoGeneral: string = ''; // Puede ser 'wakefullness' o cualquier otro valor predeterminado
  resumenSesionActual: string = '';
  idPaciente!: number;
  archivo_eeg!: File;

  estadosEspecificos: {[key: string]: boolean} = {
    hiperventilacion: false,
    estimulo_visual: false,
    estimulo_auditivo: false,
    ninguno: false,
  };

  constructor(
    private eegService: EegService, 
    private router: Router, 
    private location: Location, 
    private route: ActivatedRoute
    ) {}

  ngOnInit() {
    console.log('Hola', this.route.params)
    this.route.paramMap.subscribe(params => {
      console.log(params); // Imprime los parámetros de la URL
      const id_paciente = params.get('id_paciente'); // Asegúrate de que 'idPaciente' coincide con el nombre del parámetro definido en tus rutas.
      if (id_paciente) {
        this.idPaciente = +id_paciente;
        console.log('ID del paciente recibido eeg documentos:', this.idPaciente); // Imprime el id para verificar
      } else {
        console.error('No se recibió el ID del paciente');
      }
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  toggleEstadoEspecifico(estado: string, event: Event): void {
    const inputElement = event.target as HTMLInputElement; // Aserción de tipo
    // La siguiente línea verifica si inputElement es realmente un HTMLInputElement
    // Y luego verifica si está marcado antes de proceder.
    const isChecked = inputElement ? inputElement.checked : false;
  
    if (estado === 'ninguno' && isChecked) {
      Object.keys(this.estadosEspecificos).forEach(key => {
        this.estadosEspecificos[key] = false;
      });
      this.estadosEspecificos['ninguno'] = true;
    } else if (estado !== 'ninguno' && isChecked) {
      this.estadosEspecificos['ninguno'] = false;
      this.estadosEspecificos[estado] = isChecked;
    } else if (!isChecked) {
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
    // Asegúrate de tener el idPaciente disponible aquí
    if (!this.idPaciente) {
      alert('El ID del paciente no está disponible.');
      return;
    }
  
    const formData = new FormData();
    formData.append('eegFile', this.selectedFile, this.selectedFile.name);
    formData.append('fecha', this.fecha);
    formData.append('estado_general', this.estadoGeneral);
    
    const estadosEspecificosSeleccionados = Object.entries(this.estadosEspecificos)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);
    
    formData.append('estado_especifico', estadosEspecificosSeleccionados.join(','));
    formData.append('resumen_sesion_actual', this.resumenSesionActual);
    formData.append('id_paciente', this.idPaciente.toString()); // Añadir el idPaciente al FormData
  
    this.eegService.crearNuevaSesion(formData).subscribe({
      next: (response) => {
        console.log(response);
        alert('EEG subido exitosamente.');
        // Navegar a otro componente o actualizar la vista según sea necesario
      },
      error: (error) => {
        console.error(error);
        alert('Hubo un problema al subir el EEG.');
      }
    });
  }  
}
