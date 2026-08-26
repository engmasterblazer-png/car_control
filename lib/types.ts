export type RecordType =
  | 'troca_oleo'
  | 'pneus'
  | 'manutencao_geral'
  | 'combustivel'

export type OilStatus = 'em_dia' | 'proximo' | 'vencido' | 'sem_registro'

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  troca_oleo: 'Troca de óleo',
  pneus: 'Pneus',
  manutencao_geral: 'Manutenção geral',
  combustivel: 'Combustível',
}

export interface Vehicle {
  id: string
  user_id: string
  model: string
  plate: string
  year: number | null
  km_atual: number
  created_at: string
  updated_at: string
}

export interface VehicleRecord {
  id: string
  vehicle_id: string
  user_id: string
  type: RecordType
  value: number
  km: number
  date: string
  notes: string | null
  created_at: string
}

export interface VehicleAlert {
  vehicle_id: string
  user_id: string
  model: string
  plate: string
  year: number | null
  km_atual: number
  last_oil_km: number | null
  last_oil_date: string | null
  km_since_last_oil: number
  days_since_last_oil: number
  oil_status: OilStatus
}
