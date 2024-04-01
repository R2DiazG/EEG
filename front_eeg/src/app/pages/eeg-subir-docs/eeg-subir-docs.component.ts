import { Component } from '@angular/core';
import { EegService } from '../../services/sesiones/eeg.service';
import { Router } from '@angular/router';

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

  estadosEspecificos: {[key: string]: boolean} = {
    hiperventilacion: false,
    estimulo_visual: false,
    estimulo_auditivo: false,
    ninguno: false,
  };

  constructor(private eegService: EegService, private router: Router) {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  toggleEstadoEspecifico(estado: string, isChecked: boolean): void {
    if (estado === 'ninguno') {
      if (isChecked) {
        // Si 'Ninguno' es seleccionado, desmarcar y deshabilitar todos los demás
        Object.keys(this.estadosEspecificos).forEach(key => {
          this.estadosEspecificos[key] = false;
        });
        // Marcar 'Ninguno' como seleccionado
        this.estadosEspecificos['ninguno'] = true;
      } else {
        // Si 'Ninguno' es deseleccionado, habilitar todos los demás
        this.estadosEspecificos['ninguno'] = false;
      }
    } else {
      // Si se selecciona cualquier otra opción, deseleccionar 'Ninguno'
      this.estadosEspecificos['ninguno'] = false;
      this.estadosEspecificos[estado] = isChecked;
    }
  }
  
  onCancel(){
    this.router.navigate(['/graficas-paciente']);
  }

  onUpload(): void {
    if (!this.selectedFile) {
      alert('Por favor, selecciona un archivo para subir.');
      return;
    }
    
    // Prepara FormData
    const formData = new FormData();
    formData.append('eegFile', this.selectedFile, this.selectedFile.name);
  
    // Agrega cualquier otro campo de formulario relevante aquí
    formData.append('fecha', this.fecha);
    formData.append('estado_general', this.estadoGeneral);
  
    // Convierte el objeto estadosEspecificos a un array de claves donde el valor es true
    const estadosEspecificosSeleccionados = Object.entries(this.estadosEspecificos)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);
  
    // Usa join(',') para unir los elementos del array en una cadena de texto
    formData.append('estado_especifico', estadosEspecificosSeleccionados.join(','));
  
    formData.append('resumen_sesion_actual', this.resumenSesionActual);
  
    // Llama al servicio para subir la sesión con el archivo y otros datos
    this.eegService.crearNuevaSesion(formData).subscribe({
      next: (response) => {
        console.log(response);
        alert('EEG subido exitosamente.');
      },
      error: (error) => {
        console.error(error);
        alert('Hubo un problema al subir el EEG.');
      }
    });
  }
}
