import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { RegistrarPacienteComponent } from './pages/registrar-paciente/registrar-paciente.component';
import { EditarPacienteComponent } from './pages/editar-paciente/editar-paciente.component';
import { ListaPacientesComponent } from './pages/lista-pacientes/lista-pacientes.component';
import { EegSubirDocsComponent } from './pages/eeg-subir-docs/eeg-subir-docs.component';
import { ConfirmDialogComponent } from './pages/confirm-dialog/confirm-dialog.component';
import { MenuLateralComponent } from './pages/menu-lateral/menu-lateral.component';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { InfoPacienteComponent } from './pages/info-paciente/info-paciente.component';
import { VerPacienteComponent } from './pages/ver-paciente/ver-paciente.component';
import { GraficasPacienteComponent } from './pages/graficas-paciente/graficas-paciente.component';
import { RegistrarPsicologoComponent } from './pages/registrar-psicologo/registrar-psicologo.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AprobarPsicologosComponent } from './pages/aprobar-psicologos/aprobar-psicologos.component';
import { OlvideContraComponent } from './pages/olvide-contra/olvide-contra.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegistrarPacienteComponent,
    EditarPacienteComponent,
    ListaPacientesComponent,
    EegSubirDocsComponent,
    ConfirmDialogComponent,
    MenuLateralComponent,
    InfoPacienteComponent,
    VerPacienteComponent,
    GraficasPacienteComponent,
    RegistrarPsicologoComponent,
    AprobarPsicologosComponent,
    OlvideContraComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
