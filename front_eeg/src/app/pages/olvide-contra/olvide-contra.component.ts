import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-olvide-contra',
  templateUrl: './olvide-contra.component.html',
  styleUrl: './olvide-contra.component.scss'
})
export class OlvideContraComponent {

  passwordForm: FormGroup;

  constructor(private authService: AuthService, private router: Router) {
    this.passwordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.passwordForm.valid) {
      const email = this.passwordForm.value.email;
      const password = this.passwordForm.value.password;
      this.authService.login(email, password).then((response: any) => {
          // Manejar la respuesta de login aquí
      });
    } else {
      alert('Todos los campos son obligatorios.');
    }
  }

  onForgotPassword() {
    alert('Password reset functionality is currently unavailable.');
  }

  cancelForgetPassword() {
    this.router.navigate(['/login']); // Navega a la ruta de registrar paciente
  }

}
