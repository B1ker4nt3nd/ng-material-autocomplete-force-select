import { NgModule } from '@angular/core';
import { NgxMaterialAutocompleteForceSelectComponent } from './ngx-material-autocomplete-force-select.component';



@NgModule({
  declarations: [
    NgxMaterialAutocompleteForceSelectComponent
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
  exports: [
    NgxMaterialAutocompleteForceSelectComponent
  ]
})
export class NgxMaterialAutocompleteForceSelectModule { }
