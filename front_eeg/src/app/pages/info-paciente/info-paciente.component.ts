import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { InfoPaciente } from '../../models/info-paciente.model';
import { AuthService } from '../../services/login/auth.service';
import { Observable } from 'rxjs';
import { EegService } from '../../services/sesiones/eeg.service';
import { id } from 'date-fns/locale';

@Component({
  selector: 'app-info-paciente',
  templateUrl: './info-paciente.component.html',
  styleUrls: ['./info-paciente.component.scss']
})
export class InfoPacienteComponent implements OnInit {
  paciente: InfoPaciente | null = null;
  
  id_usuario: number | null = null;
  @Input() id_sesion!: number; 
  @Input() id_paciente!: number;

  constructor(
    private pacienteService: PacienteService,
    private authService: AuthService,
    private router: Router,
    private EegService: EegService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log(`ID de la sesion recibido: ${this.id_sesion}`);
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
    const id_sesion = this.route.snapshot.paramMap.get('id_sesion');
    console.log(this.route.params)
    if(this.id_paciente){
      this.pacienteService.obtenerDetallesPaciente(this.id_paciente).subscribe({
        next: (data) => {
          console.log('Detalles del paciente:', data);
          this.paciente = data;
        },
  
        error: (error) => {
          console.error('Error al obtener los detalles del paciente', error);
        }
      });
    } else if(id_sesion) {
      this.obtenerPacienteEnBaseASesion(+id_sesion).subscribe({
        next: (id_paciente) => {
          console.log('Id del paciente:', id_paciente);
          this.pacienteService.obtenerDetallesPaciente(id_paciente).subscribe({
            next: (data) => {
              console.log('Detalles del paciente:', data);
              this.paciente = data;
            },
    
            error: (error) => {
              console.error('Error al obtener los detalles del paciente', error);
            }
          });
        },
        error: (error) => {
          console.error('Error al obtener los detalles del paciente', error);
        }
      });
      
    } else {
      console.error('ID de paciente no encontrado en la ruta');
    }
  }

  obtenerPacienteEnBaseASesion(idSesion: number): Observable<any> {
    return this.EegService.obtener_paciente_en_base_a_sesion(idSesion);
  }
}
