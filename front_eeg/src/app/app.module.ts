import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
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
import { GraficasPacienteComponent } from './pages/graficas-paciente/graficas-paciente.component';
import { RegistrarPsicologoComponent } from './pages/registrar-psicologo/registrar-psicologo.component';
import { ReactiveFormsModule } from '@angular/forms';
import { OlvideContraComponent } from './pages/olvide-contra/olvide-contra.component';
import { ListaPsicologosComponent } from './pages/lista-psicologos/lista-psicologos.component';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MedicamentosComponent } from './pages/medicamentos/medicamentos.component';
import { CrearMedicamentoDialogComponent } from './pages/crear-medicamento-dialog/crear-medicamento-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DropMedicamentosDialogComponent } from './pages/drop-medicamentos-dialog/drop-medicamentos-dialog.component';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { UsuarioComponent } from './pages/usuario/usuario.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { AdminRegistraPsicologoComponent } from './pages/admin-registra-psicologo/admin-registra-psicologo.component';
import { HighchartsChartModule } from 'highcharts-angular';

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
    GraficasPacienteComponent,
    RegistrarPsicologoComponent,
    OlvideContraComponent,
    ListaPsicologosComponent,
    MedicamentosComponent,
    CrearMedicamentoDialogComponent,
    DropMedicamentosDialogComponent,
    UsuarioComponent,
    AdminRegistraPsicologoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatPaginatorModule,
    MatTableModule,
    MatSlideToggleModule,
    MatIconModule,
    MatDialogModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
    NgSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    HighchartsChartModule
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
