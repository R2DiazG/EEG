import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  user = {
    email: '',
    password: ''
  };

  forgotPasswordEmail = '';
  showForgotPassword = false;

  constructor() {}

  onSubmit() {
    // Logic for when the form is submitted
    if (this.user.email && this.user.password) {
      // Call to authentication service
    }
  }

  onForgotPassword() {
    // Logic for forgot password
    if (this.forgotPasswordEmail) {
      // Send email for password reset
    }
  }

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
  }
}
