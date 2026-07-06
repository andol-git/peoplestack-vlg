import { Component, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

export type AttendanceStatus =
  | "Present"
  | "Late"
  | "Absent"
  | "Half Day"
  | "Early";

export interface TodayAttendanceRecord {
  id: number;
  name: string;
  avatar: string;
  company: string;
  firstIn: string;
  break: string;
  lastOut: string;
  totalHours: string;
  overtime: string;
  status: AttendanceStatus;
  shift: string;
  selected: boolean;
}

@Component({
  selector: "app-today-attendance",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./today-attendance.component.html",
})
export class TodayAttendanceComponent {
  public searchQuery = signal("");
  public selectAll = signal(false);
  public pageSize = signal(10);
  public currentPage = signal(1);
  public selectedCompany = signal("All");

  public readonly pageSizes = [5, 10, 20, 50];
  public readonly companies = [
    "All",
    "VLG Services",
    "SecureGuard Pvt Ltd",
    "AirPort Security",
    "Elite Force",
  ];

  private readonly allRecords: TodayAttendanceRecord[] = [
    {
      id: 1,
      name: "John Doe",
      avatar: "JD",
      company: "VLG Services",
      firstIn: "09:00 AM",
      break: "01:00 PM",
      lastOut: "06:00 PM",
      totalHours: "8h 00m",
      overtime: "2h 00m",
      status: "Present",
      shift: "General",
      selected: false,
    },
    {
      id: 2,
      name: "Sarah Smith",
      avatar: "SS",
      company: "VLG Services",
      firstIn: "09:15 AM",
      break: "01:00 PM",
      lastOut: "06:15 PM",
      totalHours: "8h 00m",
      overtime: "—",
      status: "Late",
      shift: "General",
      selected: false,
    },
    {
      id: 3,
      name: "Robert Johnson",
      avatar: "RJ",
      company: "SecureGuard Pvt Ltd",
      firstIn: "08:30 AM",
      break: "12:30 PM",
      lastOut: "05:30 PM",
      totalHours: "8h 00m",
      overtime: "1h 30m",
      status: "Present",
      shift: "Early",
      selected: false,
    },
    {
      id: 4,
      name: "Maria Garcia",
      avatar: "MG",
      company: "SecureGuard Pvt Ltd",
      firstIn: "10:00 AM",
      break: "02:00 PM",
      lastOut: "07:00 PM",
      totalHours: "8h 00m",
      overtime: "3h 00m",
      status: "Present",
      shift: "Late",
      selected: false,
    },
    {
      id: 5,
      name: "David Miller",
      avatar: "DM",
      company: "AirPort Security",
      firstIn: "09:00 AM",
      break: "01:00 PM",
      lastOut: "02:00 PM",
      totalHours: "4h 00m",
      overtime: "—",
      status: "Half Day",
      shift: "General",
      selected: false,
    },
    {
      id: 6,
      name: "Linda Wilson",
      avatar: "LW",
      company: "AirPort Security",
      firstIn: "-",
      break: "-",
      lastOut: "-",
      totalHours: "0h 00m",
      overtime: "—",
      status: "Absent",
      shift: "General",
      selected: false,
    },
    {
      id: 7,
      name: "James Taylor",
      avatar: "JT",
      company: "Elite Force",
      firstIn: "09:05 AM",
      break: "01:00 PM",
      lastOut: "06:05 PM",
      totalHours: "8h 00m",
      overtime: "2h 30m",
      status: "Present",
      shift: "General",
      selected: false,
    },
    {
      id: 8,
      name: "Patricia Brown",
      avatar: "PB",
      company: "Elite Force",
      firstIn: "09:30 AM",
      break: "01:30 PM",
      lastOut: "06:30 PM",
      totalHours: "8h 00m",
      overtime: "—",
      status: "Late",
      shift: "General",
      selected: false,
    },
    {
      id: 9,
      name: "Michael Davis",
      avatar: "MD",
      company: "VLG Services",
      firstIn: "08:00 AM",
      break: "12:00 PM",
      lastOut: "04:00 PM",
      totalHours: "8h 00m",
      overtime: "1h 00m",
      status: "Present",
      shift: "Early",
      selected: false,
    },
    {
      id: 10,
      name: "Jennifer Lopez",
      avatar: "JL",
      company: "VLG Services",
      firstIn: "10:15 AM",
      break: "02:15 PM",
      lastOut: "07:15 PM",
      totalHours: "8h 00m",
      overtime: "—",
      status: "Late",
      shift: "Late",
      selected: false,
    },
    {
      id: 11,
      name: "BOLEDDULA SUNDAR",
      avatar: "BS",
      company: "VLG Services",
      firstIn: "09:00 AM",
      break: "01:00 PM",
      lastOut: "06:00 PM",
      totalHours: "8h 00m",
      overtime: "2h 00m",
      status: "Present",
      shift: "General",
      selected: false,
    },
    {
      id: 12,
      name: "RAVI KUMAR",
      avatar: "RK",
      company: "VLG Services",
      firstIn: "-",
      break: "-",
      lastOut: "-",
      totalHours: "0h 00m",
      overtime: "—",
      status: "Absent",
      shift: "General",
      selected: false,
    },
  ];

  public records = signal([...this.allRecords]);

  public readonly filtered = computed(() => {
    let data = this.records();
    const q = this.searchQuery().toLowerCase();
    if (q)
      data = data.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.shift.toLowerCase().includes(q),
      );
    const co = this.selectedCompany();
    if (co !== "All") data = data.filter((r) => r.company === co);
    return data;
  });

  public readonly paginated = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  public readonly totalPages = computed(() =>
    Math.ceil(this.filtered().length / this.pageSize()),
  );

  public readonly rangeText = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(
      this.currentPage() * this.pageSize(),
      this.filtered().length,
    );
    return `${start} – ${end} of ${this.filtered().length}`;
  });

  public onSelectAll(val: boolean): void {
    this.selectAll.set(val);
    this.records.update((recs) => recs.map((r) => ({ ...r, selected: val })));
  }

  public onSelectRow(id: number, val: boolean): void {
    this.records.update((recs) =>
      recs.map((r) => (r.id === id ? { ...r, selected: val } : r)),
    );
  }

  public isSelected(id: number): boolean {
    return this.records().find((r) => r.id === id)?.selected ?? false;
  }

  public prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update((p) => p - 1);
  }
  public nextPage(): void {
    if (this.currentPage() < this.totalPages())
      this.currentPage.update((p) => p + 1);
  }
  public onPageSizeChange(val: number): void {
    this.pageSize.set(+val);
    this.currentPage.set(1);
  }

  public getStatusClass(status: AttendanceStatus): string {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-700";
      case "Late":
        return "bg-orange-100 text-orange-600";
      case "Absent":
        return "bg-red-100 text-red-600";
      case "Half Day":
        return "bg-blue-100 text-blue-600";
      case "Early":
        return "bg-purple-100 text-purple-600";
    }
  }

  public getAvatarClass(status: AttendanceStatus): string {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-700";
      case "Late":
        return "bg-orange-100 text-orange-600";
      case "Absent":
        return "bg-red-100 text-red-600";
      case "Half Day":
        return "bg-blue-100 text-blue-600";
      case "Early":
        return "bg-purple-100 text-purple-600";
    }
  }

  public today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
