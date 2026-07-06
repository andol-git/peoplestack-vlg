import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { EmployeeService } from '../employee-service/employee.service';
import { EmployeeStore } from '../employee-store/employee.store';
import { Employee } from '@ps/shared-ui';

@Injectable({ providedIn: 'root' })
export class EmployeeFacade {
  private svc   = inject(EmployeeService);
  private store = inject(EmployeeStore);
  private router= inject(Router);

  readonly employees    = this.store.employees;
  readonly loading      = this.store.loading;
  readonly saving       = this.store.saving;
  readonly error        = this.store.error;
  readonly selectedEmployee = this.store.selected;
  readonly totalActive  = this.store.totalActive;
  readonly totalInactive= this.store.totalInactive;

  loadAll(): void {
    this.store.setLoading(true);
    this.svc.getAll().subscribe({ next: l=>this.store.setEmployees(l), error:()=>this.store.setLoading(false) });
  }
  loadById(id:number): void {
    this.store.setLoading(true);
    this.svc.getById(id).subscribe({ next:e=>{this.store.setSelected(e);this.store.setLoading(false);}, error:()=>this.store.setLoading(false) });
  }
  create(emp:Employee): void {
    this.store.setSaving(true);
    this.svc.create(emp).pipe(finalize(()=>this.store.setSaving(false))).subscribe({
      next:s=>{this.store.upsert(s); this.router.navigate(['/employees']);},
      error:err=>this.store.setError(err.status===409?'Duplicate entry.':'Save failed.')
    });
  }
  update(id:number,emp:Employee): void {
    this.store.setSaving(true);
    this.svc.update(id,emp).pipe(finalize(()=>this.store.setSaving(false))).subscribe({
      next:u=>{this.store.upsert(u); this.router.navigate(['/employees']);},
      error:err=>this.store.setError(err.status===409?'Duplicate entry.':'Update failed.')
    });
  }
  inactivate(id:number): void { this.svc.inactivate(id).subscribe(()=>{this.store.remove(id); this.loadAll();}); }
  delete(id:number):     void { this.svc.delete(id).subscribe(()=>this.store.remove(id)); }
  clearSelected(): void { this.store.setSelected(null); }
}
