/*import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { EegService } from '../../services/sesiones/eeg.service';
import { PacienteService } from '../../services/pacientes/paciente.service';
import { ActivatedRoute } from '@angular/router';
import * as Highcharts from 'highcharts';
import { Observable } from 'rxjs';
import Exporting from 'highcharts/modules/exporting';
Exporting(Highcharts);

@Component({
  selector: 'app-area-band-visualization',
  templateUrl: './area-band-visualization.component.html',
  styleUrl: './area-band-visualization.component.scss'
})
export class AreaBandVisualizationComponent {
  public selectedArea: string = 'Frontal izq';
  public highcharts = Highcharts;
  public charts: { [key: string]: Highcharts.ChartOptions } = {};
  @Input() id_sesion!: number;
  id_paciente?: number;
  paciente: any;

  constructor(private http: HttpClient, private EegService: EegService, private route: ActivatedRoute, private pacienteService: PacienteService) {}

  ngOnInit() {
    this.loadData(this.selectedArea);
    console.log(`ID de la sesion recibido: ${this.id_sesion}`);
  }

  cargarDetallesPaciente(): void {
    const id_sesion = this.route.snapshot.paramMap.get('id_sesion');
    console.log(this.route.params)
    if(id_sesion) {
      this.obtenerPacienteEnBaseASesion(+id_sesion).subscribe({
        next: (id_paciente: any) => {
          console.log('Id del paciente:', id_paciente);
          this.pacienteService.obtenerDetallesPaciente(id_paciente).subscribe({
            next: (data: any) => {
              console.log('Detalles del paciente:', data);
              this.paciente = data;
            },
    
            error: (error: any) => {
              console.error('Error al obtener los detalles del paciente', error);
            }
          });
        },
        error: (error: any) => {
          console.error('Error al obtener los detalles del paciente', error);
        }
      });
      
    } else {
      console.error('ID de paciente no encontrado en la ruta');
    }
  }

  obtenerPacienteEnBaseASesion(idSesion: number): Observable<any> {
    return this.EegService.obtener_paciente_en_base_a_sesion(idSesion);
  }

  loadData(area: string) {
    this.route.paramMap.subscribe(params => {
        this.EegService.obtenerEEGPorSesion(this.id_sesion).subscribe((data: any) => {
            const datosPorBanda = {
                'Delta': [],
                'Theta': [],
                'Alpha': [],
                'Beta': [],
                'Gamma': []
            };
            data.data_area_bandas_psd.forEach((item: { area: string; banda: string | number; canal: any; data: any; }) => {
              if (item.area === area) {
                (datosPorBanda as any)[item.banda].push({
                  name: item.canal,
                  data: item.data
                });
              }
            });
            this.charts['Delta'] = this.createChartConfig('Delta', datosPorBanda['Delta']);
            this.charts['Theta'] = this.createChartConfig('Theta', datosPorBanda['Theta']);
            this.charts['Alpha'] = this.createChartConfig('Alpha', datosPorBanda['Alpha']);
            this.charts['Beta'] = this.createChartConfig('Beta', datosPorBanda['Beta']);
            this.charts['Gamma'] = this.createChartConfig('Gamma', datosPorBanda['Gamma']);
        });
    });
}

 /*createChartConfig(title: string, series: any[]): Highcharts.ChartOptions {
    return {
      title: { text: 'Potencia Relativa de la Banda ' + title },
      series: series
    };
  }
  
  createChartConfig(title: string, series: Highcharts.SeriesOptionsType[]): Highcharts.Options {
    return {
        chart: {
            type: 'column',
            zooming: {
              type: 'x'
            },
        },
        title: {
            text: 'Potencia Relativa de la Banda ' + title
        },
        series: series
    };
}

  onAreaChange(event: any) {
    this.selectedArea = event.target.value;
    this.loadData(this.selectedArea);
  }
}*/
/*import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as Highcharts from 'highcharts';
import Exporting from 'highcharts/modules/exporting';
import { Observable, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { EegService } from '../../services/sesiones/eeg.service';
import { PacienteService } from '../../services/pacientes/paciente.service';

Exporting(Highcharts); // Enables exporting features for Highcharts

@Component({
  selector: 'app-area-band-visualization',
  templateUrl: './area-band-visualization.component.html',
  styleUrls: ['./area-band-visualization.component.scss']
})
export class AreaBandVisualizationComponent implements OnDestroy {
  @Input() id_sesion!: number;
  public selectedArea: string = 'Frontal izq';
  public highcharts = Highcharts;
  public charts: { [key in BandType]: Highcharts.Options } = {
    Delta: {},
    Theta: {},
    Alpha: {},
    Beta: {},
    Gamma: {}
  };
  private destroy$ = new Subject<void>();
  id_paciente?: number;
  paciente: any;

  constructor(
    private route: ActivatedRoute,
    private EegService: EegService,
    private pacienteService: PacienteService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const idSesion = +params.get('id_sesion')!;
        if (idSesion) {
          return this.EegService.obtenerEEGPorSesion(idSesion);
        } else {
          throw new Error('ID de sesión no encontrado');
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.loadData(this.selectedArea);
    }, error => {
      console.error('Error loading EEG data:', error);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(area: string): void {
    this.EegService.obtenerEEGPorSesion(this.id_sesion).subscribe((data: any) => {
      const datosPorBanda: { [key in BandType]: any[] } = {
          Delta: [],
          Theta: [],
          Alpha: [],
          Beta: [],
          Gamma: []
      };
      data.data_area_bandas_psd.forEach((item: { area: string; banda: BandType; canal: any; data: any; }) => {
        if (item.area === area) {
          datosPorBanda[item.banda].push({
            name: item.canal,
            data: item.data
          });
        }
      });
      Object.keys(datosPorBanda).forEach(banda => {
        this.charts[banda as BandType] = this.createChartConfig(banda as BandType, datosPorBanda[banda as BandType]);
      });
    });
  }

  createChartConfig(title: BandType, series: Highcharts.SeriesOptionsType[]): Highcharts.Options {
    return {
      chart: {
        type: 'column',
        zooming: {
          type: 'x'
        },
      },
      title: {
        text: 'Potencia Relativa de la Banda ' + title
      },
      series: series
    };
  }

  onAreaChange(event: any): void {
    this.selectedArea = event.target.value;
    this.loadData(this.selectedArea);
  }
}

// Define a type for the band names
type BandType = 'Delta' | 'Theta' | 'Alpha' | 'Beta' | 'Gamma';*/
/*import { Component, Inject, Input, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as Highcharts from 'highcharts';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { EegService } from '../../services/sesiones/eeg.service';
import { PacienteService } from '../../services/pacientes/paciente.service';

@Component({
  selector: 'app-area-band-visualization',
  templateUrl: './area-band-visualization.component.html',
  styleUrls: ['./area-band-visualization.component.scss']
})
export class AreaBandVisualizationComponent implements OnDestroy {
  @Input() id_sesion!: number;
  public selectedArea: string = 'Frontal izq';
  public highcharts = Highcharts;
  public charts: { [key in BandType]: Highcharts.Options } = {
    Delta: {},
    Theta: {},
    Alpha: {},
    Beta: {},
    Gamma: {}
  };
  public chartKeys: BandType[] = ['Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'];
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private EegService: EegService,
    private pacienteService: PacienteService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      // Dynamically import the exporting module only on the client side
      import('highcharts/modules/exporting').then(module => {
        module.default(Highcharts);
      });
    }
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const idSesion = +params.get('id_sesion')!;
        if (idSesion) {
          return this.EegService.obtenerEEGPorSesion(idSesion);
        } else {
          throw new Error('ID de sesión no encontrado');
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.loadData(this.selectedArea);
    }, error => {
      console.error('Error loading EEG data:', error);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(area: string): void {
    this.EegService.obtenerEEGPorSesion(this.id_sesion).subscribe((data: any) => {
      const datosPorBanda: { [key in BandType]: any[] } = {
          Delta: [],
          Theta: [],
          Alpha: [],
          Beta: [],
          Gamma: []
      };
      data.data_area_bandas_psd.forEach((item: { area: string; banda: BandType; canal: any; data: any; }) => {
        if (item.area === area) {
          datosPorBanda[item.banda].push({
            name: item.canal,
            data: item.data
          });
        }
      });
      this.chartKeys.forEach(banda => {
        this.charts[banda] = this.createChartConfig(banda, datosPorBanda[banda]);
      });
    });
  }

  createChartConfig(title: BandType, series: Highcharts.SeriesOptionsType[]): Highcharts.Options {
    return {
      chart: {
        type: 'column',
        zooming: {
          type: 'x'
        },
      },
      title: {
        text: 'Potencia Relativa de la Banda ' + title
      },
      series: series
    };
  }

  onAreaChange(event: any): void {
    this.selectedArea = event.target.value;
    this.loadData(this.selectedArea);
  }
}

// Define a type for the band names
type BandType = 'Delta' | 'Theta' | 'Alpha' | 'Beta' | 'Gamma';
*/
/*
import { Component, OnInit, Input } from '@angular/core';
import { EegService } from '../../services/sesiones/eeg.service';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-area-band-visualization',
  templateUrl: './area-band-visualization.component.html',
  styleUrls: ['./area-band-visualization.component.scss']
})
export class AreaBandVisualizationComponent implements OnInit {
  selectedArea: string = 'Frontal izq';
  @Input() id_sesion!: number;

  constructor(private eegService: EegService) {}

  ngOnInit(): void {
    this.loadEegData(this.id_sesion);
  }

  loadEegData(id_sesion: number): void {
    this.eegService.obtenerDataAreaBandasPSD(id_sesion).subscribe((dataAreasBandasPsd: any[]) => {
      dataAreasBandasPsd.forEach((data: any) => {
        console.log('Data AREA BANDAS PSD:', data);
        this.createCharts(data);
      });
    });
  }

  createCharts(datosPorBanda: { [x: string]: any; }): void {
    // Clear existing charts if needed
    Highcharts.chart('deltaChart', this.createChartConfig('Delta', datosPorBanda['Delta']));
    Highcharts.chart('thetaChart', this.createChartConfig('Theta', datosPorBanda['Theta']));
    Highcharts.chart('alphaChart', this.createChartConfig('Alpha', datosPorBanda['Alpha']));
    Highcharts.chart('betaChart', this.createChartConfig('Beta', datosPorBanda['Beta']));
    Highcharts.chart('gammaChart', this.createChartConfig('Gamma', datosPorBanda['Gamma']));
  }

  createChartConfig(title: string, series: any[]): any {
    return {
      chart: { type: 'line' },
      title: { text: 'PSD de la Banda ' + title },
      series: [{ name: title, data: series.map((item: { data: any; }) => item.data) }]
    };
  }
}
*/
import { Component, OnInit, Input, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { EegService } from '../../services/sesiones/eeg.service';
import * as Highcharts from 'highcharts';
import Exporting from 'highcharts/modules/exporting';

// Define the type for the EEG data bands
interface EEGDataBand {
  area: string;
  banda: string;
  data: number[];
  pointStart: number;
  pointInterval: number;
}

// Enable Highcharts exporting module
Exporting(Highcharts);

@Component({
  selector: 'app-area-band-visualization',
  templateUrl: './area-band-visualization.component.html',
  styleUrls: ['./area-band-visualization.component.scss']
})
export class AreaBandVisualizationComponent implements OnInit, AfterViewInit {
  @Input() id_sesion!: number;
  public selectedArea: string = 'Frontal izq';
  public readyToRender: boolean = false; // Controls rendering of Highcharts

  constructor(private eegService: EegService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.readyToRender = false;
  }

  ngAfterViewInit(): void {
    this.readyToRender = true;
    this.cdr.detectChanges(); // Manually trigger change detection
    this.loadEegData(this.id_sesion);
  }

  loadEegData(id_sesion: number): void {
    this.eegService.obtenerDataAreaBandasPSD(id_sesion).subscribe(dataAreasBandasPsd => {
      const groupedData = this.groupDataByBand(dataAreasBandasPsd);
      Object.keys(groupedData).forEach(band => {
        this.createChart(band, groupedData[band]);
      });
    });
  }

  groupDataByBand(data: EEGDataBand[]): Record<string, EEGDataBand[]> {
    return data.reduce((acc, item) => {
      if (!acc[item.banda]) {
        acc[item.banda] = [];
      }
      acc[item.banda].push(item);
      return acc;
    }, {} as Record<string, EEGDataBand[]>);
  }

  createChart(band: string, data: EEGDataBand[]): void {
    const chartId = `${band.toLowerCase()}Chart`;
    if (document.getElementById(chartId)) { // Ensure the element exists in the DOM
      Highcharts.chart(chartId, this.createChartConfig(band, data));
    }
  }

  createChartConfig(title: string, data: EEGDataBand[]): Highcharts.Options {
    return {
      chart: {
        type: 'line' // Specify the type of chart
      },
      title: {
        text: `Potencia Relativa de la Banda ${title}`
      },
      series: [{
        type: 'line', // Explicitly define the series type
        name: title,
        data: data.map(item => item.data),
        pointStart: data[0]?.pointStart,
        pointInterval: data[0]?.pointInterval
      }] as Highcharts.SeriesOptionsType[] // Cast to SeriesOptionsType if necessary
    };
  }

  onAreaChange(event: any): void {
    this.selectedArea = event.target.value;
    this.loadEegData(this.id_sesion);
  }
}
