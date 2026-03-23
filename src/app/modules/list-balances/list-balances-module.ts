import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ListBalancesRoutingModule } from './list-balances-routing-module';
import { ListBalances } from './list-balances/list-balances';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ListBalances],
  imports: [
    CommonModule,
    ListBalancesRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [ ListBalances]
})

export class ListBalancesModule { }
