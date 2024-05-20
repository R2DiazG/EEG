import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/login/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-restablecer-contra',
  templateUrl: './restablecer-contra.component.html',
  styleUrls: ['./restablecer-contra.component.scss']
})
export class RestablecerContraComponent {

  passwordForm: FormGroup;
  showPassword: boolean = false;
  token: string;

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private route: ActivatedRoute
  ) {
    this.passwordForm = new FormGroup({
      contraseña: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmarContrasena: new FormControl('', [Validators.required]),
    }, { validators: this.checkPasswords });

    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  checkPasswords(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('contraseña')!.value;
    const confirmPass = group.get('confirmarContrasena')!.value;
    return pass === confirmPass ? null : { notSame: true };
  }

  ngOnInit() {}

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.passwordForm.valid) {
      const nuevaContrasena = this.passwordForm.get('contraseña')!.value;
      this.authService.resetPassword(this.token, nuevaContrasena).subscribe({
        next: (response) => {
          alert('Contraseña actualizada exitosamente.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Error al actualizar la contraseña:', err);
          alert('Ocurrió un error al actualizar la contraseña. Inténtelo de nuevo.');
        }
      });
    } else {
      alert('Por favor, asegúrese de que las contraseñas coincidan y cumplan con los requisitos.');
    }
  }

  registerUser() {
    this.router.navigate(['/registrar-psicologo']);
  }

  cancelForgetPassword() {
    this.router.navigate(['/login']);
  }
}
