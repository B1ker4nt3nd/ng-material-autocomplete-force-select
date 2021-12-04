import { FocusMonitor } from '@angular/cdk/a11y';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Self,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormGroup,
  FormBuilder,
  NgControl,
  AbstractControl,
} from '@angular/forms';
import {
  MatFormField,
  MatFormFieldControl,
  MAT_FORM_FIELD,
} from '@angular/material/form-field';
import {
  Observable,
  Subject,
  Subscription,
  startWith,
  debounceTime,
  switchMap,
  catchError,
  of,
} from 'rxjs';
import { InputBaseComponent } from './bases/inputs-base.component';
import { IAutocompleteInputOptions } from './interfaces';
import { ListItemViewModel } from './models/list-item-view.model';
import { IsWarningService } from './services/state-management-services/is-warning.service';

@Component({
  selector: 'ngx-material-autocomplete-force-select',
  templateUrl: './ngx-material-autocomplete-force-select.html',
  styleUrls: ['./ngx-material-autocomplete-force-select.scss'],
  providers: [IsWarningService],
})
export class NgxMaterialAutocompleteForceSelectComponent extends InputBaseComponent {
  filteredItems: Observable<ListItemViewModel[]> = new Observable<
    ListItemViewModel[]
  >();
  @Input() public autocompleteInputOptions: IAutocompleteInputOptions;

  constructor(private isWarningService: IsWarningService) {
    super();
  }

  public get hasWarning(): boolean {
    return this.isWarningService.isWarning;
  }
}

@Component({
  selector: 'internal-autocomplete-force-select-input',
  templateUrl: './internal-autocomplete-force-select-input.html',
  styleUrls: ['./internal-autocomplete-force-select-input.scss'],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: InternalAutoCompleteForceSelectInput,
    },
  ],
  host: {
    '[class.floating]': 'shouldLabelFloat',
    '[id]': 'id',
  },
})
export class InternalAutoCompleteForceSelectInput
  extends InputBaseComponent
  implements
    ControlValueAccessor,
    MatFormFieldControl<number | string | ListItemViewModel>,
    OnInit,
    OnDestroy
{
  static nextId = 0;
  @ViewChild('autocompleteField') autocompleteField: HTMLInputElement;

  filteredItems: Observable<ListItemViewModel[]> = new Observable<
    ListItemViewModel[]
  >();
  @Input() public autocompleteInputOptions: IAutocompleteInputOptions;

  formGroup: FormGroup;
  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  controlType = 'autocomplete-force-select-input';
  id = `autocomplete-force-select-input-${InternalAutoCompleteForceSelectInput.nextId++}`;
  onChange = (_: any) => {};
  onTouched = () => {};
  minLengthForCall = 3;
  lastFilteredItems: ListItemViewModel[] = [];
  sub?: Subscription;
  savedActualViewModel: ListItemViewModel;
  get empty() {
    const {
      value: { autocompleteField },
    } = this.formGroup;

    return !autocompleteField;
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }
  @Input('aria-describedby') userAriaDescribedBy: string;
  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  private _placeholder: string;

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.formGroup.disable() : this.formGroup.enable();
    this.stateChanges.next();
  }
  private _disabled = false;

  @Input()
  get value(): number | string | ListItemViewModel | null {
    return null;
  }
  set value(inValue: number | string | ListItemViewModel | null) {
    const value = inValue ?? '';
    this.formGroup.setValue({ autocompleteField: value });
    this.stateChanges.next();
  }
  get errorState(): boolean {
    return this.formGroup.invalid && this.touched;
  }
  constructor(
    protected formBuilder: FormBuilder,
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl,
    private isWarningService: IsWarningService
  ) {
    super();
    this.formGroup = this.formBuilder.group({
      autocompleteField: [null, []],
    });
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }
  ngOnInit(): void {
    if (
      this.autocompleteInputOptions.minLengthForCall != null ||
      this.autocompleteInputOptions.minLengthForCall != undefined
    ) {
      this.minLengthForCall = this.autocompleteInputOptions.minLengthForCall;
    }
    if (this.formGroup.get('autocompleteField') !== null) {
      this.sub = this.formGroup
        .get('autocompleteField')!
        .valueChanges.pipe(
          startWith(''),
          debounceTime(300),
          switchMap((value: string) => {
            if (typeof value === 'string') {
              if (value && value.trim().length >= this.minLengthForCall) {
                return this.autocompleteInputOptions
                  .filterMethod(value)
                  .pipe(catchError((err) => of([])));
              }
            }
            return of([]); // or of(this.autocompleteList)
          })
        )
        // .subscribe();
        .subscribe((autocompleteList: ListItemViewModel[]) => {
          this.lastFilteredItems = autocompleteList;
          this.filteredItems = of(autocompleteList);
        });
    }
  }
  ngOnDestroy(): void {
    if (!!this.sub) {
      this.sub.unsubscribe();
    }
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }
  onFocusIn(event: FocusEvent) {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }
  displayFn = (item: ListItemViewModel | string | number) => {
    // return this.savedActualViewModel?.display ?? '';
    if (
      this.autocompleteInputOptions.valueShouldBe === 'code' ||
      this.autocompleteInputOptions.valueShouldBe === 'id' ||
      this.autocompleteInputOptions.valueShouldBe === 'display'
    ) {
      return (
        this.lastFilteredItems?.filter(
          (x) => `${x[this.autocompleteInputOptions.valueShouldBe]}` == item
        )[0]?.display || ''
      );
    } else {
      const result = item as ListItemViewModel;
      return !!result ? result.display : '';
    }
  };
  getValue(item: ListItemViewModel) {
    console.log('getvalue: ' + JSON.stringify(item));
    if (this.autocompleteInputOptions.valueShouldBe) {
      if (
        this.autocompleteInputOptions.valueShouldBe === 'code' ||
        this.autocompleteInputOptions.valueShouldBe === 'id' ||
        this.autocompleteInputOptions.valueShouldBe === 'display'
      ) {
        // this.savedActualViewModel = { ...item };
        return item[this.autocompleteInputOptions.valueShouldBe];
      }
    }
    // this.savedActualViewModel = { ...item };
    return item;
  }
  wasSelected(value: ListItemViewModel | string | number) {
    // console.log('wasSelected' + JSON.stringify(value));
    if (
      this.autocompleteInputOptions.valueShouldBe === 'code' ||
      this.autocompleteInputOptions.valueShouldBe === 'id' ||
      this.autocompleteInputOptions.valueShouldBe === 'display'
    ) {
      const item =
        this.lastFilteredItems?.filter(
          (x) => `${x[this.autocompleteInputOptions.valueShouldBe]}` == value
        )[0] ?? null;
      this.savedActualViewModel = { ...item };
    } else {
      this.savedActualViewModel = { ...(value as ListItemViewModel) };
    }
    this.onChange(value);
  }
  _handleInput(control: AbstractControl): void {
    this.onChange(this.value);
  }
  onFocusOut(event: FocusEvent) {
    console.log('on focus out');
    if (
      !this._elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      this.displayWarning();

      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }
  private wasNotSelected() {
    console.log(
      `wasNotSelected ${this.formGroup.get('autocompleteField')!.value} - ${
        this.value
      } - ${JSON.stringify(this.savedActualViewModel)} `
    );
    const theValueInField = this.formGroup.get('autocompleteField')!.value;
    if (!theValueInField) {
      return true;
    }
    return (
      !!theValueInField &&
      typeof theValueInField === 'string' &&
      !this.getValueFromViewModel(theValueInField)
    );
  }
  getValueFromViewModel(theValueInField: string): boolean {
    if (
      (this.autocompleteInputOptions.valueShouldBe === 'code' ||
        this.autocompleteInputOptions.valueShouldBe === 'id' ||
        this.autocompleteInputOptions.valueShouldBe === 'display') &&
      !!this.savedActualViewModel
    ) {
      return (
        this.savedActualViewModel[
          this.autocompleteInputOptions.valueShouldBe
        ] === theValueInField
      );
    } else {
      return false;
    }
  }

  displayWarning() {
    if (this.wasNotSelected()) {
      setTimeout(() => {
        if (this.wasNotSelected()) {
          this.isWarningService.isWarning = true;
          this.formGroup.get('autocompleteField')!.setValue('');
          this.onChange('');
          setTimeout(() => {
            this.isWarningService.isWarning = false;
          }, 1500);
        }
      }, 200);
    }
  }
  // isValidChoice(value: string | null) {
  //   if (
  //     (value && !this.savedActualViewModel) ||
  //     ((value &&
  //       !!this.savedActualViewModel &&
  //       this.savedActualViewModel.display.toLowerCase().toString() !==
  //         value?.toLowerCase().toString()) ??
  //       '')
  //   ) {
  //     return false;
  //   }
  //   return true;
  // }

  public get getPlaceHolder(): string {
    return 'Select one';
  }

  setDescribedByIds(ids: string[]) {
    const controlElement = this._elementRef.nativeElement.querySelector(
      '.internal-autocomplete-input-container'
    )!;
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }
  onContainerClick(event: MouseEvent): void {
    if (this.formGroup.get('autocompleteField')?.valid) {
      this._focusMonitor.focusVia(this.autocompleteField, 'program');
    }
  }
  writeValue(theValue: number | string | ListItemViewModel | null): void {
    this.value = theValue;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  autofilled?: boolean;
  static ngAcceptInputType_disabled: BooleanInput;
  static ngAcceptInputType_required: BooleanInput;
}
