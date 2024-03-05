import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { NgModule } from '@angular/core';
// Importa otros módulos de Angular Material aquí según sea necesario

@NgModule({
  declarations: [
    // tus componentes
  ],
  imports: [
    // otros módulos
    BrowserAnimationsModule,
    MatSidenavModule,
    MatListModule,
    // otros módulos de Angular Material que estés utilizando
  ],
  // ...
})
export class AppModule { }
