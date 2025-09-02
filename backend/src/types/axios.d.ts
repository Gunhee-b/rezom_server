import 'axios'

declare module 'axios' {
  export interface InternalAxiosRequestConfig<D = any> {
    /** 커스텀: 인터셉터에서 refresh 재시도를 건너뛰기 위한 플래그 */
    _noRefresh?: boolean
  }
}
