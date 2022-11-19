import { Component, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {

  constructor(private shared: SharedService, private router: Router) { }

  columns: Array<any> = [];
  rows: Array<any> = [];

  originalData: { columns: Array<any>, rows: Array<any> } = {
    columns: [],
    rows: []
  }

  ngOnInit(): void {
    this.getAllInvoices();
  }

  getAllInvoices() {
    this.shared.setLoading();
    const userId = this.shared.getUserId();
    this.shared.getInvoices(userId).subscribe({
      next: (v) => {
        console.log(v);

        if (v.error) {
          this.shared.removeLoading();
          return;
        }

        this.originalData = {
          columns: [...v.fields],
          rows: [...v.records]
        }

        this.columns = this.shared.formatColumns(v.fields);
        this.rows = this.shared.formatRows(v.records, v.fields);

      },
      error: (e) => {
        console.log(e)
        this.shared.removeLoading();
      },
      complete: () => {
        console.log('complete');
        this.shared.removeLoading();
      }
    })
  }

  editInvoice(id: string) {
    const record = this.originalData.rows.find(row => row.Id === id);
    this.router.navigate(['invoice', 'edit'], { state: { record, columns: this.originalData.columns } });
  }

}

@Component({
  selector: 'invoice-name',
  template: `<button type="button" class="btn m-0 p-0 inv-name-link" (click)="loadInvoice(params.data)">{{ params.data[params.colDef.field] }}</button>`
})
export class InvoiceNameComponent implements ICellRendererAngularComp {

  public params: any;
  constructor(public shared: SharedService) { }

  refresh(params: any): boolean {
    throw new Error("Method not implemented.");
  }

  agInit(params: import("ag-grid-community").ICellRendererParams): void {
    this.params = params;
  }

  afterGuiAttached?(params?: import("ag-grid-community").IAfterGuiAttachedParams): void {
    throw new Error("Method not implemented.");
  }

  loadInvoice(data: any) {
    this.params.context.componentParent.loadInvoice(data.Id);
  }

}
