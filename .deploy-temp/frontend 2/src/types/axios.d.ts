// src/types/axios.d.ts
import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /**
     * refresh token 갱신 로직을 우회할지 여부
     */
    _noRefresh?: boolean;
  }
}
