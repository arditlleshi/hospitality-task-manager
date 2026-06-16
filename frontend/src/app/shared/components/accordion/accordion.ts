import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type AccordionKey = string | number;

export type AccordionItemContext<T> = {
  readonly $implicit: T;
  readonly index: number;
  readonly itemId: AccordionKey;
  readonly open: boolean;
  readonly toggle: () => void;
};

@Component({
  selector: 'app-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './accordion.html',
  styleUrl: './accordion.scss',
})
export class Accordion {
  readonly items = input.required<readonly any[]>();
  readonly headerTemplate = input.required<TemplateRef<AccordionItemContext<any>>>();
  readonly panelTemplate = input.required<TemplateRef<AccordionItemContext<any>>>();
  readonly trackBy = input<(item: any, index: number) => AccordionKey>((_item, index) => index);
  readonly initialOpenId = input<AccordionKey | null>(null);

  protected readonly openItemId = signal<AccordionKey | null>(null);
  protected readonly initialOpenApplied = signal(false);

  protected readonly hasItems = computed(() => this.items().length > 0);

  constructor() {
    effect(() => {
      const initialOpenId = this.initialOpenId();
      if (!this.initialOpenApplied() && this.openItemId() === null && initialOpenId !== null) {
        this.openItemId.set(initialOpenId);
        this.initialOpenApplied.set(true);
      }
    });

    effect(() => {
      const items = this.items();
      const currentOpenId = this.openItemId();

      if (currentOpenId === null) {
        return;
      }

      const exists = items.some((item, index) => this.itemKey(item, index) === currentOpenId);

      if (!exists) {
        this.openItemId.set(null);
      }
    });
  }

  protected itemKey(item: any, index: number): AccordionKey {
    return this.trackBy()(item, index);
  }

  protected triggerId(itemId: AccordionKey): string {
    return `accordion-trigger-${String(itemId)}`;
  }

  protected panelId(itemId: AccordionKey): string {
    return `accordion-panel-${String(itemId)}`;
  }

  protected isOpen(itemId: AccordionKey): boolean {
    return this.openItemId() === itemId;
  }

  protected toggle(itemId: AccordionKey): void {
    this.openItemId.update((current) => (current === itemId ? null : itemId));
  }

  protected contextFor(item: any, index: number): AccordionItemContext<any> {
    const itemId = this.itemKey(item, index);

    return {
      $implicit: item,
      index,
      itemId,
      open: this.isOpen(itemId),
      toggle: () => this.toggle(itemId),
    };
  }
}
