import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AgGridModule } from 'ag-grid-angular';
import { NgxChartsModule }from '@swimlane/ngx-charts';
import { NglModule } from 'ng-lightning';
import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from './app.component';
import { TableComponent } from './components/table/table.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HeaderComponent } from './components/header/header.component';
import { UploadComponent } from './components/upload/upload.component';
import { InvoiceComponent } from './components/invoice/invoice.component';
import { InvoiceNameComponent } from './components/invoice/invoice.component';
import { InterceptorService } from './services/interceptor.service';
import { ChartComponent } from './components/chart/chart.component';
import { EditComponent } from './components/edit/edit.component';

@NgModule({
  declarations: [
    AppComponent,
    TableComponent,
    LoginComponent,
    DashboardComponent,
    HeaderComponent,
    UploadComponent,
    InvoiceComponent,
    InvoiceNameComponent,
    ChartComponent,
    EditComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NglModule,
    NgxChartsModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({ maxOpened:1 }),
    AgGridModule.withComponents([
      InvoiceNameComponent
    ]),
    RouterModule.forRoot([
      { path: 'login', component: LoginComponent, data: { preload: true } },
      { path: 'dashboard', component: DashboardComponent, data: { preload: true } },
      { path: 'upload', component: UploadComponent },
      { path: 'invoice', component: InvoiceComponent },
      { path: 'invoice/edit', component: EditComponent },
    ], {
      relativeLinkResolution: 'legacy'
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }
