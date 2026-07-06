import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthFacade } from '@ps/shared/data-access';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  private readonly auth = inject(AuthFacade);

  ngOnInit(): void {
    // Restore session timer on page refresh
    this.auth.resumeSession();
  }
}
