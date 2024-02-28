import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  user = {
    email: '',
    password: ''
  };
  resetEmail = '';
  forgotPassword = false;
  loginError = false;

  constructor() {}

  onSubmit() {
    // Aquí llamarías a tu servicio de autenticación
    // Simularemos un error de inicio de sesión
    this.loginError = true;
  }

  onResetPassword() {
    // Aquí llamarías a tu servicio para resetear la contraseña
    console.log(`Reset password for: ${this.resetEmail}`);
  }
}
