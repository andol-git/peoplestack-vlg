import { Injectable, signal, computed } from '@angular/core';
import { AttendanceLog } from '@people-stack/shared-ui';
@Injectable({ providedIn: 'root' })
export class AttendanceStore {
  private _logs    = signal<AttendanceLog[]>([]);
  private _today   = signal<AttendanceLog[]>([]);
  private _loading = signal(false);
  private _present = signal(0);
  private _absent  = signal(0);
  private _total   = signal(0);
  readonly logs    = this._logs.asReadonly();
  readonly today   = this._today.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly present = this._present.asReadonly();
  readonly absent  = this._absent.asReadonly();
  readonly total   = this._total.asReadonly();
  setLogs(l:AttendanceLog[]): void { this._logs.set(l); this._loading.set(false); }
  setToday(l:AttendanceLog[]): void { this._today.set(l); }
  setSummary(s:{present:number;absent:number;total:number}): void { this._present.set(s.present); this._absent.set(s.absent); this._total.set(s.total); }
  setLoading(v:boolean): void { this._loading.set(v); }
}
