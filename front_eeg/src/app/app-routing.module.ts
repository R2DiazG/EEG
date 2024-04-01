import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistrarPacienteComponent } from './pages/registrar-paciente/registrar-paciente.component';
import { EditarPacienteComponent } from './pages/editar-paciente/editar-paciente.component';
import { ListaPacientesComponent } from './pages/lista-pacientes/lista-pacientes.component';
import { EegSubirDocsComponent } from './pages/eeg-subir-docs/eeg-subir-docs.component';
import { ConfirmDialogComponent } from './pages/confirm-dialog/confirm-dialog.component';
import { MenuLateralComponent } from './pages/menu-lateral/menu-lateral.component';
import { InfoPacienteComponent } from './pages/info-paciente/info-paciente.component';
import { GraficasPacienteComponent } from './pages/graficas-paciente/graficas-paciente.component';
import { RegistrarPsicologoComponent } from './pages/registrar-psicologo/registrar-psicologo.component';
import { OlvideContraComponent } from './pages/olvide-contra/olvide-contra.component';
import { ListaPsicologosComponent } from './pages/lista-psicologos/lista-psicologos.component';
import { RoleGuard } from './services/guard/guards/role.guard';
import { MedicamentosComponent } from './pages/medicamentos/medicamentos.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registrar-paciente', component: RegistrarPacienteComponent },
  { path: 'editar-paciente/:id_paciente', component: EditarPacienteComponent },
  { path: 'lista-pacientes', component: ListaPacientesComponent },
  { path: 'eeg-subir-docs', component: EegSubirDocsComponent },
  { path: 'confirm-dialog', component: ConfirmDialogComponent },
  { path: 'menu-lateral', component: MenuLateralComponent },
  { path: 'info-paciente/:id_paciente', component: InfoPacienteComponent },
  { path: 'graficas-paciente/:id_sesion', component: GraficasPacienteComponent },
  { path: 'registrar-psicologo', component: RegistrarPsicologoComponent },
  { path: 'olvide-contra', component: OlvideContraComponent },
  { path: 'medicamentos', component: MedicamentosComponent },
  { path: '**', redirectTo: '/login' },
  { path: 'lista-psicologos', component: ListaPsicologosComponent},
  //, canActivate: [RoleGuard], data: { expectedRole: 1 } 
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
