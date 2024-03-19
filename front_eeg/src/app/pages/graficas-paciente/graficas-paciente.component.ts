import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Highcharts from 'highcharts';
import { Router } from '@angular/router';

@Component({
  selector: 'app-graficas-paciente',
  templateUrl: './graficas-paciente.component.html',
  styleUrls: ['./graficas-paciente.component.scss']
})
export class GraficasPacienteComponent implements OnInit {
  activeTab: string = 'rawEEG'; // Default active tab

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
    this.http.get('assets/data_for_highcharts.json').subscribe(data => {
      Highcharts.chart('eeg-container', {
        chart: {
          type: 'line',
          zoomType: 'x',
          // Configuración adicional como altura, etc.
          height: 400 // Altura en píxeles, ajusta según necesidad
        },
        title: {
          text: 'EEG Data Visualization'
        },
        xAxis: {
          title: {
            text: 'Sample Number'
          },
          // Configuración adicional del eje X como categorías, etc.
        },
        yAxis: {
          // Podrías necesitar ajustar esto dependiendo de cómo quieres que se vean tus ejes Y.
          // Aquí un ejemplo con un solo eje Y.
          title: {
            text: 'Amplitude (µV)'
          },
          labels: {
            format: '{value:.2f}' // Formato para dos decimales, ajusta según necesidad
          }
        },
        tooltip: {
          // Configuración del tooltip, puedes personalizar esto más.
          shared: true,
          crosshairs: true,
          valueSuffix: ' µV', // Unidad de medida para mostrar en el tooltip
          valueDecimals: 2 // Número de decimales en el tooltip
        },
        plotOptions: {
          // Configuraciones de cómo se dibuja cada serie
          line: {
            lineWidth: 1, // Grosor de la línea, ajusta según necesidad
            marker: {
              enabled: false // Oculta los marcadores de puntos individuales
            }
          }
        },
        series: data as Highcharts.SeriesOptionsType[]
      });
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
    // Implement your upload logic here
  }
}
