import { AfterViewInit, Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { EstadoService } from '../../../services/estado.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-balances',
  standalone: false,
  templateUrl: './list-balances.html',
  styleUrl: './list-balances.scss',
})
export class ListBalances implements AfterViewInit{

  balances: any[] = []
  private subscription!: Subscription
  view:boolean = true

  ngAfterViewInit() {
    this.cd.detectChanges();
  }
  /**
   *
   */
  constructor(private service: EstadoService, private cd: ChangeDetectorRef, private router: Router) {
    
    this.service.getEstados();
     this.cd.detectChanges();
    // this.subscription = this.service.balanceChanged.subscribe(balance => {
    //   this.balances = balance
    //});

    // this.router.events.subscribe(()=>{
    //   if(this.router.url !== '/students'){
    //     this.view = false 
    //   }else{
    //     this.view = true
    //   }
    // })
  }
}
