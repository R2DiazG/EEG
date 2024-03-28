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
  }

  /*
  if (this.loginForm.valid) {
      const username = this.loginForm.value.username;
      const contraseña = this.loginForm.value.contraseña;
      this.authService.login(username, contraseña).subscribe({
        next: (response) => {
          // Asumiendo que 'response' tiene un campo 'aprobacion'
          if (response.aprobacion) {
            console.log('Login exitoso', response);
            // Guardar el token JWT (si tu backend lo retorna) para futuras solicitudes
            localStorage.setItem('token', response.token);
            this.router.navigate(['/lista-pacientes']); // Ajusta esta ruta según sea necesario
          } else {
            // Manejar el caso cuando la aprobación es falsa
            alert('Acceso denegado. Su cuenta aún no ha sido aprobada.');
          }
        },
        error: (error) => {
          console.error('Error en el login', error);
          alert('Falló el inicio de sesión.');
        }
      });
    } else {
      alert('Todos los campos son obligatorios.');
    }
  */
  

  onForgotPassword() {
    this.router.navigate(['/olvide-contra']); // Navega a la ruta de olvidé contraseña
  }

  registerUser() {
    this.router.navigate(['/registrar-psicologo']); // Navega a la ruta de registrar paciente
  }
}
