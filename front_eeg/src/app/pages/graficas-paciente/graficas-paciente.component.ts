import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Highcharts from 'highcharts';
import { Router } from '@angular/router';
import { Options } from 'highcharts';
import { InfoPaciente } from '../../models/info-paciente.model';
import { ActivatedRoute } from '@angular/router';
import { EegService } from '../../services/sesiones/eeg.service';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { Observable } from 'rxjs';

interface SeriesOptions {
  name: string;
  data: number[];
  yAxis: number;
}

interface EEGData {
  names: string[];
  data: number[][];
}

@Component({
  selector: 'app-graficas-paciente',
  templateUrl: './graficas-paciente.component.html',
  styleUrls: ['./graficas-paciente.component.scss']
})

export class GraficasPacienteComponent implements OnInit {
  activeTab: string = 'detailsSesion'; // Tab activa por defecto
  idSesion!: number; // Declarar idSesion como propiedad del componente
  sesiones: any[] = []; // Almacenará las fechas de las sesiones
  selectedSesionId: number | null = null;
  idPaciente!: number;
  fechaSesion!: string;

  fecha_consulta!: string;
  estado_general!: string;
  estado_especifico!: string;
  resumen_sesion_actual!: string;

  constructor(
    private eegService: EegService,
    private route: ActivatedRoute,
    private pacienteService: PacienteService,
    private router: Router
  ) {}
/*
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      console.log('ID de sesión:', params);
      this.idSesion = +params.get('id_sesion')!;
      console.log('ID de sesión:', this.idSesion);
      if (this.idSesion) {
        this.obtenerPacienteEnBaseASesion(this.idSesion).subscribe({
          next: (paciente) => {
            console.log('Paciente:', paciente);
            if (paciente) {
              this.idPaciente = paciente;
              if (this.idPaciente !== null) {
                this.cargarFechasSesionesPorPaciente(this.idPaciente);
                this.cargarDatosNormalizedEEG();
                this.cargarDatosEEG();
              } else {
                console.error('ID de paciente no encontrado para la sesión proporcionada.');
              }
            } else {
              console.error('ID de paciente no encontrado para la sesión proporcionada.');
            }
          },
          error: (error) => console.error('Error al obtener ID de paciente:', error)
        });
      } else {
        console.error('ID de sesión no proporcionado');
      }
    });
  }
*/


ngOnInit() {
  this.route.paramMap.subscribe(params => {
    console.log('ID de sesión:', params);
    this.idSesion = +params.get('id_sesion')!;
    console.log('ID de sesión:', this.idSesion);
    if (this.idSesion) {
      this.obtenerPacienteEnBaseASesion(this.idSesion).subscribe({
        next: (paciente) => {
          console.log('Paciente:', paciente);
          if (paciente) {
            this.idPaciente = paciente;
            if (this.idPaciente !== null) {
              console.log('Datos eeg', this.idPaciente);
              this.cargarFechasSesionesPorPaciente(this.idPaciente);
              this.cargarDatosNormalizedEEG();
              this.cargarDatosEEG();
              // Cargar datos de la sesión de EEG directamente aquí
              this.cargarDatosDeEeg(this.idSesion); // Asumiendo que quieres los datos de EEG basados en el idSesion
            } else {
              console.error('ID de paciente no encontrado para la sesión proporcionada.');
            }
          } else {
            console.error('ID de paciente no encontrado para la sesión proporcionada.');
          }
        },
        error: (error) => console.error('Error al obtener ID de paciente:', error)
      });
    } else {
      console.error('ID de sesión no proporcionado');
    }
  });
}

cargarDatosDeEeg(idSesion: number): void {
  this.eegService.obtenerEEGPorSesion(idSesion).subscribe({
    next: (datosEeg) => {
      console.log(datosEeg)
      if (datosEeg) {
        // Asume que la respuesta incluye las propiedades directamente
        this.fecha_consulta = datosEeg.detalle_sesion.fecha_consulta;
        this.estado_general = datosEeg.detalle_sesion.estado_general;
        this.estado_especifico = datosEeg.detalle_sesion.estado_especifico;
        this.resumen_sesion_actual = datosEeg.detalle_sesion.resumen_sesion_actual;
      } else {
        console.error('Datos de EEG no encontrados para esta sesión.');
      }
    },
    error: (error) => console.error('Error al obtener datos de EEG:', error)
  });
}


  obtenerPacienteEnBaseASesion(idSesion: number): Observable<any> {
    return this.eegService.obtener_paciente_en_base_a_sesion(idSesion);
  }

  obtenerEegPorSesion(idSesion: number): Observable<any> {
    return this.eegService.obtenerEEGPorSesion(idSesion);
  }

  /*
  fecha_consulta': sesion.fecha_consulta.strftime('%Y-%m-%d'),
                'estado_general': sesion.estado_general,
                'estado_especifico': sesion.estado_especifico,
                'resumen_sesion_actual': sesion.resumen_sesion_actual,
                'notas_psicologo': sesion.notas_psicologo
  */

  cargarFechasSesionesPorPaciente(idPaciente: number) {
    this.pacienteService.obtenerFechasSesionesPorPaciente(idPaciente).subscribe({
      next: (data) => {
        console.log('Fechas de sesiones:', data);
        this.sesiones = data;
        this.fechaSesion = data[data.length-1.].fecha_consulta;
        // Opcionalmente, selecciona una sesión por defecto aquí
      },
      error: (error) => console.error('Error al obtener fechas de sesiones:', error)
    });
  }
/*
  ngOnInit() {
this.route.paramMap.subscribe(params => {
      const idPaciente = params.get('idPaciente');
      if (idPaciente) {
        this.cargarFechasSesionesPorPaciente(+idPaciente);
      } else {
        console.error('ID de paciente no proporcionado');
      }
    });
  }

  cargarFechasSesionesPorPaciente(idPaciente: number) {
    this.pacienteService.obtenerFechasSesionesPorPaciente(idPaciente).subscribe({
      next: (data) => {
        this.sesiones = data;
        // Opcionalmente, selecciona una sesión por defecto aquí
      },
      error: (error) => console.error('Error al obtener fechas de sesiones:', error)
    });
  }
*/
  onSesionChange() {
    // Aquí puedes hacer lo que necesites cuando el usuario cambie la selección del dropdown
    console.log('Sesión seleccionada:', this.selectedSesionId);
    // Por ejemplo, cargar datos de la sesión seleccionada
  }

  addSession(): void {
    console.log('ID de paciente:', this.idPaciente);
    if (this.idPaciente) {
      console.log('ID de paciente:', this.idPaciente);
      this.router.navigate(['/eeg-subir-docs', this.idPaciente]);
    } else {
      console.error('ID de paciente no está disponible');
    }
  }

  regresar(){
    this.router.navigate(['/lista-pacientes']);
  }
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  /*cargarDatosNormalizedEEG(): void {
    if (this.idSesion) {
      this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
        next: (response: { normalized_eegs: string | any[]; }) => {
          console.log('Datos EEG normalizados:', response);
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
  }*/

  cargarDatosNormalizedEEG(): void {
    if (this.idSesion) {
      this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
        next: (response) => {
          console.log('Datos EEG normalizados:', response);
          if (response.normalized_eegs && response.normalized_eegs.length > 0) {
            // Obtén la cadena JSON de data_normalized del primer elemento del array normalized_eegs
            const dataNormalizedString = response.normalized_eegs[0].data_normalized;
            try {
              // Parsea la cadena JSON para convertirla en un objeto/array JavaScript
              const dataNormalized = JSON.parse(dataNormalizedString);
              console.log('EEG normalizados:', dataNormalized);
              // Ahora que tienes dataNormalized como un objeto/array, puedes pasarlo a la función
              this.procesarYMostrarDatosNormalizedEEG(dataNormalized);
            } catch (error) {
              console.error('Error al parsear los datos EEG normalizados:', error);
            }
          } else {
            console.error('No se encontraron EEGs normalizados para esta sesión.');
          }
        },
        error: (error) => console.error('Error al obtener datos EEG normalizados:', error)
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

  procesarYMostrarDatosNormalizedEEG(dataNormalizedString: any): void {
    try {
        
        // Parsea la cadena JSON para convertirla en un objeto JavaScript
        let dataNormalizedObj: EEGData = JSON.parse(dataNormalizedString);
        console.log('Datos EEG normalizados:', dataNormalizedObj.names);
        console.log('Datos EEG normalizados:', dataNormalizedObj.data);
        //const dataNormalizedObj = JSON.parse(dataNormalizedString);
        const { names, data } = dataNormalizedObj;
        // Asumiendo que 'data' es un array de series donde cada serie tiene { name, data }
        const offset = 50; // Se ajusta si es necesario separar los canales mas o menos visualmente.
        // Aplica el offset a cada serie de datos
        // Transforma los datos en series para Highcharts, aplicando un offset a cada canal
        const series = names.map((name: string, index: number) => ({
          name,
          data: data[index].map((value: number, i: number) => [i, value + index * offset]) // Crea pares de [x, y] para Highcharts
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
            }/*,
            labels: {
              formatter: function () {
                const index = Math.floor((this.value as number) / offset);
                return nombres_canales[index] || '';
              }
            } */
          },
          tooltip: {
            shared: true
          },
          //series: series as Highcharts.SeriesOptionsType[]
          series: series
        };
        Highcharts.chart(options);
    } catch (error) {
      console.error('Error al procesar los datos EEG normalizados:', error);
    }
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