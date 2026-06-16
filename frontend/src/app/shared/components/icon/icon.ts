import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName = 'arrow' | 'delete' | 'update' | 'x';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly title = input<string | null>(null);

  protected readonly svgSize = computed(() => `${this.size()}`);
  protected readonly hasTitle = computed(() => Boolean(this.title()));
}
