import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { ColorHelper } from '@swimlane/ngx-charts';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {

  @Input() config: any;

  data: Array<any> = [];

  colorScheme = {
    domain: ['#a8385d', '#7aa3e5', '#a27ea8', '#aae3f5', '#adcded', '#a95963', '#8796c0', '#7ed3ed', '#50abcc', '#ad6886']
  };

  public colors: ColorHelper = new ColorHelper(this.colorScheme, 'ordinal', this.data, this.colorScheme);

  constructor(private shared: SharedService) { }

  ngOnInit(): void {
    // this.colors = new ColorHelper(this.colorScheme, 'ordinal', this.data, this.colorScheme);
    console.log(this.config)
    if (this.config) {
      this.getChartData(this.config);
    }
  }

  ngOnChange(changes: SimpleChanges): void {
    if (changes['config'] && changes['config'].currentValue) {
      console.log(changes['config'].currentValue)
      this.getChartData(changes['config']);
    }
  }

  getChartData(config: any) {
    this.shared.setLoading();
    this.shared.getChartData(config.groupBy).subscribe({
      next: (v) => {
        console.log(v);

        const field = config.groupBy.includes('__r.') ? config.groupBy.split('__r.')[1] : (config.groupBy.includes('day_only') ? 'expr1' : config.groupBy);

        this.data = v.data.records.map((record: any) => {
          return { name: record[field] || 'N/A', value: record.expr0 };
        })

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

}
