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

  private cargarDatosEEGDesdeJSON() {
    this.http.get('assets/Prueba2.json').subscribe((data: any) => {
      // Aquí 'data' debe ser ya un objeto JSON con la estructura esperada.
      // Por ejemplo, podría ser un arreglo de objetos donde cada objeto
      // representa una serie con un campo 'name' y un campo 'data'.
      const series = data; // Si 'data' ya está en el formato correcto, no es necesario procesarlo.
      const yAxisOptions = series.map((s: any, i: number) => ({
        title: { text: s.name },
        top: (i * 100 / series.length) + '%',
        height: (100 / series.length) - 2 + '%',
        offset: 0,
        lineWidth: 2
      }));
  
      const options: Options = { 
        chart: {
          renderTo: 'eeg', // Asegúrate de que este ID coincida con el de tu contenedor en HTML.
          type: 'line',
          height: 400 // Puedes ajustar esto según tus necesidades.
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
        yAxis: yAxisOptions,
        tooltip: {
          shared: true
        },
        series: series
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
