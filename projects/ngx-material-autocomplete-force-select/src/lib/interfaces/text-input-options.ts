import { Observable } from 'rxjs';
import { ListItemViewModel } from '../models/list-item-view.model';

export interface IInputOptions {
  label: string;
  requiredMessage: string;
  labelClasses: string[];
  inputClasses: string[];
  containerClasses: string[];
  appearance: 'legacy' | 'standard' | 'fill' | 'outline';
}
export interface IAutocompleteInputOptions {
  minLengthForCall?: number;
  valueShouldBe: 'id' | 'code' | 'display';
  filterMethod: (partOfText: string) => Observable<ListItemViewModel[]>;
}
