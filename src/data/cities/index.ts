import type { CityConfig, CityId } from '@/types';
import { beijing } from './beijing';
import { shanghai } from './shanghai';
import { guangzhou } from './guangzhou';
import { shenzhen } from './shenzhen';
import { hangzhou } from './hangzhou';
import { chengdu } from './chengdu';

export const CITIES: Record<CityId, CityConfig> = {
  beijing,
  shanghai,
  guangzhou,
  shenzhen,
  hangzhou,
  chengdu,
};

export const CITY_LIST: CityConfig[] = [beijing, shanghai, guangzhou, shenzhen, hangzhou, chengdu];

export function getCity(id: CityId): CityConfig {
  return CITIES[id];
}
