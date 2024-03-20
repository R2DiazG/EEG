import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Highcharts from 'highcharts';
import { Router } from '@angular/router';
import { Options } from 'highcharts';

interface SeriesOptions {
  name: string;
  data: number[];
  yAxis: number;
}

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
    if (this.activeTab === 'contentEEG') {
      this.loadHighcharts();
      this.cargarDatosEEGDesdeJSON(); // Nueva llamada para cargar datos desde CSV
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    // Si cambias a la pestaña de EEG, cargas Highcharts
    if (tab === 'contentEEG') {
      this.loadHighcharts();
      this.cargarDatosEEGDesdeJSON(); // Nueva llamada para cargar datos desde CSV
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
          text: 'Power Spectrum Density (PSD) of EEG Data'
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

  private cargarDatosEEGDesdeJSON(): void {
    this.http.get('assets/EEGDataTransposed.json').subscribe((data: any) => {
      const series = data; // Si 'data' ya está en el formato correcto, no es necesario procesarlo.
      // Calculamos el offset basado en el número de series.
      const offset = Math.max(...series.map((s: { data: any; }) => Math.max(...s.data))) - Math.min(...series.map((s: { data: any; }) => Math.min(...s.data)));
      const offsetSeries = series.map((s: { name: any; data: any[]; }, i: number) => ({
        name: s.name,
        data: s.data.map((d: number) => d + i * offset), // Aplicamos el offset aquí
      }));
    
      const options: Options = { 
        chart: {
          renderTo: 'eeg',
          type: 'line',
          height: 700
        },
        boost: {
          useGPUTranslations: true
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
            text: 'Value'
          },
          // Configuramos un único eje Y para todas las series
          tickInterval: offset, // Ajustamos el intervalo de los ticks al offset calculado
          labels: {
            formatter: function () {
              const value = this.value as number;
              const seriesName = series[Math.floor(value / offset)]?.name;
              return seriesName ? seriesName : '';
            }
          }
        },
        tooltip: {
          shared: true
        },
        series: offsetSeries as Highcharts.SeriesOptionsType[]
      };
    
      Highcharts.chart(options); // Creamos el gráfico con las opciones definidas.
    }, error => {
      console.error('Error fetching the JSON data: ', error);
    });
  }

  private processEEGData(allText: string): SeriesOptions[] {
    // Implementación del procesamiento de datos aquí...
    // Similar a lo descrito previamente

    const processedData: SeriesOptions[] = []; // Declare and initialize the variable

    // Add a return statement to return the processed EEG data
    return processedData;
  }

  searchPatient(query: string) {
    // Implementación existente...
  }

  uploadEEG() {
    // Implementación existente...
  }
}
