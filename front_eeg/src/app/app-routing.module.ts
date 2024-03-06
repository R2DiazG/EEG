import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistrarPacienteComponent } from './pages/registrar-paciente/registrar-paciente.component';
import { EditarPacienteComponent } from './pages/editar-paciente/editar-paciente.component';
import { ListaPacientesComponent } from './pages/lista-pacientes/lista-pacientes.component';
import { EegSubirDocsComponent } from './pages/eeg-subir-docs/eeg-subir-docs.component';
import { ConfirmDialogComponent } from './pages/confirm-dialog/confirm-dialog.component';
import { MenuLateralComponent } from './pages/menu-lateral/menu-lateral.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registrar-paciente', component: RegistrarPacienteComponent },
  { path: 'editar-paciente', component: EditarPacienteComponent },
  { path: 'lista-pacientes', component: ListaPacientesComponent },
  { path: 'eeg-subir-docs', component: EegSubirDocsComponent },
  { path: 'confirm-dialog', component: ConfirmDialogComponent },
  { path: 'menu-lateral', component: MenuLateralComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
