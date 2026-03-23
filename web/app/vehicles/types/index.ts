export interface Vehicle {
  id: number;
  prefixo: string;
  placa: string;
  modelo: string | null;
  combustivel: string | null;
  status: string | null;
  created_at: string;
}

export type VehicleFormData = Omit<Vehicle, 'id' | 'created_at'>;