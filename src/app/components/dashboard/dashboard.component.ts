import { Component, OnInit } from '@angular/core';
import { SharedService } from './../../services/shared.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  
  chartConfig: Array<any> = [];

  constructor(private shared: SharedService) { }

  ngOnInit(): void {
    this.setChartConfig();
  }

  setChartConfig() {
    this.chartConfig = [
      {
        title: 'Invoices by Current State',
        sobject: 'Invoice__c',
        groupBy: 'Current_State__c',
        chartType: 'Pie'
      }, {
        title: 'Invoices by Buyer',
        sobject: 'Invoice__c',
        groupBy: 'Buyer__r.Name',
        chartType: 'Pie'
      }, {
        title: 'Invoices by Created Date',
        sobject: 'Invoice__c',
        groupBy: 'day_only(CreatedDate)',
        chartType: 'Pie'
      }, {
        title: 'Invoices by Last Modified Date',
        sobject: 'Invoice__c',
        groupBy: 'day_only(LastModifiedDate)',
        chartType: 'Pie'
      }
    ]
  }

}
