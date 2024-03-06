import { Component } from '@angular/core';

@Component({
  selector: 'app-menu-lateral',
  templateUrl: './menu-lateral.component.html',
  styleUrl: './menu-lateral.component.scss'
})
export class MenuLateralComponent {

  constructor() { }

  logout() {
    // Here you should implement the logic for logging out a user
    console.log('Logout function called');
    // e.g., this.authService.logout();
  }

}
