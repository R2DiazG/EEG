import { Component } from '@angular/core';

@Component({
  selector: 'app-eeg-subir-docs',
  templateUrl: './eeg-subir-docs.component.html',
  styleUrl: './eeg-subir-docs.component.scss'
})
export class EegSubirDocsComponent {
  selectedFile: File | null = null;

  constructor() {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onUpload() {
    // You would need to implement this function to handle the file upload process.
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('eegFile', this.selectedFile, this.selectedFile.name);
      console.log('Uploading EEG');
      // Use a service to upload the file via HTTP request
      // this.uploadService.uploadFile(formData).subscribe(...);
    }
  }
}
