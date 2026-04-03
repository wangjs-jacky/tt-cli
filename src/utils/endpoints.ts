import type { Region, RegionEndpoints } from '../types.js';

/** 区域接口地址映射 */
const ENDPOINTS: Record<Region, RegionEndpoints> = {
  cn: {
    authUrl: 'https://dida365.com/oauth/authorize',
    tokenUrl: 'https://dida365.com/oauth/token',
    apiBase: 'https://dida365.com/api/v2/',
    developerUrl: 'https://developer.dida365.com/app',
  },
  global: {
    authUrl: 'https://ticktick.com/oauth/authorize',
    tokenUrl: 'https://ticktick.com/oauth/token',
    apiBase: 'https://api.ticktick.com/open/v1/',
    developerUrl: 'https://developer.ticktick.com/app',
  },
};

/** 获取指定区域的接口地址 */
export function getEndpoints(region: Region): RegionEndpoints {
  return ENDPOINTS[region];
}
