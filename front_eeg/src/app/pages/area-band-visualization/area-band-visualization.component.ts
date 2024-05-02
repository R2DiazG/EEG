import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { EegService } from '../../services/sesiones/eeg.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-area-band-visualization',
  templateUrl: './area-band-visualization.component.html',
  styleUrl: './area-band-visualization.component.scss'
})
export class AreaBandVisualizationComponent {
  public selectedArea: string = 'Frontal izq';
  public highcharts = Highcharts;
  public charts: { [key: string]: Highcharts.ChartOptions } = {};

  constructor(private http: HttpClient, private eegService: EegService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadData(this.selectedArea);
  }

  loadData(area: string) {
    this.route.paramMap.subscribe(params => {
        const sessionId = +params.get('sessionId'); // Assume session ID is passed as a route parameter
        this.eegService.obtenerEEGPorSesion(sessionId).subscribe((data: any) => {
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

  createChartConfig(title: string, series: any[]): Highcharts.ChartOptions {
    return {
      chart: { type: 'column' },
      title: { text: 'Potencia Relativa de la Banda ' + title },
      series: series
    };
  }

  onAreaChange(event: any) {
    this.selectedArea = event.target.value;
    this.loadData(this.selectedArea);
  }
}