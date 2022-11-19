import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit {

  record: any = null;
  columns: Array<any> = [];
  formColumns: Array<any> = [];
  lineColumns: Array<any> = [];
  lineRows: Array<any> = [];
  userActions: Array<any> = [];
  attachments: Array<any> = [];
  comments: Array<any> = [];
  updatedData: any = {};

  showToast: boolean = false;
  toastMsg: string = '';
  toastVariant: string = '';

  menuList: Array<any> = [{
    label: 'Invoice Details',
    value: 'details',
    selected: true
  }, {
    label: 'Line Items',
    value: 'line',
    selected: false
  }, {
    label: 'Attachments',
    value: 'attachment',
    selected: false
  }]

  selectedMenu: string = 'details';

  readonly MIMETYPES: any = {
    PDF: 'application/pdf',
    PNG: 'image/png',
    JPG: 'image/jpeg',
    JPEG: 'image/jpeg',
    TXT: 'text/plain',
    TIFF: 'image/tiff',
    TIF: 'image/tif',
    BMP: 'image/bmp'
  }

  columnsToRemove: Array<any> = ['Id', 'IsDeleted', 'SystemModstamp', 'LastReferencedDate', 'User_Action__c', 'Comment_History__c'];
  editableColumns: Array<any> = ['Invoice_Date__c', 'Amount__c', 'Total_Tax__c', 'Discount__c', 'Total_Amount__c', 'Shipping__c', 'Comments__c'];

  constructor(private router: Router, private shared: SharedService) {
    if (typeof this.router.getCurrentNavigation()) {
      console.log(this.router.getCurrentNavigation()?.extras.state);

      this.record = this.router.getCurrentNavigation()?.extras.state?.record;
      this.columns = this.router.getCurrentNavigation()?.extras.state?.columns;

      this.columns.forEach(col => {
        col.readonly = !this.editableColumns.includes(col.name);
        col.required = col.name === 'Comments__c';
      });

      this.formColumns = this.columns.filter(column => !this.columnsToRemove.includes(column.name));

      console.log(this.columns.map(col => col.name));

    }
  }

  ngOnInit(): void {
    this.getRelatedData();
    this.getUserActions();
    this.formatComments();
  }

  getRelatedData() {
    this.shared.getRelatedData(this.record.Id).subscribe({
      next: (v) => {
        console.log(v);

        if (v.error) {
          this.shared.removeLoading();
          return;
        }

        this.lineColumns = this.shared.formatColumns(v.fields);
        this.lineRows = this.shared.formatRows(v.records, v.fields);
        this.attachments = v.attachments;

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

  getUserActions() {
    const userActionField: any = this.columns.find(column => column.name === 'User_Action__c');
    const currentStateField: any = this.columns.find(column => column.name === 'Current_State__c');
    const currentState: string = this.record['Current_State__c'];
    const index = currentStateField.picklistValues.findIndex((field: any) => field.value === currentState);

    userActionField.picklistValues.forEach((option: any) => {
      option.isVisible = this.decodePickListValidFor(index, option.validFor);
      if (option.isVisible) {
        this.userActions.push(option);
      }
    })

  }

  formatComments() {
    const comments = this.record['Comment_History__c'];
    if (!comments) return;
    this.comments = JSON.parse(comments);
  }

  decodePickListValidFor(index: number, validFor: string) {
    const decoded = atob(validFor);
    const bits = decoded.charCodeAt(index >> 3);
    return ((bits & (0x80 >> (index % 8))) != 0);
  }

  selectMenu(item: any) {
    console.log(item);
    this.menuList.forEach(menu => menu.selected = false);
    item.selected = true;
    this.selectedMenu = item.value;
  }

  downloadFileFromBlob(fileName: string, fileData: ArrayBuffer) {

    try {
      const objectUrl = URL.createObjectURL(new Blob([fileData], { type: 'oclet/stream' }));

      let elm = document.createElement('a');
      document.body.appendChild(elm);
      elm.style.display = 'none';
      elm.download = fileName;
      elm.href = objectUrl;
      elm.click();
      window.URL.revokeObjectURL(objectUrl);
      elm.remove();

      this.shared.removeLoading();
      
    } catch (error) {
      console.log(error);
      this.shared.removeLoading();
    }

  }

  viewFileFromBlob(fileData: any, fileType: string) {

    try {

      const getFileTypeMimeRef = this.MIMETYPES[fileType];

      const objectUrl = URL.createObjectURL(new Blob([fileData], { type: getFileTypeMimeRef }));
      let elm = document.createElement('a');
      document.body.appendChild(elm);
      elm.style.display = 'none';
      elm.target = '_blank';
      elm.href = objectUrl;
      elm.click();
      elm.remove();
      this.shared.removeLoading();

    } catch (error) {
      console.log(error);
      this.shared.removeLoading();
    }

  }

  downloadAttachment(attachment: any, download: boolean) {
    console.log(attachment);
    this.shared.setLoading();

    this.shared.getFileData(attachment.Id, attachment.Title).subscribe({
      next: (v) => {
        download ? this.downloadFileFromBlob(attachment.Title, v) : this.viewFileFromBlob(v, attachment.FileType);
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

  onChange(event: any, column: string) {
    this.updatedData[column] = event.target.value;
  }

  takeUserAction(option: any) {
    this.updatedData['User_Action__c'] = option.value;
    this.save();
  }

  formatNumber(value: any) {
    return Number(typeof value === 'string' ? value.replace(/,/g, '') : value);
  }

  save() {

    Object.keys(this.updatedData).forEach((key: string) => {
      const field = this.columns.find(col => col.name === key);
      if (field && (field.type === 'double' || field.type === 'percent')) {
        this.updatedData[key] = this.formatNumber(this.updatedData[key]);
      }
    })

    this.updatedData.Comment_History__c = this.record.Comment_History__c;
    this.updatedData.userId = this.shared.getUserId();
    this.updatedData.Id = this.record.Id;

    const lineItemAmount = this.lineRows.reduce((amount: number, line: any) => amount + this.formatNumber(line.Amount__c) , 0);
    const amount = this.updatedData.hasOwnProperty('Amount__c') ? this.formatNumber(this.updatedData.Amount__c) : this.formatNumber(this.record.Amount__c);

    if (this.updatedData.User_Action__c === 'Validate' && lineItemAmount !== amount) {
      this.showToast = true;
      this.toastMsg = 'Validation Failed! Invoice amount must be equal to the sum of the amount of all the invoice line items.';
      this.toastVariant = 'error';
      return;
    }

    this.shared.setLoading();

    this.shared.saveInvoice(this.updatedData).subscribe({
      next: (v) => {
        console.log(v);
        this.showToast = true;
        this.toastMsg = 'Invoice saved successfully!';
        this.toastVariant = 'success';
        setTimeout(() => {
          this.cancel();
        }, 1000)
      },
      error: (e) => {
        console.log(e)
        this.shared.removeLoading();
        this.showToast = true;
        this.toastMsg = e.error.msg || e.error.error.name;
        this.toastVariant = 'error';
      },
      complete: () => {
        console.log('complete');
        this.shared.removeLoading();
      }
    })

  }
  
  cancel() {
    this.router.navigate(['invoice']);
  }

}
