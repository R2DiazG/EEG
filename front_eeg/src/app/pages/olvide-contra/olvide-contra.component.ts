import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/login/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-olvide-contra',
  templateUrl: './olvide-contra.component.html',
  styleUrls: ['./olvide-contra.component.scss']
})
export class OlvideContraComponent {
  passwordForm: FormGroup;

  constructor(private authService: AuthService, private router: Router) {
    this.passwordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.passwordForm.valid) {
      const email = this.passwordForm.value.email;
      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          alert('Se ha enviado un correo electrónico con instrucciones para restablecer su contraseña.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error al solicitar el cambio de contraseña', error);
          alert('Hubo un problema al solicitar el cambio de contraseña.');
        }
      });
    } else {
      alert('Todos los campos son obligatorios.');
    }
  }

  registerUser() {
    this.router.navigate(['/registrar-psicologo']);
  }

  cancelForgetPassword() {
    this.router.navigate(['/login']);
  }

}
