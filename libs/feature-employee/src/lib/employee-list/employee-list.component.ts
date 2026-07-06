import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeFacade } from '../employee-facade/employee.facade';

@Component({
  selector: 'ps-employee-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  protected facade = inject(EmployeeFacade);
  search = ''; site = '';

  filtered = computed(() => {
    let l = this.facade.employees();
    if (this.search) { const q=this.search.toLowerCase(); l=l.filter(e=>e.personalDetails?.name?.toLowerCase().includes(q)||e.idNo?.toLowerCase().includes(q)||e.phoneNo?.includes(q)); }
    if (this.site)   { l=l.filter(e=>e.assignmentDetails?.site===this.site); }
    return l;
  });

  ngOnInit(): void { this.facade.loadAll(); }
  onDeactivate(id:number): void { if(confirm('Deactivate this employee?')) this.facade.inactivate(id); }
  onDelete(id:number):     void { if(confirm('Permanently delete?')) this.facade.delete(id); }
}
