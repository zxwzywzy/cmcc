// cmcc / app_intents.tsx
// 小组件上的按钮动作 (官方要求全部写在这个文件)

import { AppIntentManager, AppIntentProtocol, Widget } from 'scripting'
import { clearCache } from './mobile/api'

const AppStorage = Storage as unknown as {
  get<T = unknown>(key: string): T | null
  set(key: string, value: unknown): void
}

/** 刷新: 跳过缓存重新查询 */
export const RefreshIntent = AppIntentManager.register({
  name: 'CmccRefreshIntent',
  protocol: AppIntentProtocol.AppIntent,
  perform: async (_params: undefined) => {
    clearCache()
    Widget.reloadAll()
  },
})

/** 多号翻页: 只存一个计数, 小组件按号的个数取余 */
const PAGE_KEY = 'cmcc.page'
export const readPage = () => AppStorage.get<number>(PAGE_KEY) ?? 0

export const PageIntent = AppIntentManager.register({
  name: 'CmccPageIntent',
  protocol: AppIntentProtocol.AppIntent,
  perform: async ({ step }: { step: number }) => {
    AppStorage.set(PAGE_KEY, readPage() + step)
    Widget.reloadAll()
  },
})

/** 号码标签: 直接切到第几个号 */
export const PageSetIntent = AppIntentManager.register({
  name: 'CmccPageSetIntent',
  protocol: AppIntentProtocol.AppIntent,
  perform: async ({ page }: { page: number }) => {
    AppStorage.set(PAGE_KEY, page)
    Widget.reloadAll()
  },
})

// Separate from CMCC account paging so carrier switching never moves a phone tab.
const CARRIER_KEY = 'carrier.hub.selected-provider.v1'
const CARRIERS = ['cmcc', 'unicom', 'telecom', 'broadnet']
export function readCarrier(): string | undefined {
  const value = AppStorage.get<string>(CARRIER_KEY)
  return value && CARRIERS.includes(value) ? value : undefined
}
export const CarrierSetIntent = AppIntentManager.register({
  name: 'CarrierHubSelectProvider',
  protocol: AppIntentProtocol.AppIntent,
  perform: async ({ provider }: { provider: string }) => {
    if (!CARRIERS.includes(provider)) return
    AppStorage.set(CARRIER_KEY, provider)
    Widget.reloadAll()
  },
})
