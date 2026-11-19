package com.zxwzywzy.tonglingbus

import org.json.JSONArray
import org.json.JSONObject

data class Route(val id: String, val name: String, val direction: Int, val start: String,
    val end: String, val first: String = "", val last: String = "") {
    fun json() = JSONObject().put("id", id).put("name", name).put("direction", direction)
        .put("start", start).put("end", end).put("first", first).put("last", last)
    companion object {
        fun from(j: JSONObject) = Route(j.getString("id"), j.getString("name"), j.getInt("direction"),
            j.optString("start"), j.optString("end"), j.optString("first"), j.optString("last"))
        fun api(j: JSONObject): Route {
            val direction = j.getInt("Direction")
            return Route(j.getString("LineId"), j.optString("AliasName"), direction,
                j.optString("StartPoint"), j.optString("EndPoint"),
                j.optString(if (direction == 1) "MainFirstTime" else "SubFirstTime"),
                j.optString(if (direction == 1) "MainLastTime" else "SubLastTime"))
        }
    }
}
data class Stop(val id: String, val name: String)
data class Bus(val plate: String, val stopId: String, val operating: Boolean)
data class Watch(val route: Route, val stop: Stop, val ordinal: Int) {
    val key: String get() = "${route.id}:${route.direction}:${stop.id}:$ordinal"
    fun json() = JSONObject().put("route", route.json()).put("stopId", stop.id)
        .put("stopName", stop.name).put("ordinal", ordinal)
    companion object {
        fun from(j: JSONObject) = Watch(Route.from(j.getJSONObject("route")),
            Stop(j.getString("stopId"), j.getString("stopName")), j.optInt("ordinal", -1))
    }
}
data class Snapshot(val stops: List<Stop>, val buses: List<Bus>, val fetchedAt: Long) {
    fun json() = JSONObject().put("stops", JSONArray().also { a -> stops.forEach {
        a.put(JSONObject().put("id", it.id).put("name", it.name)) } })
        .put("buses", JSONArray().also { a -> buses.forEach {
            a.put(JSONObject().put("plate", it.plate).put("stopId", it.stopId).put("operating", it.operating)) } })
        .put("fetchedAt", fetchedAt)
    companion object {
        fun api(j: JSONObject, at: Long): Snapshot {
            val stops = j.getJSONArray("lineStationInfoTemp").objects().map { Stop(it.getString("StationId"), it.optString("StationName")) }
            require(stops.isNotEmpty()) { "这条线路暂未返回站点" }
            val buses = j.getJSONArray("lineGpsListTemp").objects().map {
                Bus(it.optString("VehicleLicence").takeUnless { v -> v == "null" }.orEmpty(),
                    it.optString("CurrentStationId"), it.optBoolean("IsOperate"))
            }.distinctBy { listOf(it.plate, it.stopId, it.operating.toString()) }
            return Snapshot(stops, buses, at)
        }
        fun from(j: JSONObject) = Snapshot(j.getJSONArray("stops").objects().map { Stop(it.getString("id"), it.getString("name")) },
            j.getJSONArray("buses").objects().map { Bus(it.optString("plate"), it.optString("stopId"), it.optBoolean("operating")) }, j.optLong("fetchedAt"))
    }
}
fun JSONArray.objects(): List<JSONObject> = (0 until length()).map { getJSONObject(it) }
data class Arrival(val bus: Bus, val stop: Stop, val gap: Int)
object Arrivals {
    fun targetIndex(w: Watch, s: Snapshot): Int? {
        val found = s.stops.indices.filter { s.stops[it].id == w.stop.id }
        return when {
            found.size == 1 -> found[0]
            w.ordinal in found -> w.ordinal
            else -> null
        }
    }
    fun approaching(w: Watch, s: Snapshot): List<Arrival> {
        val target = targetIndex(w, s) ?: return emptyList()
        return s.buses.filter { it.operating }.mapNotNull { bus ->
            val indices = s.stops.indices.filter { s.stops[it].id == bus.stopId }
            if (indices.size != 1 || indices[0] > target) null
            else Arrival(bus, s.stops[indices[0]], target - indices[0])
        }.sortedBy { it.gap }
    }
    fun headline(w: Watch, s: Snapshot?): String {
        if (s == null) return "等待查询"
        if (targetIndex(w, s) == null) return "请重新选择站点"
        val a = approaching(w, s).firstOrNull()
        return when {
            a?.gap == 0 -> "本站附近"
            a != null -> "${a.gap} 站"
            s.buses.none { it.operating } -> "暂无运营车辆"
            s.buses.any { it.operating && s.stops.count { stop -> stop.id == it.stopId } != 1 } -> "车辆位置待确认"
            else -> "暂无待到站车辆"
        }
    }
}

object Freshness {
    fun stale(s: Snapshot?, now: Long, failed: Boolean = false): Boolean =
        s != null && (failed || s.fetchedAt <= 0 || now < s.fetchedAt || now - s.fetchedAt > 90_000)
    fun headline(w: Watch, s: Snapshot?, now: Long, failed: Boolean = false): String =
        (if (stale(s, now, failed)) "上次 · " else "") + Arrivals.headline(w, s)
}

object WidgetCapacity {
    fun rows(size: Int, width: Int, height: Int, font: Float): Int {
        val scale = font.coerceAtLeast(1f)
        val compact = width < 240 || height < 260
        val rowHeight = (if (size == 2 && !compact) 88f else 64f) * scale
        val reserved = 56f * scale + 72f
        val capacity = ((height - reserved) / rowHeight).toInt().coerceAtLeast(0)
        return minOf(capacity, if (size == 0 || compact) 1 else if (size == 1) 2 else 3)
    }
}
