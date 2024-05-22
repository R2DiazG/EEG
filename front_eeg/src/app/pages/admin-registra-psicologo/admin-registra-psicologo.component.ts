import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuarios/usuario.service';

@Component({
  selector: 'app-admin-registra-psicologo',
  templateUrl: './admin-registra-psicologo.component.html',
  styleUrl: './admin-registra-psicologo.component.scss'
})
export class AdminRegistraPsicologoComponent {
  registrationForm: FormGroup;
  showPassword: boolean = false;

  constructor(
    private formBuilder: FormBuilder, 
    private router: Router,
    private usuarioService: UsuarioService
  ) {
    this.registrationForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      contraseña: ['', [Validators.required, Validators.minLength(8)]],
      confirmarContrasena: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    }, { validator: this.checkPasswords });
  }

  checkPasswords(group: FormGroup): { [key: string]: any } | null { 
    let pass = group.get('contraseña')!.value;
    let confirmPass = group.get('confirmarContrasena')!.value;
    return pass === confirmPass ? null : { notSame: true };
}

toggleShowPassword() {
  this.showPassword = !this.showPassword;
}

  onSubmit() {
    if (this.registrationForm.valid) {
      console.log('Formulario válido', this.registrationForm.value);
      const { confirmarContrasena, ...formData } = this.registrationForm.value;
      const email: string = formData.email;
      const username = email.substring(0, email.lastIndexOf('@'));
  
      Object.assign(formData, {
        username: username,
        aprobacion: false,
        id_rol: 2,
        correo: email
      });

      console.log('Enviando formData:', formData);
      this.usuarioService.crearUsuario(formData).subscribe({
        next: (response) => {
          console.log('Usuario registrado con éxito', response);
          this.router.navigate(['/lista-psicologos']);
        },
        error: (error) => {
          console.error('Error al registrar el usuario', error);
        }
      });
    } else {
      console.error("El formulario no es válido o las contraseñas no coinciden.");
    }
  }

  cancelButton() {
    this.registrationForm.reset();
    this.router.navigate(['/lista-psicologos']);
  }
}