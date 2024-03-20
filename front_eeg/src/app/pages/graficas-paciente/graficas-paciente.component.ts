import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Highcharts from 'highcharts';
import { Router } from '@angular/router';
import { Options } from 'highcharts';

@Component({
  selector: 'app-graficas-paciente',
  templateUrl: './graficas-paciente.component.html',
  styleUrls: ['./graficas-paciente.component.scss']
})
export class GraficasPacienteComponent implements OnInit {
  activeTab: string = 'contentEEG'; // Default active tab

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    // Si quieres cargar los datos de Highcharts al iniciar el componente:
    if (this.activeTab === 'rawEEG') {
      this.loadHighcharts();
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    // Si cambias a la pestaña de EEG, cargas Highcharts
    if (tab === 'rawEEG') {
      this.loadHighcharts();
    }
  }

  loadHighcharts() {
    this.http.get('assets/data_for_highcharts.json').subscribe((data: any) => {
      const options: Options = {
        chart: {
          type: 'line',
          //zoomType: 'x',
          height: 400
        },
        title: {
          text: 'EEG Data Visualization'
        },
        xAxis: {
          title: {
            text: 'Sample Number'
          }
        },
        yAxis: {
          title: {
            text: 'Amplitude (µV)'
          },
          labels: {
            format: '{value:.2f}'
          }
        },
        tooltip: {
          shared: true,
          valueSuffix: ' µV',
          valueDecimals: 2
        },
        plotOptions: {
          line: {
            lineWidth: 1,
            //crosshairs: true,
            marker: {
              enabled: false
            }
          }
        },
        series: data as Highcharts.SeriesOptionsType[]
      };

      Highcharts.chart('processed', options);
    }, error => {
      console.error('Error loading the Highcharts data: ', error);
    });
  }
  

  searchPatient(query: string) {
    console.log('Searching for patient:', query);
    // Implement your search logic here
  }

  uploadEEG() {
    this.router.navigate(['/eeg-subir-docs']);
    // Implement your upload logic here
  }
}