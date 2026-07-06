import { Injectable, signal, computed } from '@angular/core';
import { Employee } from '@ps/shared-ui';

interface State { employees:Employee[]; inactive:Employee[]; selected:Employee|null; loading:boolean; saving:boolean; error:string|null; }

@Injectable({ providedIn: 'root' })
export class EmployeeStore {
  private _s = signal<State>({ employees:[], inactive:[], selected:null, loading:false, saving:false, error:null });
  private patch(p: Partial<State>): void { this._s.update(s => ({...s,...p})); }
  readonly employees    = computed(() => this._s().employees);
  readonly inactive     = computed(() => this._s().inactive);
  readonly selected     = computed(() => this._s().selected);
  readonly loading      = computed(() => this._s().loading);
  readonly saving       = computed(() => this._s().saving);
  readonly error        = computed(() => this._s().error);
  readonly totalActive  = computed(() => this._s().employees.length);
  readonly totalInactive= computed(() => this._s().inactive.length);
  setEmployees(l:Employee[]): void { this.patch({employees:l,loading:false}); }
  setInactive(l:Employee[]): void  { this.patch({inactive:l}); }
  setSelected(e:Employee|null): void { this.patch({selected:e}); }
  setLoading(v:boolean): void  { this.patch({loading:v}); }
  setSaving(v:boolean):  void  { this.patch({saving:v}); }
  setError(m:string|null): void{ this.patch({error:m}); }
  upsert(emp:Employee): void {
    this._s.update(s => {
      const idx = s.employees.findIndex(e=>e.id===emp.id);
      const list = idx>=0 ? s.employees.map((e,i)=>i===idx?emp:e) : [...s.employees,emp];
      return {...s, employees:list, saving:false};
    });
  }
  remove(id:number): void { this._s.update(s=>({...s,employees:s.employees.filter(e=>e.id!==id)})); }
}
