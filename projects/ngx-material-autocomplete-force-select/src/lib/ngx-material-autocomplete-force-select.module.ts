import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  InternalAutoCompleteForceSelectInput,
  NgxMaterialAutocompleteForceSelectComponent,
} from './ngx-material-autocomplete-force-select.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    NgxMaterialAutocompleteForceSelectComponent,
    InternalAutoCompleteForceSelectInput,
  ],
  imports: [
    MatAutocompleteModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  exports: [NgxMaterialAutocompleteForceSelectComponent],
})
export class NgxMaterialAutocompleteForceSelectModule {}
