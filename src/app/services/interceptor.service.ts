import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {

  constructor(private shared: SharedService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const newRequest = request.clone({
      setHeaders: {
        'x-access-token': this.shared.getToken(),
        'x-instance-url': this.shared.getInstanceURL()
      }
    });

    return next.handle(newRequest);

  }
}
