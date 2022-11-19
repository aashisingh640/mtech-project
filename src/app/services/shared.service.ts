import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { BehaviorSubject } from "rxjs";
import * as moment from 'moment-timezone';

@Injectable({
    providedIn: 'root'
})
export class SharedService {
    constructor(private http: HttpClient) { }

    public isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    
    fieldsNotIncluded: Array<string> = ['CreatedById', 'Id', 'IsDeleted', 'LastModifiedById', 'LastModifiedDate', 'LastReferencedDate', 'LastViewedDate', 'OwnerId', 'SystemModstamp', 'User_Action__c', 'Comment_History__c', 'Comments__c'];

    public setLoading() {
        document.getElementsByClassName('content')[0].classList.add('loading');
        document.body.classList.add('overflow-hidden');
    }

    public removeLoading() {
        const content: HTMLCollectionOf<Element> = document.getElementsByClassName('content');
        if (content && content.length > 0) {
            content[0].classList.remove('loading');
        }
        document.body.classList.remove('overflow-hidden');
    }

    public formatRows(records: Array<any>, fields: Array<any>) {
        return records.map((record: any) => {
            fields.forEach((field: any) => {
              if (record[field.name]) {
                if (field.type === 'reference') {
                  record[field.name] = record[field.relationshipName].Name;
                }
                if (field.type === 'date') {
                  record[field.name] = moment(record[field.name]).format("l");
                }
                if (field.type === 'datetime') {
                  record[field.name] = moment(record[field.name]).format("l, LT");
                }
                if (field.type === 'double') {
                  record[field.name] = new Intl.NumberFormat('en-In').format(record[field.name]);
                }
              }
            });
            return record;
        });
    }

    public formatColumns(columns: Array<any>) {
        return columns.filter((field: any) => !this.fieldsNotIncluded.includes(field.name))
          .map((field: any) => {
            if (field.name === 'Name') {
              return { headerName: field.label, field: field.name, cellRenderer: 'invoiceName', pinned: 'left' }
            } else {
              return { headerName: field.label, field: field.name }
            }
          });
    }

    getUserDetails() {
        const user = sessionStorage.getItem('user');
        return user ? JSON.parse(user) : '';
    }

    checkUserLoggedIn() {
        const user = this.getUserDetails();
        if (user) {
            this.isLoggedIn.next(true);
            return user;
        } else {
            this.isLoggedIn.next(false);
            return false;
        }
    }

    getToken() {
        const user = this.getUserDetails();
        return user?.accessToken || '';
    }

    getInstanceURL() {
        const user = this.getUserDetails();
        return user?.instanceUrl || '';
    }
    
    getUserId() {
        const user = this.getUserDetails();
        return user?.Id || '';
    }

    logout() {
        sessionStorage.removeItem('user');
        this.checkUserLoggedIn();
    }

    authenticate(username: string, password: string): Observable<any> {
        return this.http.post('api/authenticate', { username, password });
    }

    uploadPDF(file: any): Observable<any> {
        return this.http.post('api/upload', file);
    }

    uploadZip(file: any): Observable<any> {
        return this.http.post('api/uploadZip', file);
    }

    getInvoices(userId: string): Observable<any> {
        return this.http.get('api/invoices', { params: { userId } });
    }

    getChartData(groupBy: string): Observable<any> {
        return this.http.get('api/chart', { params: { groupBy } });
    }

    getRelatedData(invId: string): Observable<any> {
        return this.http.get('api/related', { params: { invId } });
    }

    getFileData(id: string, name: string): Observable<any> {
        return this.http.get('api/filedata', { params: { id, name }, responseType: 'arraybuffer', observe: 'body' });
    }

    saveInvoice(data: any): Observable<any> {
        return this.http.post('api/save', data);
    }

}