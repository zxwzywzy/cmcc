export type Place = { name: string; address: string; latitude: number; longitude: number }

// 武胜周边搜索窗口（闭区间，不代表行政边界）。请求与结果过滤共用此范围。
const bounds = { south: 30.08, north: 30.56, west: 105.93, east: 106.48 }
const { south, north, west, east } = bounds
const region = {
  center: { latitude: (south + north) / 2, longitude: (west + east) / 2 },
  span: { latitudeDelta: north - south, longitudeDelta: east - west },
}
const clean = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ')

/** 空白查询不发请求；地图服务拒绝时向调用方传播，不伪装成空列表。 */
export async function searchPlaces(query: string): Promise<Place[]> {
  if (typeof query !== 'string') throw new TypeError('地点关键词必须是字符串')
  const keyword = clean(query)
  if (!keyword) return []
  if (Array.from(keyword).length > 128) throw new RangeError('地点关键词不能超过 128 个字符')

  const items = await MapSearch.locate({ query: keyword, region })
  const places: Place[] = []
  const seen = new Set<string>()
  for (const item of items) {
    const { latitude, longitude } = item.coordinate
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < south || latitude > north || longitude < west || longitude > east) continue
    const address = clean(item.formattedAddress ?? '')
    const name = clean(item.name ?? '') || address
    if (!name) continue
    // 同名且落在相同四位小数坐标格的结果只留首条；输出仍保留原始精度。
    const key = JSON.stringify([name.toLowerCase(), latitude.toFixed(4), longitude.toFixed(4)])
    if (seen.has(key)) continue
    seen.add(key)
    places.push({ name, address, latitude, longitude })
  }
  return places
}
