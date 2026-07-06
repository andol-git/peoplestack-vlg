import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeeFacade } from '@people-stack/feature-employee';

@Component({
  selector: 'ps-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  protected empFacade = inject(EmployeeFacade);
  ngOnInit(): void { this.empFacade.loadAll(); }
}
