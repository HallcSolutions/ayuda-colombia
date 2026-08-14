import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  COLOMBIA_DEPARTMENT_SHAPES,
  COLOMBIA_MAP_VIEWBOX,
} from '../../core/constants/colombia-map.constants';

/** Silueta departamental decorativa compartida por las portadas de cada módulo. */
@Component({
  selector: 'app-colombia-watermark',
  templateUrl: './colombia-watermark.html',
  styleUrl: './colombia-watermark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColombiaWatermark {
  protected readonly shapes = COLOMBIA_DEPARTMENT_SHAPES;
  protected readonly viewBox = COLOMBIA_MAP_VIEWBOX;
}
