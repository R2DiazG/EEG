import { Component } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  confirmEvent: any;
  data: any;
  
  constructor() { }
  
  onConfirm() {
    this.confirmEvent.emit(true); // Emit true when confirmed
  }
  
  onDismiss() {
    this.confirmEvent.emit(false); // Emit false when dismissed/canceled
  }
}
