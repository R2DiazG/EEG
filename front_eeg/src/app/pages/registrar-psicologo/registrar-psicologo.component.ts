import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuarios/usuario.service';

@Component({
  selector: 'app-registrar-psicologo',
  templateUrl: './registrar-psicologo.component.html',
  styleUrls: ['./registrar-psicologo.component.scss']
})
export class RegistrarPsicologoComponent {

  registrationForm: FormGroup;
  showPassword: boolean = false;

  constructor(
    private formBuilder: FormBuilder, 
    private router: Router,
    private usuarioService: UsuarioService // Inyectar el servicio de usuario aquí
  ) {
    // Inicializa el formulario con validaciones, incluyendo la confirmación de contraseña
    this.registrationForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      contraseña: ['', [Validators.required, Validators.minLength(8)]], // Asegúrate de que las contraseñas tengan una longitud mínima, por ejemplo, 8 caracteres
      confirmarContrasena: ['', [Validators.required]], // Agregado nuevo campo de confirmación de contraseña
      email: ['', [Validators.required, Validators.email]],
    }, { validator: this.checkPasswords }); // Aplica validador personalizado al nivel del grupo
  }

  // Validador personalizado para comparar que las contraseñas coincidan
  checkPasswords(group: FormGroup): { [key: string]: any } | null { 
    let pass = group.get('contraseña')!.value; // Aserción no nula
    let confirmPass = group.get('confirmarContrasena')!.value; // Aserción no nula
    return pass === confirmPass ? null : { notSame: true };
}

// Agregada función para alternar la visibilidad de la contraseña
toggleShowPassword() {
  this.showPassword = !this.showPassword;
}

  onSubmit() {
    if (this.registrationForm.valid) {
      console.log('Formulario válido', this.registrationForm.value);
      // Se omite la confirmación de contraseña al enviar el formulario
      const { confirmarContrasena, ...formData } = this.registrationForm.value;
      const email: string = formData.email;
      const username = email.substring(0, email.lastIndexOf('@'));
  
      // Agrega el username y otros campos requeridos al formData antes de enviar
      Object.assign(formData, {
        username: username,
        aprobacion: false,
        id_rol: 2, // Asegúrate de que el rol esté correctamente asignado
        correo: email
      });

      console.log('Enviando formData:', formData);
      this.usuarioService.crearUsuario(formData).subscribe({
        next: (response) => {
          console.log('Usuario registrado con éxito', response);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error al registrar el usuario', error);
          // Manejo de errores...
        }
      });
    } else {
      console.error("El formulario no es válido o las contraseñas no coinciden.");
      // Mostrar un mensaje de error adecuado
    }
  }

  cancel() {
    this.registrationForm.reset();
    this.router.navigate(['/login']);
  }
}