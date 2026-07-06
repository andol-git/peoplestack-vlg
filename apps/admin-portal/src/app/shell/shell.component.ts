import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { AuthFacade } from '@people-stack/auth';

@Component({
  selector: 'ps-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  private auth = inject(AuthFacade);
  collapsed   = signal(false);
  mobileOpen  = signal(false);

  nav = [
    { label:'Dashboard',   route:'/dashboard',   icon:'grid'       },
    { label:'Employees',   route:'/employees',   icon:'users'      },
    { label:'Customers',   route:'/customers',   icon:'briefcase'  },
    { label:'Assignments', route:'/assignments', icon:'link'       },
    { label:'Attendance',  route:'/attendance',  icon:'clock'      },
    { label:'Reports',     route:'/reports',     icon:'bar-chart'  },
    { label:'Settings',    route:'/settings',    icon:'settings'   },
  ];

  logout(): void { this.auth.logout(); }
}
