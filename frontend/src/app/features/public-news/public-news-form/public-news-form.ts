import { ChangeDetectionStrategy, Component, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PUBLIC_NEWS_CATEGORIES, PublicNewsCategory } from '../../../core/constants/app.constants';
import { COLOMBIA_DEPARTMENTS } from '../../../core/constants/colombia.constants';
import { publicNewsCategoryKey } from '../../../core/i18n/domain-keys';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { I18nService } from '../../../core/i18n/i18n.service';
import { CreatePublicNewsPayload } from '../../../core/models/public-news.model';
import { PublicNewsService } from '../../../core/services/public-news.service';

@Component({
  selector: 'app-public-news-form',
  imports: [ReactiveFormsModule],
  templateUrl: './public-news-form.html',
  styleUrl: './public-news-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicNewsForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly newsService = inject(PublicNewsService);
  protected readonly t = inject(I18nService).t;
  protected readonly categories = PUBLIC_NEWS_CATEGORIES;
  protected readonly departments = COLOMBIA_DEPARTMENTS;
  protected readonly categoryKey = publicNewsCategoryKey;

  readonly created = output<void>();
  readonly submitting = signal(false);
  readonly feedbackKey = signal<TranslationKey | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    publisherKey: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(180)]],
    summary: ['', [Validators.required, Validators.maxLength(700)]],
    steps: ['', [Validators.required]],
    requirements: [''],
    category: [PublicNewsCategory.EARTHQUAKE, [Validators.required]],
    department: [''],
    municipality: [''],
    sourceName: ['', [Validators.required, Validators.maxLength(160)]],
    sourceUrl: ['', [Validators.required, Validators.pattern(/^https:\/\/.+/)]],
    contactInfo: ['', [Validators.maxLength(300)]],
    publishedAt: [new Date().toISOString().slice(0, 10), [Validators.required]],
    validUntil: [''],
    featured: [false],
  });

  publish(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      this.feedbackKey.set('publicNews.form.invalid');
      return;
    }
    const value = this.form.getRawValue();
    const payload: CreatePublicNewsPayload = {
      title: value.title.trim(),
      summary: value.summary.trim(),
      steps: this.linesOf(value.steps),
      requirements: this.linesOf(value.requirements),
      category: value.category,
      department: value.department,
      municipality: value.municipality.trim(),
      sourceName: value.sourceName.trim(),
      sourceUrl: value.sourceUrl.trim(),
      contactInfo: value.contactInfo.trim(),
      publishedAt: new Date(`${value.publishedAt}T12:00:00-05:00`).toISOString(),
      validUntil: value.validUntil
        ? new Date(`${value.validUntil}T23:59:59-05:00`).toISOString()
        : undefined,
      featured: value.featured,
    };
    this.submitting.set(true);
    this.feedbackKey.set(null);
    this.newsService.create(payload, value.publisherKey).subscribe({
      next: () => {
        this.submitting.set(false);
        this.feedbackKey.set('publicNews.form.success');
        this.created.emit();
      },
      error: () => {
        this.submitting.set(false);
        this.feedbackKey.set('publicNews.form.error');
      },
    });
  }

  private linesOf(value: string): string[] {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
}
