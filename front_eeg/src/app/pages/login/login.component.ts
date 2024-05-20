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
/*
  onSubmit() {
    if (this.loginForm.valid) {
      const username = this.loginForm.value.username;
      const contraseña = this.loginForm.value.contraseña;
      this.authService.login(username, contraseña).subscribe({
        next: (response) => {
          // Manejar la respuesta de login aquí
          console.log('Login exitoso', response);
          this.router.navigate(['/lista-pacientes']); // Ajusta esta ruta según sea necesario
        },
        error: (error) => {
          console.error('Error en el login', error);
          alert('Falló el inicio de sesión.');
        }
      });
    } else {
      alert('Todos los campos son obligatorios.');
    }
  }*/
  onSubmit() {
    if (this.loginForm.valid) {
      const username = this.loginForm.value.username;
      const contraseña = this.loginForm.value.contraseña;
      this.authService.login(username, contraseña).subscribe({
        next: (response) => {
          console.log('Login exitoso', response);
          this.router.navigate(['/lista-pacientes']); // Ajusta esta ruta según sea necesario
        },
        error: (error) => {
          console.error('Error en el login', error);
          if (error.status === 401) {
            // Error de autorización
            alert('Por favor, verifica tus credenciales.');
          } else {
            // Otros errores del servidor
            alert('Usuario no autorizado. Por favor, confirmar con el administrador.');
          }
        }
      });
    } else {
      // Los campos no son válidos
      alert('Validar campos: Todos los campos son obligatorios y deben cumplir con el formato requerido.');
    }
  }
  

    toggleShowPassword() {
      this.showPassword = !this.showPassword;
    }
  
  onForgotPassword() {
    this.router.navigate(['/olvide-contraseña']); // Navega a la ruta de olvidé contraseña
  }

  registerUser() {
    this.router.navigate(['/registrar-psicologo']); // Navega a la ruta de registrar paciente
  }
}
