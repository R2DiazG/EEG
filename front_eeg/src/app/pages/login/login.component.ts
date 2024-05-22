import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/login/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) {
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      contraseña: new FormControl('', [Validators.required])
    });
  }

  ngOnInit() {}
  onSubmit() {
    if (this.loginForm.valid) {
      const username = this.loginForm.value.username;
      const contraseña = this.loginForm.value.contraseña;
      this.authService.login(username, contraseña).subscribe({
        next: (response) => {
          console.log('Login exitoso', response);
          this.router.navigate(['/lista-pacientes']);
        },
        error: (error) => {
          console.error('Error en el login', error);
          if (error.status === 401) {
            alert('Por favor, verifica tus credenciales.');
          } else {
            alert('Usuario no autorizado. Por favor, confirmar con el administrador.');
          }
        }
      });
    } else {
      alert('Validar campos: Todos los campos son obligatorios y deben cumplir con el formato requerido.');
    }
  }
  

    toggleShowPassword() {
      this.showPassword = !this.showPassword;
    }
  
  onForgotPassword() {
    this.router.navigate(['/olvide-contraseña']);
  }

  registerUser() {
    this.router.navigate(['/registrar-psicologo']);
  }
}
