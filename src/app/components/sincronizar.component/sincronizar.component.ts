import { Component, OnInit } from '@angular/core';
import { EstadoService } from '../../services/estado.service';
import { AsyncPipe, CommonModule, NgFor } from '@angular/common';
import { Observable, Subject, switchMap, startWith } from 'rxjs';

@Component({
  selector: 'app-sincronizar',
  templateUrl: './sincronizar.component.html',
  styleUrl: './sincronizar.component.scss',
  imports: [NgFor, AsyncPipe, CommonModule],
  standalone: true
})

export class SincronizarComponent 
{

    
}