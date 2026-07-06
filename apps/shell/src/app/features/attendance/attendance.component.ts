import { Component, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

export type AttendanceStatus = "P" | "A" | "L" | "H" | "W";

export interface EmployeeAttendance {
  id: number;
  name: string;
  avatar: string;
  company: string;
  days: Record<number, AttendanceStatus>;
  overtimeHours: string;
}

@Component({
  selector: "app-attendance",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./attendance.component.html",
})
export class AttendanceComponent implements OnInit {
  public selectedYear = signal(new Date().getFullYear());
  public selectedMonth = signal(new Date().getMonth());
  public selectedCompany = signal("All");
  public searched = signal(false);

  public readonly years = [2024, 2025, 2026, 2027];
  public readonly months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  public readonly companies = [
    "All",
    "VLG Services",
    "SecureGuard Pvt Ltd",
    "AirPort Security",
    "Elite Force",
  ];

  public readonly daysInMonth = computed(() =>
    new Date(this.selectedYear(), this.selectedMonth() + 1, 0).getDate(),
  );

  public readonly daysArray = computed(() =>
    Array.from({ length: this.daysInMonth() }, (_, i) => i + 1),
  );

  private readonly allEmployees: EmployeeAttendance[] = [
    {
      id: 1,
      name: "BOLEDDULA SUNDAR",
      avatar: "BS",
      company: "VLG Services",
      days: this.generateDays(),
      overtimeHours: "6h 30m",
    },
    {
      id: 2,
      name: "RAVI KUMAR",
      avatar: "RK",
      company: "VLG Services",
      days: this.generateDays(),
      overtimeHours: "4h 00m",
    },
    {
      id: 3,
      name: "MAHESH YADAV",
      avatar: "MY",
      company: "SecureGuard Pvt Ltd",
      days: this.generateDays(),
      overtimeHours: "2h 00m",
    },
    {
      id: 4,
      name: "SURESH BABU",
      avatar: "SB",
      company: "SecureGuard Pvt Ltd",
      days: this.generateDays(),
      overtimeHours: "—",
    },
    {
      id: 5,
      name: "RAMESH REDDY",
      avatar: "RR",
      company: "AirPort Security",
      days: this.generateDays(),
      overtimeHours: "8h 00m",
    },
    {
      id: 6,
      name: "VENKAT RAO",
      avatar: "VR",
      company: "AirPort Security",
      days: this.generateDays(),
      overtimeHours: "3h 30m",
    },
    {
      id: 7,
      name: "PRASAD NAIDU",
      avatar: "PN",
      company: "Elite Force",
      days: this.generateDays(),
      overtimeHours: "—",
    },
    {
      id: 8,
      name: "KRISHNA MURTHY",
      avatar: "KM",
      company: "Elite Force",
      days: this.generateDays(),
      overtimeHours: "5h 00m",
    },
    {
      id: 9,
      name: "ANAND KUMAR",
      avatar: "AK",
      company: "VLG Services",
      days: this.generateDays(),
      overtimeHours: "1h 30m",
    },
    {
      id: 10,
      name: "SRINIVAS GOUD",
      avatar: "SG",
      company: "VLG Services",
      days: this.generateDays(),
      overtimeHours: "—",
    },
  ];

  public readonly filteredEmployees = computed(() => {
    const co = this.selectedCompany();
    return co === "All"
      ? this.allEmployees
      : this.allEmployees.filter((e) => e.company === co);
  });

  public ngOnInit(): void {
    this.searched.set(true);
  }
  public onSearch(): void {
    this.searched.set(true);
  }

  public isWeekend(day: number): boolean {
    const d = new Date(this.selectedYear(), this.selectedMonth(), day).getDay();
    return d === 0 || d === 6;
  }

  public getStatus(emp: EmployeeAttendance, day: number): AttendanceStatus {
    if (this.isWeekend(day)) return "W";
    return emp.days[day] ?? "P";
  }

  public getStatusClass(status: AttendanceStatus): string {
    switch (status) {
      case "P":
        return "text-green-500";
      case "A":
        return "text-red-500";
      case "L":
        return "text-orange-500";
      case "H":
        return "text-yellow-500";
      case "W":
        return "text-slate-400";
    }
  }

  public getStatusIcon(status: AttendanceStatus): string {
    switch (status) {
      case "P":
        return "fa-circle-check";
      case "A":
        return "fa-circle-xmark";
      case "L":
        return "fa-circle-minus";
      case "H":
        return "fa-star";
      case "W":
        return "fa-circle-minus";
    }
  }

  public countByStatus(
    emp: EmployeeAttendance,
    status: AttendanceStatus,
  ): number {
    let count = 0;
    for (let d = 1; d <= this.daysInMonth(); d++) {
      if (this.getStatus(emp, d) === status) count++;
    }
    return count;
  }

  private generateDays(): Record<number, AttendanceStatus> {
    const statuses: AttendanceStatus[] = [
      "P",
      "P",
      "P",
      "P",
      "P",
      "A",
      "L",
      "H",
      "P",
      "P",
    ];
    const result: Record<number, AttendanceStatus> = {};
    for (let d = 1; d <= 31; d++) {
      result[d] = statuses[Math.floor(Math.random() * statuses.length)];
    }
    return result;
  }
}
