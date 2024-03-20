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
  activeTab: string = 'rawEEG'; // Default active tab

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    if (this.activeTab === 'rawEEG') {
      this.loadEEGHighcharts();
      this.loadProcessedHighcharts();
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'rawEEG') {
      this.loadEEGHighcharts();
      this.loadProcessedHighcharts();
    }
  }

  // Carga los datos y configura Highcharts para el EEG raw
  loadEEGHighcharts() {
    this.http.get('assets/Prueba2.csv', { responseType: 'text' })
      .subscribe(csvData => {
        const series = this.processEEGData(csvData);
        this.createChart('eeg', series);
      }, error => console.error('Error fetching the CSV data: ', error));
  }

  // Carga los datos y configura Highcharts para el EEG procesado
  loadProcessedHighcharts() {
    this.http.get('assets/data_for_highcharts.json').subscribe((data: any) => {
      this.createChart('processed', data);
    }, error => {
      console.error('Error loading the Highcharts data: ', error);
    });
  }

  // Procesa los datos EEG del CSV y crea series para cada canal
  processEEGData(allText: string) {
    const allTextLines = allText.split(/\r\n|\n/);
    const headers = allTextLines[0].split(',');
    const lines = [];
    for (let i = 1; i < allTextLines.length; i++) {
      const data = allTextLines[i].split(',');
      if (data.length === headers.length) {
        const tarr = [];
        for (let j = 0; j < headers.length; j++) {
          tarr.push(parseFloat(data[j]));
        }
        lines.push(tarr);
      }
    }
    // Transpone los datos para tener series por canales
    return headers.map((header, i) => ({
      name: header,
      data: lines.map(line => line[i]),
      yAxis: i
    }));
  }

  // Crea un gráfico de Highcharts en el contenedor especificado con las series dadas
  createChart(containerId: string, series: any[]) {
    const yAxisOptions = series.map((s, i) => ({
      title: { text: s.name },
      top: (i * 100 / series.length) + '%',
      height: (100 / series.length) - 2 + '%',
      offset: 0,
      lineWidth: 2
    }));

    Highcharts.chart(containerId, {
      chart: {
        type: 'line',
        zoomType: 'x',
        height: series.length * 100 // Ajusta la altura dinámicamente según el número de series
      },
      title: {
        text: 'EEG Data Visualization'
      },
      xAxis: {
        title: {
          text: 'Sample Number'
        }
      },
      yAxis: yAxisOptions,
      tooltip: {
        shared: true
      },
      series: series
    });
  }

  searchPatient(query: string) {
    console.log('Searching for patient:', query);
    // Aquí puedes implementar la lógica de búsqueda
  }

  uploadEEG() {
    this.router.navigate(['/eeg-subir-docs']);
    // Aquí puedes implementar la lógica de subida de archivos
  }
}
