import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
import * as Highcharts from 'highcharts/highstock';
import More from 'highcharts/highcharts-more';
import HC_stock from 'highcharts/modules/stock';
import HC_exporting from 'highcharts/modules/exporting';
import HC_exportData from 'highcharts/modules/export-data';
import IndicatorsCore from 'highcharts/indicators/indicators-all';
import DragPanes from 'highcharts/modules/drag-panes';
import AnnotationsAdvanced from 'highcharts/modules/annotations-advanced';
import PriceIndicator from 'highcharts/modules/price-indicator';
import FullScreen from 'highcharts/modules/full-screen';
import StockTools from 'highcharts/modules/stock-tools';

// Initialize modules
/* More(Highcharts);
HC_stock(Highcharts);
HC_exporting(Highcharts);
HC_exportData(Highcharts);
IndicatorsCore(Highcharts);
DragPanes(Highcharts);
AnnotationsAdvanced(Highcharts);
PriceIndicator(Highcharts);
FullScreen(Highcharts);
StockTools(Highcharts);
 */
interface SeriesOptions {
  name: string;
  data: number[];
  yAxis: number;
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

interface EEGDataPSDArray {
  channelsData: EEGDataPSD[];
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

  // Notas del psicólogo
  isAddingNote: boolean = false;
  notasPsicologo: string = '';
  
  // Eliminar sesion
  isConfirmDelete: boolean = false;
  isDeleted: boolean = false;

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

ngOnInit() {
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

onDeleteSesion(): void {
  if (!this.isConfirmDelete) {
    this.isConfirmDelete = true;
    setTimeout(() => {
      // Este timeout restablecerá el botón si el usuario no confirma la eliminación
      this.isConfirmDelete = false;
    }, 3000);
  } else {
    if (this.idPaciente && this.idSesion) {
      this.pacienteService.eliminarSesionPorPaciente(this.idPaciente, this.idSesion).subscribe({
        next: () => {
          console.log('Sesion eliminada con éxito.');
          this.isDeleted = true;
          
          // Establece un tiempo para que el estado 'eliminado' se muestre durante un tiempo antes de resetear
          setTimeout(() => {
            // Restablece los estados para volver al texto original del botón 'Eliminar'
            this.isConfirmDelete = false;
            this.isDeleted = false;
            this.getLastSession(this.idPaciente); // Obtener la última sesión aquí o donde sea adecuado
          }, 2000); // Ajusta este tiempo como sea necesario
        },
        error: (error) => {
          console.error('Error al eliminar el paciente:', error);
          this.isConfirmDelete = false;
          // Si no deseas cambiar el botón en caso de error, no cambies isDeleted aquí
        }
      });
    } else {
      console.error('Faltan datos necesarios para la eliminación.');
      // No es necesario cambiar el estado del botón aquí ya que no se confirmó la eliminación
    }
  }
}

getLastSession(idPaciente: number): void {
  console.log('Obteniendo la última sesión para el paciente con ID:', idPaciente);
  this.eegService.obtenerUltimaSesion(idPaciente).subscribe({
    next: (sesion) => {
      if (sesion) {
        console.log('La última sesión es:', sesion);
        // Navega a una página de detalles de la sesión o muestra la información como necesites
        this.router.navigate(['/graficas-paciente', sesion.id_sesion]);
      } else {
        console.log('No se encontró la última sesión para este paciente.');
        // Opcional: maneja el caso de que no haya más sesiones para mostrar
        this.router.navigate(['/lista-pacientes']);
      }
    },
    error: (error) => {
      console.error('Error al obtener la última sesión:', error);
      // Considera manejar este error o mostrar un mensaje al usuario
    }
  });
}

onAgregarNotasClick(): void {
  this.isAddingNote = true; // Muestra el input de texto
}

// Método para guardar las notas del psicólogo
guardarNotasPsicologo(): void {
  if (this.idSesion && this.notasPsicologo.trim()) {
    this.eegService.actualizarNotasPsicologoSesion(this.idSesion, this.notasPsicologo).subscribe({
      next: (response) => {
        console.log(response.mensaje);
        this.isAddingNote = false; // Oculta el input de texto después de guardar
        this.notasPsicologo = ''; // Limpia el input después de guardar
      },
      error: (error) => {
        console.error('Error al actualizar las notas del psicólogo:', error);
      }
    });
  } else {
    console.error('Error: No se proporcionó el ID de la sesión o las notas del psicólogo.');
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
            /* subtitle: {
              text: 'Grafica creada en ...',
              align: 'left'
            },  */
            labels: {
              formatter: function () {
                // Calcula el índice basado en la posición actual y el desplazamiento fijo
                // Esto asume que los canales están igualmente espaciados y el primer canal está en '0'
                const index = Math.round((this.value as number) / offset);
                // Devuelve el nombre del canal o un string vacío si el índice es inválido
                return names[index] || '';
              }
            },
            tickInterval: offset, // Establece un intervalo de tick apropiado
            min: -extraPadding,
            max: offset * (names.length-1) + extraPadding, // Ajusta el rango máximo según la cantidad de canales
          },
          accessibility: {
            screenReaderSection: {
                beforeChartFormat: '<{headingTagName}>{chartTitle}</{headingTagName}><div>{chartSubtitle}</div><div>{chartLongdesc}</div><div>{xAxisDescription}</div><div>{yAxisDescription}</div>'
            }
          },
          exporting: { // Aquí se configura el botón de exportación
            enabled: true // Habilita el botón de exportación
          },
          navigation: {
            buttonOptions: {
              enabled: false
            }
          },
          navigator: {
            maskInside: false
          },
          /* rangeSelector: {
            selected: 1
          }, */
          stockTools: {
            gui: {
              enabled: true, // Deshabilita la GUI por defecto para usar la personalizada
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
      series: series as SeriesOptionsType[]
    };
    Highcharts.chart('processed', options); // Asegúrate de que 'processed' es el ID de tu contenedor en HTML
  }  
}