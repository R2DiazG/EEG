import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Highcharts from 'highcharts';
import { Router } from '@angular/router';
import { Options, SeriesOptionsType } from 'highcharts';
import { InfoPaciente } from '../../models/info-paciente.model';
import { ActivatedRoute } from '@angular/router';
import { EegService } from '../../services/sesiones/eeg.service';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { Observable } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { MedicamentoService } from '../../services/medicamentos/medicamento.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { CrearMedicamentoDialogComponent } from '../crear-medicamento-dialog/crear-medicamento-dialog.component';
import { id } from 'date-fns/locale';
import { DropMedicamentosDialogComponent } from '../drop-medicamentos-dialog/drop-medicamentos-dialog.component';

interface SeriesOptions {
  name: string;
  data: number[];
  yAxis: number;
}

interface EEGData {
  names: string[];
  data: number[][];
}

interface EEGDataPoints {
  name: string;
  data: number[];
  pointStart: number;
  pointInterval: number;
}

@Component({
  selector: 'app-graficas-paciente',
  templateUrl: './graficas-paciente.component.html',
  styleUrls: ['./graficas-paciente.component.scss']
})

export class GraficasPacienteComponent implements OnInit {
  //Sesion actual
  activeTab: string = 'detailsSesion'; // Tab activa por defecto
  idSesion!: number; // Declarar idSesion como propiedad del componente
  sesiones: any[] = []; // Almacenará las fechas de las sesiones
  selectedSesionId!: number;
  idPaciente!: number;
  fechaSesion!: string;

  fecha_consulta!: string;
  estado_general!: string;
  estado_especifico!: string;
  resumen_sesion_actual!: string;

  //Medicamentos
  displayedColumns: string[] = ['nombre_comercial', 'principio_activo', 'presentacion', 'fecha_sesion'];
  dataSource = new MatTableDataSource<any>([]);
  searchControl = new FormControl('');
  selectedMedicamentos: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private eegService: EegService,
    private route: ActivatedRoute,
    private medicamentoService: MedicamentoService,
    private pacienteService: PacienteService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog
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
  this.cargarMedicamentos();
    this.searchControl.valueChanges.subscribe((value) => {
      this.applyFilter(value || '');
    });
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

ngAfterViewInit() {
  this.dataSource.paginator = this.paginator;
}

/*
cargarMedicamentos() {
  this.medicamentoService.obtenerMedicamentos().subscribe({
    next: (medicamentos) => {
      this.dataSource.data = medicamentos;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error al recuperar medicamentos:', error);
    }
  });
}*/

cargarMedicamentos() {
  // Asumiendo que tienes un idPaciente disponible
  const idPaciente = this.idPaciente; // Debes definir cómo obtienes este ID

  this.medicamentoService.obtenerMedicamentosPorPaciente(idPaciente).subscribe({
    next: (medicamentos) => {
      console.log('Medicamentos para el paciente:', medicamentos);
      this.dataSource.data = medicamentos;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error al recuperar medicamentos para el paciente:', error);
    }
  });
}


applyFilter(value: string) {
  this.dataSource.filter = value.trim().toLowerCase();
  if (this.dataSource.paginator) {
    this.dataSource.paginator.firstPage();
  }
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
  console.log('Sesión seleccionada:', this.selectedSesionId);
  if (this.selectedSesionId != null) {
    this.router.navigateByUrl(`/graficas-paciente/${this.selectedSesionId}`);
  }
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

  addMedication(): void {
    const dialogRef = this.dialog.open(DropMedicamentosDialogComponent, {
      width: '500px',
      data: { selectedMedicamentos: this.selectedMedicamentos }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Medicamentos seleccionados:', result);
        this.selectedMedicamentos = result; // Asume que deseas actualizar la lista existente
        this.cargarMedicamentos();
      }
    });
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

  procesarYMostrarDatosNormalizedEEG(dataNormalizedString: EEGData): void {
    try {
      console.log('Datos EEG normalizados:', dataNormalizedString);
        // Parsea la cadena JSON para convertirla en un objeto JavaScript
        console.log('Datos EEG normalizados:', dataNormalizedString.names);
        console.log('Datos EEG normalizados:', dataNormalizedString.data);
        const { names, data } = dataNormalizedString;
        let maxAmplitude = Number.MIN_SAFE_INTEGER;
        let minAmplitude = Number.MAX_SAFE_INTEGER;
        data.forEach(channelData => {
          maxAmplitude = Math.max(maxAmplitude, ...channelData);
          minAmplitude = Math.min(minAmplitude, ...channelData);
        });
        const amplitudeRange = maxAmplitude - minAmplitude;
        const offset = amplitudeRange * 0.5; // Un 10% del rango como desplazamiento
        const extraPadding = 0.2;
        // Transforma los datos en series para Highcharts
        const series = names.map((name, index) => {
          return {
            name: name,
            data: data[index].map((point, i) => [i, point + offset * index]),
          };
        });
        // Determina el rango mínimo y máximo para el eje Y basado en los desplazamientos aplicados
        let minOffsetApplied = Math.min(...series.map(serie => Math.min(...serie.data.map(point => point[1]))));
        let maxOffsetApplied = Math.max(...series.map(serie => Math.max(...serie.data.map(point => point[1]))));
        const options: Options = {
          chart: {
            renderTo: 'eeg',
            type: 'line',
            zooming: {
              type: 'x'
            },
            height: 1000
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
            labels: {/*
              formatter: function () {
                const index = Math.floor((this.value as number) / offset);
                return names[index] || '';
              }*/
              formatter: function () {
                // Calcula el índice basado en la posición actual y el desplazamiento fijo
                // Esto asume que los canales están igualmente espaciados y el primer canal está en '0'
                const index = Math.round((this.value as number) / offset);
                // Devuelve el nombre del canal o un string vacío si el índice es inválido
                return names[index] || '';
              }
            },
            /*
            min: minOffsetApplied,
            max: maxOffsetApplied,
            tickInterval: 1e-6, // Establece un intervalo de tick apropiado
            */
            tickInterval: offset, // Establece un intervalo de tick apropiado
            min: -extraPadding,
            max: offset * (names.length-1) + extraPadding, // Ajusta el rango máximo según la cantidad de canales
          },
          tooltip: {
            shared: true,
            valueDecimals: 8
          },
          series: series as Highcharts.SeriesOptionsType[]
        };
        Highcharts.chart(options);
    } catch (error) {
      console.error('Error al procesar los datos EEG normalizados:', error);
    }
  }
  
  // Modificar la función cargarDatosEEG para que utilice la nueva interfaz EEGDataPSD
  cargarDatosEEG(): void {
    console.log('cargarDatosEEG psd');
    if (this.idSesion) {
      this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
        next: (response: any) => {
          console.log('Datos EEG:', response);
          if (response.normalized_eegs && response.normalized_eegs.length > 0) {
            const dataPSDString = response.normalized_eegs[0].data_psd;
            try {
              const dataPSD: EEGDataPoints = JSON.parse(dataPSDString);
              console.log('Datos PSD en JSON:', dataPSD);
              this.procesarYMostrarDatosPSD(dataPSD);
            } catch (error) {
              console.error('Error al parsear los datos PSD:', error);
            }
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

  procesarYMostrarDatosPSD(dataPSD: EEGDataPoints): void {
    // Hay que asegurarse de que 'dataPSD' está en el formato correcto para Highcharts, por ejemplo, dataPSD podría ser algo así:
    // [
    //   { name: "Canal 1", data: [...], pointStart: frecuenciaInicial, pointInterval: intervaloEntreFrecuencias },
    //   { name: "Canal 2", data: [...], pointStart: frecuenciaInicial, pointInterval: intervaloEntreFrecuencias },
    //   ...
    // ]
    // Genera la serie de datos para Highcharts
    const seriesData = dataPSD.data.map((value, index) => {
      return [
        dataPSD.pointStart + index * dataPSD.pointInterval, // x
        value // y
      ];
    });
    // Opciones para Highcharts
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