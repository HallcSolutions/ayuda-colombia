import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DigestFindingKind } from '../../../core/constants/app.constants';
import { digestFindingKey, supplyCategoryKey, urgencyKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { MonitoringService } from '../../../core/services/monitoring.service';
import { RegionService } from '../../../core/services/region.service';

/** El panel es un resumen: lo demás vive en el listado de puntos. */
const VISIBLE_POINTS = 4;
const VISIBLE_FINDINGS = 5;

/** Las señales se muestran de la más urgente a la menos, no en el orden en que llegan. */
const FINDING_ORDER: Record<DigestFindingKind, number> = {
  [DigestFindingKind.CRITICAL_STALE]: 0,
  [DigestFindingKind.KITCHEN_WITHOUT_SERVICE]: 1,
  [DigestFindingKind.NO_ACTIVITY]: 2,
  [DigestFindingKind.STATUS_OUTDATED]: 3,
};

@Component({
  selector: 'app-needs-digest',
  imports: [DatePipe, RouterLink],
  templateUrl: './needs-digest.html',
  styleUrl: './needs-digest.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeedsDigestPanel {
  private readonly region = inject(RegionService);
  readonly monitoring = inject(MonitoringService);
  readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly categoryKey = supplyCategoryKey;
  protected readonly severityKey = urgencyKey;
  protected readonly findingKey = digestFindingKey;

  readonly digest = this.monitoring.digest;

  readonly points = computed(() => this.monitoring.pointsNeedingHelp().slice(0, VISIBLE_POINTS));

  readonly findings = computed(() =>
    [...this.monitoring.findings()]
      .sort((first, second) => FINDING_ORDER[first.kind] - FINDING_ORDER[second.kind])
      .slice(0, VISIBLE_FINDINGS),
  );

  /** Cuántas señales quedaron fuera del recorte, para no dar el resumen por completo. */
  readonly hiddenFindings = computed(() =>
    Math.max(0, this.monitoring.findings().length - VISIBLE_FINDINGS),
  );

  /** Con la zona filtrada, los totales nacionales del resumen dejarían de cuadrar. */
  readonly newPoints = computed(() => this.monitoring.newPoints().length);
  readonly activeAlerts = this.monitoring.activeAlerts;
  readonly criticalAlerts = this.monitoring.criticalAlerts;

  readonly hasSomethingToShow = computed(
    () => this.newPoints() > 0 || this.monitoring.pointsNeedingHelp().length > 0,
  );

  constructor() {
    // El resumen es nacional y se recorta por zona en el cliente, así que basta
    // con pedirlo una vez; los siguientes llegan por socket.
    effect(() => {
      this.region.selection();
      if (!this.digest()) this.monitoring.loadDigest();
    });
  }
}
