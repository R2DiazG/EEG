import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Highcharts from 'highcharts';
import { Router } from '@angular/router';
import { Options } from 'highcharts';
import { InfoPaciente } from '../../models/info-paciente.model';
import { ActivatedRoute } from '@angular/router';
import { EegService } from '../../services/sesiones/eeg.service';

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
  activeTab: string = 'contentEEG'; // Tab activa por defecto
  idSesion: number | null = null; // Declarar idSesion como propiedad del componente
  constructor(
    private eegService: EegService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      // 'id' es el nombre del parámetro definido en tu configuración de ruta
      const idSesion = params.get('id');
      if (idSesion) {
        this.idSesion = +idSesion; // El '+' convierte el valor a número
        this.cargarDatosEEG();
      } else {
        // Manejar el caso de que el idSesion no esté disponible
        console.error('ID de sesión no proporcionado');
      }
    });
  }

  addSession(): void {
    this.router.navigate(['/nueva-sesion']);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  cargarDatosNormalizedEEG(): void {
    if (this.idSesion) {
      this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
        next: (response: { normalized_eegs: string | any[]; }) => {
          if (response.normalized_eegs && response.normalized_eegs.length > 0) {
            const dataNormalized = JSON.parse(response.normalized_eegs[0].data_normalized);
            this.procesarYMostrarDatosNormalizedEEG(dataNormalized);
          } else {
            console.error('No se encontraron EEGs normalizados para esta sesión.');
          }
        },
        error: (error: any) => console.error('Error al obtener datos EEG normalizados:', error)
      });
    } else {
      console.error('ID de sesión es nulo');
    }
  }
  
  cargarDatosEEG(): void {
    if (this.idSesion) { // Verifica que idSesion no sea null
      this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
        next: (response: { normalized_eegs: string | any[]; }) => {
          // Asumiendo que quieres utilizar el primer EEG normalizado que encuentres:
          if (response.normalized_eegs && response.normalized_eegs.length > 0) {
            const primerEEGNormalizado = response.normalized_eegs[0];
            // Aquí extraemos 'data_psd' del primer EEG normalizado encontrado
            const dataPSD = primerEEGNormalizado.data_psd;
            this.procesarYMostrarDatosPSD(dataPSD);
          } else {
            console.error('No se encontraron EEGs normalizados para esta sesión.');
          }
        },
        error: (error: any) => console.error('Error al obtener datos de EEG:', error)
      });
    } else {
      console.error('ID de sesión es nulo');
    }
  }

  procesarYMostrarDatosNormalizedEEG(data: any): void {
    // Asumiendo que 'data' es un array de series donde cada serie tiene { name, data }
    const offset = 50; // Se ajusta si es necesario separar los canales mas o menos visualmente.
    // Aplica el offset a cada serie de datos
    const offsetSeries = data.map((serie: any, i: number) => ({
      name: serie.name,
      data: serie.data.map((d: number) => d + i * offset)
    }));
    const options: Options = {
      chart: {
        renderTo: 'eeg',
        type: 'line',
        zooming: {
          type: 'x'
        },
        height: 800
      },
      title: {
        text: 'Visualización de Datos EEG Normalizados'
      },
      xAxis: {
        title: {
          text: 'Número de Muestra'
        }
      },
      yAxis: {
        title: {
          text: 'Amplitud (µV)'
        },
        labels: {
          formatter: function () {
            const index = Math.floor((this.value as number) / offset);
            return index >= 0 && index < data.length ? data[index].name : '';
          }
        }
      },
      tooltip: {
        shared: true
      },
      series: offsetSeries
    };
    Highcharts.chart(options);
  }
  
  procesarYMostrarDatosPSD(dataPSD: any): void {
    // Hay que asegurarse de que 'dataPSD' está en el formato correcto para Highcharts, por ejemplo, dataPSD podría ser algo así:
    // [
    //   { name: "Canal 1", data: [...], pointStart: frecuenciaInicial, pointInterval: intervaloEntreFrecuencias },
    //   { name: "Canal 2", data: [...], pointStart: frecuenciaInicial, pointInterval: intervaloEntreFrecuencias },
    //   ...
    // ]
    const options: Options = {
      chart: {
        type: 'line',
        zooming: {
          type: 'x'
        },
        height: 400
      },
      title: {
        text: 'Densidad Espectral de Potencia (PSD) de Datos EEG'
      },
      xAxis: {
        title: {
          text: 'Frecuencia (Hz)'
        },
        // Aquí ajustar según el pointStart y pointInterval si es necesario
        // Esto puede requerir ajuste dependiendo de la configuración de las series
      },
      yAxis: {
        title: {
          text: 'Potencia (dB/Hz)'
        },
        labels: {
          format: '{value:.2f}'
        }
      },
      tooltip: {
        shared: true,
        valueSuffix: ' dB/Hz',
        valueDecimals: 2
      },
      plotOptions: {
        line: {
          lineWidth: 1,
          marker: {
            enabled: false
          }
        }
      },
      series: dataPSD
    };
    Highcharts.chart('processed', options); // Asegúrate de que 'processed' es el ID de tu contenedor en HTML
  }  
}

  /*
  activeTab: string = 'contentEEG'; // Default active tab

  constructor(private http: HttpClient, private router: Router) {}
  
  patient: InfoPaciente = new InfoPaciente();

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
          zooming: {
            type: 'x' // Configuramos el nuevo tipo de zoom
          },
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
      const series = data;
      // Utilizamos un valor de offset fijo más pequeño o un factor de escala para reducirlo.
      // Por ejemplo, si los valores oscilan alrededor de 50 unidades entre cada canal, podrías usar ese valor.
      const offset = Math.max(...series.map((s: { data: any; }) => Math.max(...s.data))) - Math.min(...series.map((s: { data: any; }) => Math.min(...s.data))); // Este valor debería ser ajustado manualmente para que se ajuste bien a tus datos.
  
      const offsetSeries = series.map((s: { name: string; data: number[]; }, i: number) => ({
        name: s.name,
        data: s.data.map(d => d + i * offset), // Offset aplicado a los datos
      }));
  
      const options: Options = {
        chart: {
          renderTo: 'eeg',
          zooming: {
            type: 'x' // Configuramos el nuevo tipo de zoom
          },
          type: 'line',
          height: 800 // Altura ajustada a la cantidad de datos.
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
            text: 'Amplitude'
          },
          tickInterval: offset,
          labels: {
            formatter: function () {
              const index = Math.floor((this.value as number) / offset);
              // Verificamos si el índice está dentro del rango del array de series
              if (index >= 0 && index < series.length) {
                return series[index].name;
              }
              return '';
            }
          }
        },
        tooltip: {
          shared: true
        },
        series: offsetSeries as Highcharts.SeriesOptionsType[]
      };
  
      Highcharts.chart(options);
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
    this.router.navigate(['/eeg-subir-docs']);
  }

  addConsultation(): void {
      this.router.navigate(['/nueva-consulta']);
  }
}*/