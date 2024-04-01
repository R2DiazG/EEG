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
  estadosEspecificos: string[] = [];
  resumenSesionActual: string = '';

  constructor(private eegService: EegService, private router: Router) {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  // Actualización en el componente para manejar la selección de checkboxes
  toggleEstadoEspecifico(estado: string, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;
  
    if (estado === 'none' && isChecked) {
      // Si 'Ninguno' es seleccionado, asegúrate de desmarcar todos los demás y limpiar el arreglo
      this.estadosEspecificos = ['none'];
      // Aquí necesitarías desmarcar los demás checkboxes manualmente si no se actualizan automáticamente
    } else if (estado !== 'none' && isChecked) {
      // Elimina 'none' si estaba seleccionado y agrega el nuevo estado si no es 'none'
      this.estadosEspecificos = this.estadosEspecificos.filter(e => e !== 'none');
      this.estadosEspecificos.push(estado);
    } else {
      // Si un checkbox es desmarcado, simplemente quítalo del arreglo
      this.estadosEspecificos = this.estadosEspecificos.filter(e => e !== estado);
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
    formData.append('estado_especifico', this.estadosEspecificos.join(','));
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
