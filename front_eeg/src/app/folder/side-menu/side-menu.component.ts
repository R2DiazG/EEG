import { Component, NgModule } from '@angular/core';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent {
sidebarOpen: any;

}

import { MatSidenavModule } from '@angular/material/sidenav';

@NgModule({
    imports: [
        MatSidenavModule
    ]
})
export class SideMenuModule { }