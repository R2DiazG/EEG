import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registrar-psicologo',
  templateUrl: './registrar-psicologo.component.html',
  styleUrls: ['./registrar-psicologo.component.scss']
})
export class RegistrarPsicologoComponent {

  registrationForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private router: Router) {
    // Inicializa el formulario con validaciones
    this.registrationForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      password: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    // Aquí manejas la lógica de envío del formulario
    if (this.registrationForm.valid) {
      // Si el formulario es válido, puedes enviar los datos
      console.log('Formulario enviado', this.registrationForm.value);
    } else {
      // Si el formulario no es válido, puedes mostrar un mensaje
      alert("Todos los campos son obligatorios y deben ser válidos.");
    }
  }

  cancel() {
    this.registrationForm.reset();
    this.router.navigate(['/login']);
  }
}
