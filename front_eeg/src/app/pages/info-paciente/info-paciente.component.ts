import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Importa Router y ActivatedRoute juntos
import { PacienteService } from '../../services/pacientes/paciente.service';
import { InfoPaciente } from '../../models/info-paciente.model';
import { AuthService } from '../../services/login/auth.service';

@Component({
  selector: 'app-info-paciente',
  templateUrl: './info-paciente.component.html',
  styleUrls: ['./info-paciente.component.scss']
})
export class InfoPacienteComponent implements OnInit {
  paciente: InfoPaciente | null = null;
  id_usuario: number | null = null;

  constructor(
    private pacienteService: PacienteService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id_usuario) {
          this.id_usuario = user.id_usuario;
          console.log('Usuario', user.id_usuario);
          console.log('ID de usuario actual:', this.id_usuario);
          this.cargarDetallesPaciente();
        } else {
          console.error('Usuario no identificado');
          this.router.navigate(['/login']);
        }
      },
      error: (err) => console.error('Error al obtener el usuario actual', err)
    });
  }

  cargarDetallesPaciente(): void {
    // Asumiendo que el ID del paciente se obtiene de la ruta, directamente aquí.
    const id_paciente = this.route.snapshot.paramMap.get('id_paciente');
    if (id_paciente) {
      this.pacienteService.obtenerDetallesPaciente(+id_paciente).subscribe({
        next: (data) => {
          this.paciente = data;
        },
        error: (error) => {
          console.error('Error al obtener los detalles del paciente', error);
        }
      });
    } else {
      console.error('ID de paciente no encontrado en la ruta');
    }
  }
}
