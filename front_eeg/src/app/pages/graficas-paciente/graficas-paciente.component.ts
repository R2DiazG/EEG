import { ChangeDetectorRef, Component, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Options, SeriesOptionsType } from 'highcharts';
import { ActivatedRoute } from '@angular/router';
import { EegService } from '../../services/sesiones/eeg.service';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { Observable } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { MedicamentoService } from '../../services/medicamentos/medicamento.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { DropMedicamentosDialogComponent } from '../drop-medicamentos-dialog/drop-medicamentos-dialog.component';
import * as Highcharts from 'highcharts/highstock';
import * as d3 from 'd3';
import { id } from 'date-fns/locale';

declare var Plotly: any;

interface EEGAnomaly {
  index: number;
  value: number;
  area: string;
}

interface EEGData {
  names: string[];
  data: number[][];
}

interface EEGDataPSD {
  name: string;
  data: number[];
  pointStart: number;
  pointInterval: number;
}

interface EEGDataArea {
  area: string;
  data: number[];
}

interface EEGDataBand {
  area: string;
  banda: string;
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
  notas_psicologo!: string;
  activeGraphTab = 'eeg';
  activeSectionTab = 'anomaly';

  // Notas del psicólogo
  isAddingNote: boolean = false;
  fechaSesionActual!: string;
  notasPsicologoEdit!: string;

  // Eliminar sesion
  isConfirm: boolean = false;
  isDeleted: boolean = false;
  isDeleteInitiated: boolean = false;

  //Medicamentos
  displayedColumns: string[] = ['nombre_comercial', 'principio_activo', 'presentacion', 'fecha_sesion', 'notas_psicologo'];
  dataSource = new MatTableDataSource<any>([]);
  searchControl = new FormControl('');
  selectedMedicamentos: number[] = [];

  //EEG
  private plotly: any;
  caracteristicas: number[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  areaSeleccionada!: string;

  constructor(
    private eegService: EegService,
    private route: ActivatedRoute,
    private medicamentoService: MedicamentoService,
    private pacienteService: PacienteService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      import('plotly.js-dist-min').then(Plotly => {
        this.plotly = Plotly;
      });
    }
    this.searchControl.valueChanges.subscribe((value) => {
      this.applyFilter(value || '');
    });
    this.cargarMedicamentos();
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
                this.cargarMedicamentos();
                this.cargarDatosSTFT();
                this.cargarCaracteristicas();
                this.cargarDatosNormalizedEEG();
                this.cargarDatosNormalizedEEGConAnomalias();
                // Cargar datos de la sesión de EEG directamente aquí
                this.cargarDatosDeEeg(this.idSesion);
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

cargarMedicamentos() {
  const idPaciente = this.idPaciente;

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

onDeleteSesion(): void {
  if (!this.idPaciente || this.idSesion === null) {
    console.error('Error: ID de paciente o sesión no disponible.');
    return;
  }

  if (!this.isConfirm && !this.isDeleteInitiated) {
    this.isDeleteInitiated = true;
    this.cdr.detectChanges();
    this.setTimeoutToRevertState();
    return;
  }

  if (this.isConfirm) {
    this.pacienteService.eliminarSesionPorPaciente(this.idPaciente, this.idSesion).subscribe({
      next: () => {
        console.log('Sesion eliminada con éxito.');
        this.resetDeleteState(true); // Reset y actualización de vista post-eliminación
      },
      error: (error) => {
        console.error('Error al eliminar la sesion:', error);
        this.resetDeleteState(false); // Solo resetea el estado sin cargar nueva sesión
      }
    });
  } else {
    this.requestConfirmation();
  }
}

private setTimeoutToRevertState() {
  setTimeout(() => {
    if (!this.isConfirm) {
      this.resetDeleteState(false);
    }
  }, 3000);
}

private requestConfirmation() {
  this.isConfirm = true;
  this.cdr.detectChanges();
  this.setTimeoutToRevertState();
}

private resetDeleteState(success: boolean) {
  this.isConfirm = false;
  this.isDeleteInitiated = false;
  this.isDeleted = success;
  this.cdr.detectChanges();
  if (success) {
    this.getLastSession(this.idPaciente);
  }
}

iniciarEdicion() {
  this.notasPsicologoEdit = this.notas_psicologo; // Carga las notas existentes para edición
  this.isAddingNote = true;
}

// Cancelar la edición de las notas
cancelarEdicion() {
  this.notasPsicologoEdit = ''; // Limpia el área de texto de edición
  this.isAddingNote = false; // Oculta el editor
}

getLastSession(idPaciente: number): void {
  console.log('Obteniendo la última sesión para el paciente con ID:', idPaciente);
  this.eegService.obtenerUltimaSesion(idPaciente).subscribe({
    next: (sesion) => {
      if (sesion) {
        console.log('La última sesión es:', sesion);
        this.router.navigate(['/graficas-paciente', sesion.id_sesion]);
      } else {
        console.log('No se encontró la última sesión para este paciente.');
        this.router.navigate(['/lista-pacientes']);
      }
    },
    error: (error) => {
      console.error('Error al obtener la última sesión:', error);
    }
  });
}

onAgregarNotasClick(): void {
  this.notasPsicologoEdit = this.notas_psicologo || '';
  this.isAddingNote = true; // Muestra el input de texto
}

// Método para guardar las notas del psicólogo
guardarNotasPsicologo(): void {
  if (this.idSesion && this.notasPsicologoEdit.trim()) {
    this.eegService.actualizarNotasPsicologoSesion(this.idSesion, this.notasPsicologoEdit).subscribe({
      next: (response) => {
        // Actualizamos ambas variables para asegurarse de que la vista y el cuadro de edición estén sincronizados
        this.notas_psicologo = this.notasPsicologoEdit;
        // Oculta el input de texto después de guardar
        this.isAddingNote = false;
        console.log(response.mensaje);
      },
      error: (error) => {
        console.error('Error al actualizar las notas del psicólogo:', error);
      }
    });
  } else {
    console.error('Error: No se proporcionó el ID de la sesión o el contenido para las notas.');
  }
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
        this.fecha_consulta = datosEeg.detalle_sesion.fecha_consulta;
        this.estado_general = datosEeg.detalle_sesion.estado_general;
        this.estado_especifico = datosEeg.detalle_sesion.estado_especifico
          .replace(/_/g, ' ')
          .split(',')
          .map((phrase: string) =>
            phrase.trim().split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          )
          .join(', ');
        this.resumen_sesion_actual = datosEeg.detalle_sesion.resumen_sesion_actual;
        this.notas_psicologo = datosEeg.detalle_sesion.notas_psicologo;
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

  cargarFechasSesionesPorPaciente(idPaciente: number) {
    this.pacienteService.obtenerFechasSesionesPorPaciente(idPaciente).subscribe({
      next: (data) => {
        console.log('Fechas de sesiones:', data);
        this.sesiones = data;
        this.fechaSesion = data[data.length-1.].fecha_consulta;
        console.log('Fecha de la última sesión:', this.fechaSesion);
      },
      error: (error) => console.error('Error al obtener fechas de sesiones:', error)
    });
  }

onSesionChange() {
  console.log('Sesión seleccionada:', this.selectedSesionId);
  if (this.selectedSesionId != null) {
    this.router.navigate([`/graficas-paciente/${this.selectedSesionId}`]).then(() => {
      this.cdr.detectChanges();
    });
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

  addMedication(idSesion: number): void {
    const dialogRef = this.dialog.open(DropMedicamentosDialogComponent, {
      width: '55rem',
      height: '25rem',
      data: {
        selectedMedicamentos: this.selectedMedicamentos,
        idSesion: idSesion
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Medicamentos seleccionados:', result);
        this.selectedMedicamentos = result; // Actualizamos la lista con el resultado del diálogo
      }
    });
  }

  regresar(){
    this.router.navigate(['/lista-pacientes']);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.cargarDatos(); // Llamamos a cargarDatos cada vez que se cambia el tab
  }

setActiveGraphTab(tabName: string) {
  this.activeGraphTab = tabName;
  this.cargarDatos(); // Llamamos a cargarDatos cada vez que se cambia el tab
}

setActiveSectionTab(tabName: string) {
  this.activeSectionTab = tabName;
  this.cargarDatos(); // Llamamos a cargarDatos cada vez que se cambia el tab
}

cargarDatos() {
  switch(this.activeTab) {
    case 'detailsSesion':
      // Cargamos datos relacionados con los detalles de la sesión
      this.cargarDatosDeEeg(this.idSesion);
      break;
    case 'meds':
      // Cargamos el historial de medicamentos
      this.cargarMedicamentos();
      break;
    case 'prob':
      this.cargarCaracteristicas();
      this.cargarDatosNormalizedEEGConAnomalias();
      break;
  }

  if (this.activeGraphTab === 'eeg') {
    this.cargarDatosNormalizedEEG();
  } if (this.activeGraphTab === 'psd') {
    this.cargarDatosEEG();
  }if (this.activeGraphTab === 'psd-band') {
    this.cargarPSDAreaBandas(this.idSesion, 'Frontal izq');
  }if (this.activeGraphTab === 'pr-band') {
    this.cargarPRAreaBandas(this.idSesion, 'Frontal izq');
  }
  if (this.activeGraphTab === 'stft') {
    this.cargarDatosSTFT();
  }

  if(this.activeSectionTab === 'anomaly'){
    this.cargarDatosNormalizedEEGConAnomalias();
  }
  if(this.activeSectionTab === 'anomaly_area1'){
    this.cargarDatosNormalizedEEGConAnomaliasFrontal();
  }
  if(this.activeSectionTab === 'anomaly_area2'){
    this.cargarDatosNormalizedEEGConAnomaliasTemporal();
  }
  if(this.activeSectionTab === 'anomaly_area3'){
    this.cargarDatosNormalizedEEGConAnomaliasCentral();
  }
  if(this.activeSectionTab === 'anomaly_area4'){
    this.cargarDatosNormalizedEEGConAnomaliasParietal();
  }
  if(this.activeSectionTab === 'anomaly_area5'){
    this.cargarDatosNormalizedEEGConAnomaliasOccipital();
  }
}

  cargarDatosNormalizedEEG(): void {
    if (this.idSesion) {
      this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
        next: (response) => {
          console.log('Datos EEG normalizados:', response);
          if (response.normalized_eegs && response.normalized_eegs.length > 0) {
            const dataNormalizedString = response.normalized_eegs[0].data_normalized;
            try {
              // Parsea la cadena JSON para convertirla en un objeto/array JavaScript
              const dataNormalized = JSON.parse(dataNormalizedString);
              console.log('EEG normalizados:', dataNormalized);
              // Ahora con dataNormalized como un objeto/array lo pasamos a la función
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
        // Transformamos los datos en series para Highcharts
        const series = names.map((name, index) => {
          return {
            name: name,
            data: data[index].map((point, i) => [i, point + offset * index]),
          };
        });
        // Determinamos el rango mínimo y máximo para el eje Y basado en los desplazamientos aplicados
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
            labels: {
              formatter: function () {
                // Calcula el índice basado en la posición actual y el desplazamiento fijo
                // Esto asume que los canales están igualmente espaciados y el primer canal está en '0'
                const index = Math.round((this.value as number) / offset);
                // Devuelve el nombre del canal o un string vacío si el índice es inválido
                return names[index] || '';
              }
            },
            tickInterval: offset, // Establecemos un intervalo de tick apropiado
            min: -extraPadding,
            max: offset * (names.length-1) + extraPadding, // Ajustamos el rango máximo según la cantidad de canales
          },
          accessibility: {
            screenReaderSection: {
                beforeChartFormat: '<{headingTagName}>{chartTitle}</{headingTagName}><div>{chartSubtitle}</div><div>{chartLongdesc}</div><div>{xAxisDescription}</div><div>{yAxisDescription}</div>'
            }
          },
          exporting: {
            enabled: true
          },
          navigation: {
            buttonOptions: {
              enabled: false
            }
          },
          navigator: {
            maskInside: false
          },
          stockTools: {
            gui: {
              enabled: true,
            }
          },
          tooltip: {
            shared: true,
            valueDecimals: 8
          },
          plotOptions: {
            series: {
                animation: {
                    duration: 1000
                },
                marker: {
                    enabled: false
                },
                lineWidth: 2
            }
          },
          legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
          },
          responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        },
          series: series as Highcharts.SeriesOptionsType[]
        };
        Highcharts.chart('eeg', options);
    } catch (error) {
      console.error('Error al procesar los datos EEG normalizados:', error);
    }
  }

  // Función para cargar los datos EEG y procesarlos para mostrarlos en Highcharts
  cargarDatosEEG(): void {
    console.log('cargarDatosEEG psd');
    if (this.idSesion) {
      this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
        next: (response: any) => {
          console.log('Datos EEG:', response);
          if (response.normalized_eegs && response.normalized_eegs.length > 0) {
            const dataPSDString = response.normalized_eegs[0].data_psd;
            try {
              const dataPSDArray: EEGDataPSD[] = JSON.parse(dataPSDString);
              console.log('Datos PSD en JSON:', dataPSDArray);
              this.procesarYMostrarDatosPSD(dataPSDArray);
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

  // Función para procesar los datos EEG y mostrarlos usando Highcharts
  procesarYMostrarDatosPSD(dataPSDArray: EEGDataPSD[]): void {
    // Hay que asegurarse de que 'dataPSD' está en el formato correcto para Highcharts, por ejemplo, dataPSD podría ser algo así:
    // [
    //   { name: "Canal 1", data: [...], pointStart: frecuenciaInicial, pointInterval: intervaloEntreFrecuencias },
    //   { name: "Canal 2", data: [...], pointStart: frecuenciaInicial, pointInterval: intervaloEntreFrecuencias },
    //   ...
    // ]
    // Transforma los datos PSD en series para Highcharts
    const series = dataPSDArray.map((channelData) => {
      // Mapea los datos de cada canal a un formato de puntos que Highcharts pueda entender
      const dataPoints = channelData.data.map((value, index) => ({
        x: channelData.pointStart + (index * channelData.pointInterval),
        y: value
      }));
      // Devuelve un objeto que corresponde a la estructura de serie de Highcharts
      return {
        name: channelData.name,
        data: dataPoints,
        pointStart: channelData.pointStart, // Esto se coloca fuera del map de los datos
        pointInterval: channelData.pointInterval // Esto también se coloca fuera
      };
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
      series: series as SeriesOptionsType[]
    };
    Highcharts.chart('processed', options);
  }

  cargarDatosSTFT(): void {
    if (this.idSesion) {
      this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
        next: (response) => {
          console.log('Datos STFT recibidos:', response);
          if (response.normalized_eegs && response.normalized_eegs.length > 0) {
            const stftData = JSON.parse(response.normalized_eegs[0].data_stft);
            console.log('Datos STFT:', stftData);
            const channelData = stftData.find((d: any) => d.name === 'Fp1'); // Encuentra los datos del canal Fp1
            console.log('Datos del canal Fp1:', channelData);
            if (channelData) {
              console.log('Datos STFT para el canal Fp1:', channelData);
              this.renderSpectrogram(channelData);
            } else {
              console.error('Canal Fp1 no encontrado en los datos STFT.');
            }
          } else {
            console.error('No se encontraron datos STFT para esta sesión.');
          }
        },
        error: (error) => console.error('Error al obtener datos STFT:', error)
      });
    } else {
      console.error('ID de sesión es nulo');
    }
  }

  renderSpectrogram(channelData: any): void {
    console.log('Datos del canal para el espectrograma dentro de renderS:', channelData);
    if (!channelData) {
      console.error('No data available to render.');
      return;
    }
    // Configuración de dimensiones y márgenes para el gráfico
    const margin = { top: 20, right: 20, bottom: 30, left: 50 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;
      console.log('Margin', margin)
    // Eliminar cualquier gráfico anterior
    d3.select('#spectrogramDiv').select('svg').remove();
    // Crear elemento SVG y configurar dimensiones
    const svg = d3.select('spectrogramDiv')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      console.log('svg',svg)
    const timesExtent = d3.extent(channelData.times) as unknown as [number, number];
    const frequenciesExtent = d3.extent(channelData.frequencies) as unknown as [number, number];
    console.log('T',timesExtent)
    console.log('F',frequenciesExtent)
    // Escalas para los ejes X e Y
    const x = d3.scaleLinear()
      .domain(timesExtent)
      .range([0, width]);
    const y = d3.scaleLinear()
      .domain(frequenciesExtent) // Asumiendo que channelData.frequencies es un array con las frecuencias
      .range([height, 0]);
      console.log('x',x)
      console.log('y',y)
    // Eje X y Eje Y
    svg.append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x));
    svg.append('g')
      .call(d3.axisLeft(y));
    // Mapeo de los datos a rectángulos para el espectrograma
    const rectWidth = width / channelData.times.length;
    const rectHeight = height / channelData.frequencies.length;
    console.log('width', rectWidth)
    console.log('height', rectHeight)
    svg.selectAll()
      .data(channelData.magnitude_squared)
      .enter()
      .append('rect')
      .attr('x', (_d, i) => x(channelData.times[Math.floor(i / channelData.frequencies.length)]))
      .attr('y', (_d, i) => y(channelData.frequencies[i % channelData.frequencies.length]))
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('fill', d => d3.interpolateInferno(Number(d)));
  }

  cargarPSDAreaBandas(idSesion: number, areaSeleccionada: string): void {
    this.eegService.obtenerDataAreaBandasPSD(idSesion).subscribe({
      next: (response: any[]) => {
        const datosPSDBandas = response[0];
        console.log('Datos de Áreas de Bandas PSD:', datosPSDBandas);
        if (datosPSDBandas && datosPSDBandas.length > 0) {
          console.log('Tipo del primer elemento del array real:', typeof datosPSDBandas[0]);
          console.log('Primer elemento para verificar estructura:', datosPSDBandas[0]);
        }
        const datosFiltrados = datosPSDBandas.filter((dato: { hasOwnProperty: (arg0: string) => any; area: string; }) => {
          const hasArea = dato.hasOwnProperty('area');
          console.log('Tiene propiedad "area"?', hasArea, 'Comparando', dato.area, 'con', areaSeleccionada);
          return hasArea && dato.area === areaSeleccionada;
        });
        console.log('Datos de Áreas de Bandas PSD FILTRADOS:', datosFiltrados);
        this.procesarYMostrarPSDAreaBandas(datosFiltrados);
      },
      error: (error) => console.error('Error al obtener datos de Áreas de Bandas PSD:', error)
    });
  }

  procesarYMostrarPSDAreaBandas(bandas: EEGDataBand[]): void {
    bandas.forEach(banda => {
      const options: Highcharts.Options = {
        chart: {
          type: 'line',
          renderTo: `banda${banda.banda}`
        },
        title: {
          text: `Densidad Espectral de Potencia para ${banda.banda}`
        },
        xAxis: {
          title: {
            text: 'Frecuencia (Hz)'
          }
        },
        yAxis: {
          title: {
            text: 'Potencia (dB/Hz)'
          }
        },
        series: [{
          type: 'line',
          name: banda.banda,
          data: banda.data.map((value, index) => [banda.pointStart + index * banda.pointInterval, value])
        }]
      };
      Highcharts.chart(options);
    });
  }

  cargarPRAreaBandas(idSesion: number, areaSeleccionada: string): void {
    this.eegService.obtenerDataAreaBandasPR(idSesion).subscribe({
      next: (response: any[]) => {
        const datosPRBandas = response[0];
        console.log('Datos de Áreas de Bandas PR:', datosPRBandas);
        if (datosPRBandas && datosPRBandas.length > 0) {
          console.log('Tipo del primer elemento del array real:', typeof datosPRBandas[0]);
          console.log('Primer elemento para verificar estructura:', datosPRBandas[0]);
        }
        const datosFiltrados = datosPRBandas.filter((dato: { hasOwnProperty: (arg0: string) => any; area: string; }) => {
          const hasArea = dato.hasOwnProperty('area');
          console.log('Tiene propiedad "area"?', hasArea, 'Comparando', dato.area, 'con', areaSeleccionada);
          return hasArea && dato.area === areaSeleccionada;
        });
        console.log('Datos de Áreas de Bandas PR FILTRADOS:', datosFiltrados);
        this.procesarYMostrarPRAreaBandas(datosFiltrados);
      },
      error: (error) => console.error('Error al obtener datos de Áreas de Bandas PR:', error)
    });
  }

  procesarYMostrarPRAreaBandas(bandas: EEGDataBand[]): void {
    bandas.forEach(banda => {
      const options: Highcharts.Options = {
        chart: {
          type: 'column',
          renderTo: `banda${banda.banda}`
        },
        title: {
          text: `Poder Relativo para ${banda.banda}`
        },
        xAxis: {
          title: {
            text: 'Frecuencia (Hz)'
          }
        },
        yAxis: {
          title: {
            text: 'Potencia (dB/Hz)'
          }
        },
        series: [{
          type: 'column',
          name: banda.banda,
          data: banda.data.map((value, index) => [banda.pointStart + index * banda.pointInterval, value])
        }]
      };
      Highcharts.chart(options);
    });
  }

  cargarCaracteristicas(): void {
    if (this.idSesion) {
      this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
        next: (response: any) => {
          console.log('Datos caracteristicas:', response);
          if (response.normalized_eegs.length > 0) {
            const caracteristicasString = response.normalized_eegs[0].caracteristicas;
            this.caracteristicas = JSON.parse(caracteristicasString)[0].map((num: number) =>
              parseFloat((num * 100).toFixed(1))
            );
          }
        },
        error: (error: any) => console.error('Error al obtener datos de EEG:', error)
      });
    } else {
      console.error('ID de sesión es nulo');
    }
  }

  cargarDatosNormalizedEEGConAnomalias(): void {
    if (this.idSesion) {
      this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
        next: (response) => {
          if (response.normalized_eegs && response.normalized_eegs.length > 0) {
            const dataNormalizedString = response.normalized_eegs[0].data_areas;
            try {
              const dataNormalized = JSON.parse(dataNormalizedString);
              const anomalies = this.detectAnomalies(dataNormalized);
              this.procesarYMostrarDatosNormalizedEEGConAnomalias(dataNormalized, anomalies);
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

  detectAnomalies(dataNormalized: EEGDataArea[], threshold: number = 3): EEGAnomaly[] {
    const anomalies: EEGAnomaly[] = [];
    dataNormalized.forEach((areaData) => {
      const mean = areaData.data.reduce((a, b) => a + b, 0) / areaData.data.length;
      const stdDev = Math.sqrt(areaData.data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / areaData.data.length);
      areaData.data.forEach((value, index) => {
        if (Math.abs(value - mean) > threshold * stdDev) {
          anomalies.push({
            index: index,
            value: value,
            area: areaData.area,
          });
        }
      });
    });
    return anomalies;
  }

  procesarYMostrarDatosNormalizedEEGConAnomalias(dataNormalized: EEGDataArea[], anomalies: EEGAnomaly[] = []): void {
    try {
      console.log('Datos EEG normalizados:', dataNormalized);
      const areas = dataNormalized.map(areaData => areaData.area);
      const data = dataNormalized.map(areaData => areaData.data);
      let maxAmplitude = Number.MIN_SAFE_INTEGER;
      let minAmplitude = Number.MAX_SAFE_INTEGER;
      data.forEach(areaData => {
        maxAmplitude = Math.max(maxAmplitude, ...areaData);
        minAmplitude = Math.min(minAmplitude, ...areaData);
      });
      const amplitudeRange = maxAmplitude - minAmplitude;
      const offset = amplitudeRange * 0.5;
      const extraPadding = 0.2;
      const series = areas.map((area, index) => {
        const anomalyData = anomalies
          .filter(anomaly => anomaly.area === area)
          .map(anomaly => ({ x: anomaly.index, y: anomaly.value + offset * index }));
        return {
          type: 'line',
          name: area,
          data: data[index].map((point, i) => [i, point + offset * index]),
          marker: {
            enabled: false
          },
          dataLabels: {
            enabled: true,
            useHTML: true,
            formatter: function(): any {
              const anomaly = anomalyData.find(anomaly => anomaly.x === this.x);
              return anomaly ? `<span style="color: black;">●</span>` : null;
            },
            x: 0
          }
        };
      });
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
          text: 'Visualización de Datos EEG Normalizados con Anomalías'
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
              const index = Math.round((this.value as number) / offset);
              return areas[index] || '';
            }
          },
          tickInterval: offset,
          min: -extraPadding,
          max: offset * (areas.length) + extraPadding,
        },
        tooltip: {
          shared: true,
          valueDecimals: 8
        },
        plotOptions: {
          series: {
            animation: {
              duration: 1000
            },
            lineWidth: 2,
          }
        },
        series: series as SeriesOptionsType[]
      };
      Highcharts.chart('eeg_anomaly', options);
    } catch (error) {
      console.error('Error al procesar los datos EEG normalizados:', error);
    }
  }

//----------------------------------------------------------------------------------------------------------------//
//---------------------------------------------- ANOMALIAS POR ÁREA ----------------------------------------------//
//----------------------------------------------------------------------------------------------------------------//

//--------------------------------------------- ANOMALIAS FRONTALES ----------------------------------------------//
  cargarDatosNormalizedEEGConAnomaliasFrontal(): void {
    if (this.idSesion) {
        this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
            next: (response) => {
                if (response.normalized_eegs && response.normalized_eegs.length > 0) {
                    const dataNormalizedString = response.normalized_eegs[0].data_areas;
                    try {
                        const dataNormalized = JSON.parse(dataNormalizedString);
                        console.log('EEG data areas:', dataNormalized);
                        const anomalies = this.detectAnomaliesFrontal(dataNormalized);
                        this.procesarYMostrarDatosNormalizedEEGConAnomaliasFrontal(dataNormalized, anomalies);
                    } catch (error) {
                        console.error('Error al parsear los datos EEG por area Frontal:', error);
                    }
                } else {
                    console.error('No se encontraron EEGs por area para esta sesión.');
                }
            },
            error: (error) => console.error('Error al obtener datos EEG por area Frontal:', error)
        });
    } else {
        console.error('ID de sesión es nulo');
    }
  }

  detectAnomaliesFrontal(dataNormalized: EEGDataArea[], threshold: number = 3): EEGAnomaly[] {
      const anomalies: EEGAnomaly[] = [];
      dataNormalized.forEach((areaData) => {
          const mean = areaData.data.reduce((a, b) => a + b, 0) / areaData.data.length;
          const stdDev = Math.sqrt(areaData.data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / areaData.data.length);
          areaData.data.forEach((value, index) => {
              if (Math.abs(value - mean) > threshold * stdDev) {
                  anomalies.push({
                      index: index,
                      value: value,
                      area: areaData.area,
                  });
              }
          });
      });
      return anomalies;
  }

  procesarYMostrarDatosNormalizedEEGConAnomaliasFrontal(dataNormalized: EEGDataArea[], anomalies: EEGAnomaly[] = []): void {
      try {
          console.log('Datos EEG para area Frontal:', dataNormalized);
          // Filtrar áreas que contengan 'Frontal'
          const areaFrontalData = dataNormalized.filter(area => area.area.includes('Frontal'));
          if (areaFrontalData.length > 0) {
              const frontalAreas = areaFrontalData.map(area => area.area);
              const frontalData = areaFrontalData.map(area => area.data);
              const frontalAnomalies = anomalies.filter(anomaly => anomaly.area.includes('Frontal'));
              this.mostrarGraficoFrontal('eeg_anomaly_frontal', frontalAreas, frontalData, frontalAnomalies);
          } else {
              console.error('No se encontraron áreas "Frontal" en los datos EEG normalizados.');
          }
      } catch (error) {
          console.error('Error al procesar los datos EEG por area Frontal:', error);
      }
  }

  mostrarGraficoFrontal(container: string, areas: string[], data: number[][], anomalies: EEGAnomaly[]): void {
    const series = areas.map((area, index) => {
        const anomalyData = anomalies
            .filter(anomaly => anomaly.area === area)
            .map(anomaly => ({ x: anomaly.index, y: anomaly.value }));
        return {
            type: 'line',
            name: area,
            data: data[index].map((point, i) => [i, point]),
            marker: {
                enabled: false
            },
            dataLabels: {
                enabled: true,
                useHTML: true,
                formatter: function (): any {
                    const anomaly = anomalyData.find(anomaly => anomaly.x === this.x);
                    return anomaly ? `<span style="color: black;">●</span>` : null;
                },
                x: 0
            }
        };
    });

    const options: Options = {
        chart: {
            renderTo: container,
            type: 'line',
            zooming: {
                type: 'x'
            },
            height: 1000
        },
        title: {
            text: 'Visualización de Datos EEG Normalizados con Anomalías - Área Frontal'
        },
        xAxis: {
            title: {
                text: 'Número de Muestra'
            }
        },
        yAxis: {
            title: {
                text: 'Amplitud (µV)'
            }
        },
        tooltip: {
            shared: true,
            valueDecimals: 8
        },
        plotOptions: {
            series: {
                animation: {
                    duration: 1000
                },
                lineWidth: 2,
            }
        },
        series: series as SeriesOptionsType[]
    };
    Highcharts.chart(container, options);
  }

//--------------------------------------------- ANOMALIAS TEMPORALES ---------------------------------------------//
  cargarDatosNormalizedEEGConAnomaliasTemporal(): void {
    if (this.idSesion) {
        this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
            next: (response) => {
                if (response.normalized_eegs && response.normalized_eegs.length > 0) {
                    const dataNormalizedString = response.normalized_eegs[0].data_areas;
                    try {
                        const dataNormalized = JSON.parse(dataNormalizedString);
                        console.log('EEG data areas:', dataNormalized);
                        const anomalies = this.detectAnomaliesTemporal(dataNormalized);
                        this.procesarYMostrarDatosNormalizedEEGConAnomaliasTemporal(dataNormalized, anomalies);
                    } catch (error) {
                        console.error('Error al parsear los datos EEG por area Temporal:', error);
                    }
                } else {
                    console.error('No se encontraron EEGs por area para esta sesión.');
                }
            },
            error: (error) => console.error('Error al obtener datos EEG por area Temporal:', error)
        });
    } else {
        console.error('ID de sesión es nulo');
    }
  }

  detectAnomaliesTemporal(dataNormalized: EEGDataArea[], threshold: number = 3): EEGAnomaly[] {
    const anomalies: EEGAnomaly[] = [];
    dataNormalized.forEach((areaData) => {
        const mean = areaData.data.reduce((a, b) => a + b, 0) / areaData.data.length;
        const stdDev = Math.sqrt(areaData.data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / areaData.data.length);
        areaData.data.forEach((value, index) => {
            if (Math.abs(value - mean) > threshold * stdDev) {
                anomalies.push({
                    index: index,
                    value: value,
                    area: areaData.area,
                });
            }
        });
    });
    return anomalies;
  }

  procesarYMostrarDatosNormalizedEEGConAnomaliasTemporal(dataNormalized: EEGDataArea[], anomalies: EEGAnomaly[] = []): void {
    try {
        console.log('Datos EEG para area Temporal:', dataNormalized);
        // Filtrar áreas que contengan 'Temporal'
        const areaTemporalData = dataNormalized.filter(area => area.area.includes('Temporal'));
        if (areaTemporalData.length > 0) {
            const temporalAreas = areaTemporalData.map(area => area.area);
            const temporalData = areaTemporalData.map(area => area.data);
            const temporalAnomalies = anomalies.filter(anomaly => anomaly.area.includes('Temporal'));
            this.mostrarGraficoTemporal('eeg_anomaly_temporal', temporalAreas, temporalData, temporalAnomalies);
        } else {
            console.error('No se encontraron áreas "Temporal" en los datos EEG normalizados.');
        }
    } catch (error) {
        console.error('Error al procesar los datos EEG por area Temporal:', error);
    }
  }

  mostrarGraficoTemporal(container: string, areas: string[], data: number[][], anomalies: EEGAnomaly[]): void {
    const series = areas.map((area, index) => {
        const anomalyData = anomalies
            .filter(anomaly => anomaly.area === area)
            .map(anomaly => ({ x: anomaly.index, y: anomaly.value }));
        return {
            type: 'line',
            name: area,
            data: data[index].map((point, i) => [i, point]),
            marker: {
                enabled: false
            },
            dataLabels: {
                enabled: true,
                useHTML: true,
                formatter: function (): any {
                    const anomaly = anomalyData.find(anomaly => anomaly.x === this.x);
                    return anomaly ? `<span style="color: black;">●</span>` : null;
                },
                x: 0
            }
        };
    });

    const options: Options = {
        chart: {
            renderTo: container,
            type: 'line',
            zooming: {
                type: 'x'
            },
            height: 1000
        },
        title: {
            text: 'Visualización de Datos EEG Normalizados con Anomalías - Área Temporal'
        },
        xAxis: {
            title: {
                text: 'Número de Muestra'
            }
        },
        yAxis: {
            title: {
                text: 'Amplitud (µV)'
            }
        },
        tooltip: {
            shared: true,
            valueDecimals: 8
        },
        plotOptions: {
            series: {
                animation: {
                    duration: 1000
                },
                lineWidth: 2,
            }
        },
        series: series as SeriesOptionsType[]
    };
    Highcharts.chart(container, options);
  }

//--------------------------------------------- ANOMALIAS CENTRALES ----------------------------------------------//
  cargarDatosNormalizedEEGConAnomaliasCentral(): void {
    if (this.idSesion) {
        this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
            next: (response) => {
                if (response.normalized_eegs && response.normalized_eegs.length > 0) {
                    const dataNormalizedString = response.normalized_eegs[0].data_areas;
                    try {
                        const dataNormalized = JSON.parse(dataNormalizedString);
                        console.log('EEG data areas:', dataNormalized);
                        const anomalies = this.detectAnomaliesCentral(dataNormalized);
                        this.procesarYMostrarDatosNormalizedEEGConAnomaliasCentral(dataNormalized, anomalies);
                    } catch (error) {
                        console.error('Error al parsear los datos EEG por area Central:', error);
                    }
                } else {
                    console.error('No se encontraron EEGs por area para esta sesión.');
                }
            },
            error: (error) => console.error('Error al obtener datos EEG por area Central:', error)
        });
    } else {
        console.error('ID de sesión es nulo');
    }
  }

  detectAnomaliesCentral(dataNormalized: EEGDataArea[], threshold: number = 3): EEGAnomaly[] {
    const anomalies: EEGAnomaly[] = [];
    dataNormalized.forEach((areaData) => {
        const mean = areaData.data.reduce((a, b) => a + b, 0) / areaData.data.length;
        const stdDev = Math.sqrt(areaData.data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / areaData.data.length);
        areaData.data.forEach((value, index) => {
            if (Math.abs(value - mean) > threshold * stdDev) {
                anomalies.push({
                    index: index,
                    value: value,
                    area: areaData.area,
                });
            }
        });
    });
    return anomalies;
  }

  procesarYMostrarDatosNormalizedEEGConAnomaliasCentral(dataNormalized: EEGDataArea[], anomalies: EEGAnomaly[] = []): void {
    try {
        console.log('Datos EEG para area Central:', dataNormalized);
        // Filtrar áreas que contengan 'Central'
        const areaCentralData = dataNormalized.filter(area => area.area.includes('Central'));
        if (areaCentralData.length > 0) {
            const centralAreas = areaCentralData.map(area => area.area);
            const centralData = areaCentralData.map(area => area.data);
            const centralAnomalies = anomalies.filter(anomaly => anomaly.area.includes('Central'));
            this.mostrarGraficoCentral('eeg_anomaly_central', centralAreas, centralData, centralAnomalies);
        } else {
            console.error('No se encontraron áreas "Central" en los datos EEG normalizados.');
        }
    } catch (error) {
        console.error('Error al procesar los datos EEG por area Central:', error);
    }
  }

  mostrarGraficoCentral(container: string, areas: string[], data: number[][], anomalies: EEGAnomaly[]): void {
    const series = areas.map((area, index) => {
        const anomalyData = anomalies
            .filter(anomaly => anomaly.area === area)
            .map(anomaly => ({ x: anomaly.index, y: anomaly.value }));
        return {
            type: 'line',
            name: area,
            data: data[index].map((point, i) => [i, point]),
            marker: {
                enabled: false
            },
            dataLabels: {
                enabled: true,
                useHTML: true,
                formatter: function (): any {
                    const anomaly = anomalyData.find(anomaly => anomaly.x === this.x);
                    return anomaly ? `<span style="color: black;">●</span>` : null;
                },
                x: 0
            }
        };
    });

    const options: Options = {
        chart: {
            renderTo: container,
            type: 'line',
            zooming: {
                type: 'x'
            },
            height: 1000
        },
        title: {
            text: 'Visualización de Datos EEG Normalizados con Anomalías - Área Central'
        },
        xAxis: {
            title: {
                text: 'Número de Muestra'
            }
        },
        yAxis: {
            title: {
                text: 'Amplitud (µV)'
            }
        },
        tooltip: {
            shared: true,
            valueDecimals: 8
        },
        plotOptions: {
            series: {
                animation: {
                    duration: 1000
                },
                lineWidth: 2,
            }
        },
        series: series as SeriesOptionsType[]
    };
    Highcharts.chart(container, options);
  }

//--------------------------------------------- ANOMALIAS PARIETALES ---------------------------------------------//
  cargarDatosNormalizedEEGConAnomaliasParietal(): void {
    if (this.idSesion) {
        this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
            next: (response) => {
                if (response.normalized_eegs && response.normalized_eegs.length > 0) {
                    const dataNormalizedString = response.normalized_eegs[0].data_areas;
                    try {
                        const dataNormalized = JSON.parse(dataNormalizedString);
                        console.log('EEG data areas:', dataNormalized);
                        const anomalies = this.detectAnomaliesParietal(dataNormalized);
                        this.procesarYMostrarDatosNormalizedEEGConAnomaliasParietal(dataNormalized, anomalies);
                    } catch (error) {
                        console.error('Error al parsear los datos EEG por area Parietal:', error);
                    }
                } else {
                    console.error('No se encontraron EEGs por area para esta sesión.');
                }
            },
            error: (error) => console.error('Error al obtener datos EEG por area Parietal:', error)
        });
    } else {
        console.error('ID de sesión es nulo');
    }
  }

  detectAnomaliesParietal(dataNormalized: EEGDataArea[], threshold: number = 3): EEGAnomaly[] {
    const anomalies: EEGAnomaly[] = [];
    dataNormalized.forEach((areaData) => {
        const mean = areaData.data.reduce((a, b) => a + b, 0) / areaData.data.length;
        const stdDev = Math.sqrt(areaData.data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / areaData.data.length);
        areaData.data.forEach((value, index) => {
            if (Math.abs(value - mean) > threshold * stdDev) {
                anomalies.push({
                    index: index,
                    value: value,
                    area: areaData.area,
                });
            }
        });
    });
    return anomalies;
  }

  procesarYMostrarDatosNormalizedEEGConAnomaliasParietal(dataNormalized: EEGDataArea[], anomalies: EEGAnomaly[] = []): void {
    try {
        console.log('Datos EEG para area Parietal:', dataNormalized);
        // Filtrar áreas que contengan 'Parietal'
        const areaParietalData = dataNormalized.filter(area => area.area.includes('Parietal'));
        if (areaParietalData.length > 0) {
            const parietalAreas = areaParietalData.map(area => area.area);
            const parietalData = areaParietalData.map(area => area.data);
            const parietalAnomalies = anomalies.filter(anomaly => anomaly.area.includes('Parietal'));
            this.mostrarGraficoParietal('eeg_anomaly_parietal', parietalAreas, parietalData, parietalAnomalies);
        } else {
            console.error('No se encontraron áreas "Parietal" en los datos EEG normalizados.');
        }
    } catch (error) {
        console.error('Error al procesar los datos EEG por area Parietal:', error);
    }
  }

  mostrarGraficoParietal(container: string, areas: string[], data: number[][], anomalies: EEGAnomaly[]): void {
    const series = areas.map((area, index) => {
        const anomalyData = anomalies
            .filter(anomaly => anomaly.area === area)
            .map(anomaly => ({ x: anomaly.index, y: anomaly.value }));
        return {
            type: 'line',
            name: area,
            data: data[index].map((point, i) => [i, point]),
            marker: {
                enabled: false
            },
            dataLabels: {
                enabled: true,
                useHTML: true,
                formatter: function (): any {
                    const anomaly = anomalyData.find(anomaly => anomaly.x === this.x);
                    return anomaly ? `<span style="color: black;">●</span>` : null;
                },
                x: 0
            }
        };
    });

    const options: Options = {
        chart: {
            renderTo: container,
            type: 'line',
            zooming: {
                type: 'x'
            },
            height: 1000
        },
        title: {
            text: 'Visualización de Datos EEG Normalizados con Anomalías - Área Parietal'
        },
        xAxis: {
            title: {
                text: 'Número de Muestra'
            }
        },
        yAxis: {
            title: {
                text: 'Amplitud (µV)'
            }
        },
        tooltip: {
            shared: true,
            valueDecimals: 8
        },
        plotOptions: {
            series: {
                animation: {
                    duration: 1000
                },
                lineWidth: 2,
            }
        },
        series: series as SeriesOptionsType[]
    };
    Highcharts.chart(container, options);
  }

//-------------------------------------------- ANOMALIAS OCCIPITALES ---------------------------------------------//
  cargarDatosNormalizedEEGConAnomaliasOccipital(): void {
    if (this.idSesion) {
        this.eegService.obtenerEEGPorSesion(this.idSesion).subscribe({
            next: (response) => {
                if (response.normalized_eegs && response.normalized_eegs.length > 0) {
                    const dataNormalizedString = response.normalized_eegs[0].data_areas;
                    try {
                        const dataNormalized = JSON.parse(dataNormalizedString);
                        console.log('EEG data areas:', dataNormalized);
                        const anomalies = this.detectAnomaliesOccipital(dataNormalized);
                        this.procesarYMostrarDatosNormalizedEEGConAnomaliasOccipital(dataNormalized, anomalies);
                    } catch (error) {
                        console.error('Error al parsear los datos EEG por area Occipital:', error);
                    }
                } else {
                    console.error('No se encontraron EEGs por area para esta sesión.');
                }
            },
            error: (error) => console.error('Error al obtener datos EEG por area Occipital:', error)
        });
    } else {
        console.error('ID de sesión es nulo');
    }
  }

  detectAnomaliesOccipital(dataNormalized: EEGDataArea[], threshold: number = 3): EEGAnomaly[] {
    const anomalies: EEGAnomaly[] = [];
    dataNormalized.forEach((areaData) => {
        const mean = areaData.data.reduce((a, b) => a + b, 0) / areaData.data.length;
        const stdDev = Math.sqrt(areaData.data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / areaData.data.length);
        areaData.data.forEach((value, index) => {
            if (Math.abs(value - mean) > threshold * stdDev) {
                anomalies.push({
                    index: index,
                    value: value,
                    area: areaData.area,
                });
            }
        });
    });
    return anomalies;
  }

  procesarYMostrarDatosNormalizedEEGConAnomaliasOccipital(dataNormalized: EEGDataArea[], anomalies: EEGAnomaly[] = []): void {
    try {
        console.log('Datos EEG para area Occipital:', dataNormalized);
        // Filtrar áreas que contengan 'Occipital'
        const areaOccipitalData = dataNormalized.filter(area => area.area.includes('Occipital'));
        if (areaOccipitalData.length > 0) {
            const occipitalAreas = areaOccipitalData.map(area => area.area);
            const occipitalData = areaOccipitalData.map(area => area.data);
            const occipitalAnomalies = anomalies.filter(anomaly => anomaly.area.includes('Occipital'));
            this.mostrarGraficoOccipital('eeg_anomaly_occipital', occipitalAreas, occipitalData, occipitalAnomalies);
        } else {
            console.error('No se encontraron áreas "Occipital" en los datos EEG normalizados.');
        }
    } catch (error) {
        console.error('Error al procesar los datos EEG por area Occipital:', error);
    }
  }

  mostrarGraficoOccipital(container: string, areas: string[], data: number[][], anomalies: EEGAnomaly[]): void {
    const series = areas.map((area, index) => {
        const anomalyData = anomalies
            .filter(anomaly => anomaly.area === area)
            .map(anomaly => ({ x: anomaly.index, y: anomaly.value }));
        return {
            type: 'line',
            name: area,
            data: data[index].map((point, i) => [i, point]),
            marker: {
                enabled: false
            },
            dataLabels: {
                enabled: true,
                useHTML: true,
                formatter: function (): any {
                    const anomaly = anomalyData.find(anomaly => anomaly.x === this.x);
                    return anomaly ? `<span style="color: black;">●</span>` : null;
                },
                x: 0
            }
        };
    });

    const options: Options = {
        chart: {
            renderTo: container,
            type: 'line',
            zooming: {
                type: 'x'
            },
            height: 1000
        },
        title: {
            text: 'Visualización de Datos EEG Normalizados con Anomalías - Área Occipital'
        },
        xAxis: {
            title: {
                text: 'Número de Muestra'
            }
        },
        yAxis: {
            title: {
                text: 'Amplitud (µV)'
            }
        },
        tooltip: {
            shared: true,
            valueDecimals: 8
        },
        plotOptions: {
            series: {
                animation: {
                    duration: 1000
                },
                lineWidth: 2,
            }
        },
        series: series as SeriesOptionsType[]
    };
    Highcharts.chart(container, options);
  }
}
