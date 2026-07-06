import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerApiService } from '@ps/shared/data-access';
import { StaffAssignment } from '@ps/shared/models';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private readonly customerApi = inject(CustomerApiService);

  getAssignments(customerId: number): Observable<StaffAssignment[]> {
    return this.customerApi.getAssignments(customerId);
  }

  assignStaff(customerId: number, employeeId: number): Observable<StaffAssignment> {
    return this.customerApi.assignStaff(customerId, employeeId);
  }

  unassignStaff(customerId: number, employeeId: number): Observable<void> {
    return this.customerApi.unassignStaff(customerId, employeeId);
  }
}
