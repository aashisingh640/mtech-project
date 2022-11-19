import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SharedService } from './../../services/shared.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  errMsg: string = '';
  showToast: boolean = false;

  constructor(private shared: SharedService, private router: Router) {
    this.loginForm = new FormGroup({
      username: new FormControl(null, Validators.required),
      password: new FormControl(null, Validators.required)
    });
  }

  ngOnInit(): void {
  }

  authenticate(event: any) {
    event?.preventDefault();
    const username: string = this.loginForm.controls['username'].value;
    const password: string = this.loginForm.controls['password'].value;
    
    console.log(username, password);

    if (!username || !password) return;

    this.shared.setLoading();

    this.shared.authenticate(username.trim(), password).subscribe({
      next: (v) => {
        console.log(v);
        sessionStorage.setItem('user', JSON.stringify(v.user));
        this.router.navigate(['/dashboard']);
        this.shared.checkUserLoggedIn();
      },
      error: (e) => {
        console.log(e)
        this.shared.removeLoading();
        this.errMsg = e.error.msg;
        this.showToast = true;
      },
      complete: () => {
        console.log('complete');
        this.shared.removeLoading();
      }
    })

  }

}
