import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  confirmEvent: any;
  
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  
  onConfirm() {
    this.confirmEvent.emit(true); // Emit true when confirmed
  }
  
  onDismiss() {
    this.dialogRef.close(false);// Emit false when dismissed/canceled
  }
}

