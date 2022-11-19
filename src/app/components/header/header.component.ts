import { Component, OnInit } from '@angular/core';
import { SharedService } from './../../services/shared.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  user: object = {};

  links: Array<any> = [];

  constructor(private shared: SharedService, private router: Router) { }

  ngOnInit(): void {
    this.user = this.shared.checkUserLoggedIn();
    this.links = [{
      title: 'Dashboard',
      selected: true,
      route: 'dashboard'
    }, {
      title: 'My Invoices',
      selected: false,
      route: 'invoice'
    }, {
      title: 'Upload Invoice',
      selected: false,
      route: 'upload'
    }]
  }

  loadLink(link: any) {
    console.log(link);
    this.links.forEach(link => link.selected = false);
    link.selected = true;
    this.router.navigate([link.route]);
  }

  logout() {
    this.shared.logout();
    this.router.navigate(['login']);
  }

}




