import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    user = {
      email: '',
      password: '',
    };
    constructor(private authService: AuthService) {}
    ngOnInit() {}

    onSubmit() {
      const email = this.user.email;
      const password = this.user.password;
      this.authService.login(email, password).then((response: any) => {
          if (response && response.token) {
              // Almacenar el token de forma segura (localStorage, sessionStorage)
              // Redirigir a otra ruta dentro de la aplicación
          } else {
              // Mostrar un mensaje de error al usuario
          }
      });
    }
    onForgotPassword() {
      // Inform user about feature status
      alert('Password reset functionality is currently unavailable.');
    }
    toggleForgotPassword() {
      //this.showForgotPassword = !this.showForgotPassword;
    }
}