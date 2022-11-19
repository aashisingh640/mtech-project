import { Component } from '@angular/core';
import { SharedService } from './services/shared.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  loggedIn: boolean = false;

  constructor(private shared: SharedService, private router: Router) {
  }

  ngOnInit() {
    this.shared.isLoggedIn.subscribe(data => {
      this.loggedIn = data;
    })

    this.shared.checkUserLoggedIn();
    this.loggedIn ? this.router.navigate(['dashboard']) : this.router.navigate(['login']);
  }

  ngOnDestroy() {
    this.shared.isLoggedIn && this.shared.isLoggedIn.unsubscribe();
  }

}
