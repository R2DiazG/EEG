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

  constructor(
    private formBuilder: FormBuilder, 
    private router: Router,
    private usuarioService: UsuarioService // Inyectar el servicio de usuario aquí
  ) {
    // Inicializa el formulario con validaciones
    this.registrationForm = this.formBuilder.group({
      nombre: ['', [Validators.required]], // Cambiado de 'name' a 'nombre'
      apellidos: ['', [Validators.required]], // Cambiado de 'last-name' a 'apellidos'
      password: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.registrationForm.valid) {
      console.log('Formulario válido', this.registrationForm.value);
      const email: string = this.registrationForm.get('email')?.value;
      const username = email.substring(0, email.lastIndexOf('@'));
  
      // Configura la aprobación como false y actualiza el username y id_rol
      const formData = {
        ...this.registrationForm.value,
        username: username,
        aprobacion: false, // Se configura la aprobación como false
        id_rol: 2 // Asumiendo que '2' es el id_rol que deseas asignar
      };
  
      console.log('Enviando formData:', formData);
      this.usuarioService.crearUsuario(formData).subscribe({
        next: (response) => {
          console.log('Usuario registrado con éxito', response);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error al registrar el usuario', error);
        }
      });
    } else {
      alert("Todos los campos son obligatorios y deben ser válidos.");
    }
  }
  
  cancel() {
    this.registrationForm.reset();
    this.router.navigate(['/login']);
  }
}
