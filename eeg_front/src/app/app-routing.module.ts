import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Import your components here
// import { HomeComponent } from './home.component';
// import { AboutComponent } from './about.component';

const routes: Routes = [
  // Define your routes here
  // { path: '', component: HomeComponent },
  // { path: 'about', component: AboutComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
