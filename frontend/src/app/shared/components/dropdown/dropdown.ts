import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { Icon } from '../icon/icon';

export type DropdownOption = {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
};

@Component({
  selector: 'app-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
})
export class Dropdown {
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  readonly label = input.required<string>();
  readonly name = input.required<string>();
  readonly options = input.required<readonly DropdownOption[]>();
  readonly value = input<string>('');
  readonly id = input('');
  readonly placeholder = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly clearable = input(true);
  readonly defaultValue = input<string | null>(null);

  readonly valueChange = output<string>();

  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(0);
  protected readonly menuTop = signal(0);
  protected readonly menuLeft = signal(0);
  protected readonly menuWidth = signal(0);
  protected readonly menuMaxHeight = signal(0);

  protected readonly triggerButton = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly controlContainer = viewChild.required<ElementRef<HTMLDivElement>>('control');

  protected readonly selectId = computed(() => this.id() || `${this.name()}-dropdown`);
  protected readonly labelId = computed(() => `${this.selectId()}-label`);
  protected readonly menuId = computed(() => `${this.selectId()}-menu`);
  protected readonly hintId = computed(() => `${this.selectId()}-hint`);
  protected readonly hasSelection = computed(() => this.selectedOption() !== null);
  protected readonly showClearButton = computed(
    () =>
      this.clearable() &&
      this.hasSelection() &&
      this.value() !== this.defaultValue(),
  );
  protected readonly clearButtonLabel = computed(() => `Clear selected ${this.label()}`);
  protected readonly selectedOption = computed(
    () => this.options().find((option) => option.value === this.value()) ?? null,
  );
  protected readonly displayValue = computed(
    () => this.selectedOption()?.label ?? this.placeholder() ?? 'Select an option',
  );

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        return;
      }

      this.updateMenuPosition();
      queueMicrotask(() => this.focusActiveOption());
    });

    effect((onCleanup) => {
      if (!this.isOpen()) {
        return;
      }

      const reposition = () => this.updateMenuPosition();
      window.addEventListener('resize', reposition);
      document.addEventListener('scroll', reposition, true);
      onCleanup(() => {
        window.removeEventListener('resize', reposition);
        document.removeEventListener('scroll', reposition, true);
      });
    });
  }

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    if (this.isOpen()) {
      this.close(true);
    } else {
      this.open();
    }
  }

  protected open(): void {
    if (this.disabled()) {
      return;
    }

    const options = this.options();
    const selectedIndex = options.findIndex(
      (option) => option.value === this.value() && !option.disabled,
    );
    const nextIndex = selectedIndex >= 0 ? selectedIndex : this.findFirstEnabledIndex(options, 0);

    if (nextIndex >= 0) {
      this.activeIndex.set(nextIndex);
    }

    this.updateMenuPosition();
    this.isOpen.set(true);
  }

  protected close(restoreFocus = false): void {
    this.isOpen.set(false);

    if (restoreFocus) {
      queueMicrotask(() => this.triggerButton().nativeElement.focus());
    }
  }

  protected clearSelection(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.disabled()) {
      return;
    }

    this.valueChange.emit('');
    this.close(true);
  }

  protected selectOption(option: DropdownOption): void {
    if (option.disabled) {
      return;
    }

    this.valueChange.emit(option.value);
    this.close(true);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.open();
        this.moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.open();
        this.setFirstEnabledOption();
        break;
      case 'End':
        event.preventDefault();
        this.open();
        this.setLastEnabledOption();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggle();
        break;
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.close(true);
        }
        break;
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        this.focusActiveOption();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        this.focusActiveOption();
        break;
      case 'Home':
        event.preventDefault();
        this.setFirstEnabledOption();
        this.focusActiveOption();
        break;
      case 'End':
        event.preventDefault();
        this.setLastEnabledOption();
        this.focusActiveOption();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.commitActiveOption();
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close(false);
        break;
    }
  }

  protected setActiveIndex(index: number): void {
    this.activeIndex.set(index);
  }

  protected optionId(index: number): string {
    return `${this.selectId()}-option-${index}`;
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.isOpen()) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && this.hostContains(target)) {
      return;
    }

    this.close(false);
  }

  private commitActiveOption(): void {
    const option = this.options()[this.activeIndex()];
    if (!option || option.disabled) {
      return;
    }

    this.selectOption(option);
  }

  private focusActiveOption(): void {
    const optionButtons = this.optionButtons();
    optionButtons[this.activeIndex()]?.focus();
  }

  private updateMenuPosition(): void {
    const controlRect = this.controlContainer().nativeElement.getBoundingClientRect();
    const viewportPadding = 12;
    const menuWidth = Math.max(0, controlRect.width);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left = Math.min(
      Math.max(controlRect.left, viewportPadding),
      Math.max(viewportPadding, viewportWidth - menuWidth - viewportPadding),
    );
    const top = controlRect.bottom + 6;
    const maxHeight = Math.max(viewportPadding * 2, viewportHeight - top - viewportPadding);

    this.menuLeft.set(left);
    this.menuTop.set(top);
    this.menuWidth.set(menuWidth);
    this.menuMaxHeight.set(maxHeight);
  }

  private optionButtons(): HTMLButtonElement[] {
    return Array.from(this.hostElement.nativeElement.querySelectorAll('[data-dropdown-option]'));
  }

  private moveActive(delta: number): void {
    const options = this.options();
    if (options.length === 0) {
      return;
    }

    let index = this.activeIndex();
    for (let step = 0; step < options.length; step += 1) {
      index = (index + delta + options.length) % options.length;
      if (!options[index]?.disabled) {
        this.activeIndex.set(index);
        return;
      }
    }
  }

  private setFirstEnabledOption(): void {
    const index = this.findFirstEnabledIndex(this.options(), 0);
    if (index >= 0) {
      this.activeIndex.set(index);
    }
  }

  private setLastEnabledOption(): void {
    const index = this.findLastEnabledIndex(this.options(), this.options().length - 1);
    if (index >= 0) {
      this.activeIndex.set(index);
    }
  }

  private findFirstEnabledIndex(options: readonly DropdownOption[], startIndex: number): number {
    for (let index = Math.max(0, startIndex); index < options.length; index += 1) {
      if (!options[index]?.disabled) {
        return index;
      }
    }

    for (let index = 0; index < Math.max(0, startIndex); index += 1) {
      if (!options[index]?.disabled) {
        return index;
      }
    }

    return -1;
  }

  private findLastEnabledIndex(options: readonly DropdownOption[], startIndex: number): number {
    for (let index = Math.min(startIndex, options.length - 1); index >= 0; index -= 1) {
      if (!options[index]?.disabled) {
        return index;
      }
    }

    for (let index = options.length - 1; index > startIndex; index -= 1) {
      if (!options[index]?.disabled) {
        return index;
      }
    }

    return -1;
  }

  private hostContains(target: Node): boolean {
    return this.hostElement.nativeElement.contains(target);
  }
}
