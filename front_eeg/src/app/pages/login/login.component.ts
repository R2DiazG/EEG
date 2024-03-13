import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
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
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.loginForm.valid) {
      const email = this.loginForm.value.email;
      const password = this.loginForm.value.password;
      this.authService.login(email, password).then((response: any) => {
          // Manejar la respuesta de login aquí
      });
      this.router.navigate(['/lista-pacientes']); // Navega a la ruta de registrar paciente
    } else {
      alert('Todos los campos son obligatorios.');
    }
  }

  onForgotPassword() {
    this.router.navigate(['/olvide-contra']); // Navega a la ruta de olvidé contraseña
  }

  registerUser() {
    this.router.navigate(['/registrar-psicologo']); // Navega a la ruta de registrar paciente
  }
}
