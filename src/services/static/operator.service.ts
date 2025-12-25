import type { GenesisOperator, QueryOptions, ServiceResult } from '../types';
import type { IGenesisOperatorService } from '../interfaces';

let operatorsCache: GenesisOperator[] | null = null;

async function loadOperators(): Promise<GenesisOperator[]> {
  if (operatorsCache) return operatorsCache;
  
  try {
    const response = await fetch('/data/operators.json');
    const data = await response.json();
    operatorsCache = data.map((o: any) => ({
      ...o,
      created_at: o.created_at || new Date().toISOString(),
      updated_at: o.updated_at || new Date().toISOString(),
    }));
    return operatorsCache!;
  } catch (error) {
    console.error('Failed to load operators.json:', error);
    return [];
  }
}

export class StaticOperatorService implements IGenesisOperatorService {
  async getAll(options?: QueryOptions): Promise<ServiceResult<GenesisOperator[]>> {
    try {
      let operators = await loadOperators();
      
      if (options?.orderBy) {
        operators = [...operators].sort((a: any, b: any) => {
          const aVal = a[options.orderBy!];
          const bVal = b[options.orderBy!];
          if (options.ascending) return aVal > bVal ? 1 : -1;
          return aVal < bVal ? 1 : -1;
        });
      }
      
      if (options?.limit) {
        operators = operators.slice(0, options.limit);
      }
      
      return { data: operators, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getActive(): Promise<ServiceResult<GenesisOperator[]>> {
    try {
      const operators = await loadOperators();
      const active = operators
        .filter(o => o.is_active)
        .sort((a, b) => a.display_order - b.display_order);
      return { data: active, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async create(operator: Partial<GenesisOperator>): Promise<ServiceResult<GenesisOperator>> {
    console.warn('StaticOperatorService.create: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async update(id: string, data: Partial<GenesisOperator>): Promise<ServiceResult<GenesisOperator>> {
    console.warn('StaticOperatorService.update: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    console.warn('StaticOperatorService.delete: Static data cannot be modified');
    return { data: false, error: new Error('Static data cannot be modified') };
  }
}
