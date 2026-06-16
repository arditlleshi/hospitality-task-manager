import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

import { Icon } from '../icon/icon';

export type DialogTone = 'default' | 'danger';
export type DialogSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog implements OnDestroy {
  private readonly dialogElement = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private bodyOverflow = '';
  private bodyPaddingRight = '';

  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly tone = input<DialogTone>('default');
  readonly size = input<DialogSize>('md');
  readonly closeLabel = input('Close dialog');
  readonly dismissible = input(true);

  readonly closed = output<void>();

  protected readonly dialogId = `dialog-${uniqueId++}`;
  protected readonly titleId = `${this.dialogId}-title`;
  protected readonly descriptionId = `${this.dialogId}-description`;
  protected readonly  = computed(() => (this.tone() === 'danger' ? 'Confirmation' : 'Dialog'));
  protected readonly sizeClass = computed(() => `app-dialog--${this.size()}`);

  constructor() {
    effect(() => {
      const dialogRef = this.dialogElement();
      if (!dialogRef) {
        return;
      }

      const dialog = dialogRef.nativeElement;
      const shouldOpen = this.open();

      if (shouldOpen) {
        this.lockBodyScroll();

        queueMicrotask(() => {
          if (this.open() && !dialog.open) {
            dialog.showModal();
          }
        });

        return;
      }

      this.unlockBodyScroll();

      if (dialog.open) {
        dialog.close();
      }
    });
  }

  ngOnDestroy(): void {
    this.unlockBodyScroll();
  }

  protected onDialogClick(event: MouseEvent): void {
    const dialogRef = this.dialogElement();
    if (dialogRef && event.target === dialogRef.nativeElement) {
      this.requestClose();
    }
  }

  protected onDialogClose(): void {
    this.unlockBodyScroll();

    if (this.open()) {
      this.closed.emit();
    }
  }

  protected requestClose(): void {
    this.closed.emit();
  }

  private lockBodyScroll(): void {
    const documentElement = document.documentElement;
    const body = document.body;

    if (!this.bodyOverflow) {
      this.bodyOverflow = body.style.overflow;
      this.bodyPaddingRight = body.style.paddingRight;
    }

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  private unlockBodyScroll(): void {
    const body = document.body;

    body.style.overflow = this.bodyOverflow;
    body.style.paddingRight = this.bodyPaddingRight;
    this.bodyOverflow = '';
    this.bodyPaddingRight = '';
  }
}

let uniqueId = 0;
