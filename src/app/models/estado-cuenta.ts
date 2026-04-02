export interface EstadoCuenta {
  banco: string;
  producto: string;
  tarjeta: string;
  clabe: string;
  fechaCorte: string;
  fechaLimitePago: string;
  pagoNoIntereses: number;
  pagoMinimo: number;
  saldoTotal: number;
  limiteCredito: number;
  estadoAlerta: string;
}