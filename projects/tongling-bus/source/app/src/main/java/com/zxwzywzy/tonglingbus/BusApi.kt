package com.zxwzywzy.tonglingbus

import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder

object BusApi {
    private const val base = "https://wx.tlgjzgs.com/Interact/TouchScreen/"
    private val reads = setOf("GetLineInfoByLine", "GetLineStationGpsData", "GetStationName", "GetLineInfosByStation", "GetLinePlanInfos", "GetTransferInfo")
    private fun read(path: String, fields: Map<String, String>, post: Boolean = false): String {
        require(path in reads)
        val body = fields.entries.joinToString("&") { "${URLEncoder.encode(it.key, "UTF-8")}=${URLEncoder.encode(it.value, "UTF-8")}" }
        val url = base + path + if (post) "" else "?$body"
        val c = URI(url).toURL().openConnection() as HttpURLConnection
        try {
            c.connectTimeout = 3500; c.readTimeout = 3500; c.instanceFollowRedirects = false
            c.setRequestProperty("Accept", "application/json")
            c.setRequestProperty("User-Agent", "TonglingWaiting/${BuildConfig.VERSION_NAME} Android")
            if (post) {
                c.requestMethod = "POST"; c.doOutput = true
                c.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                c.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            }
            check(c.responseCode == 200) { "公交查询暂不可用，请稍后刷新" }
            val bytes = c.inputStream.use { input ->
                val output = java.io.ByteArrayOutputStream()
                val buffer = ByteArray(8192)
                while (true) {
                    val n = input.read(buffer)
                    if (n < 0) break
                    check(output.size() + n <= 2_000_000) { "查询结果过大，请缩小范围" }
                    output.write(buffer, 0, n)
                }
                output.toByteArray()
            }
            check(bytes.size <= 2_000_000) { "查询结果过大，请缩小范围" }
            return bytes.toString(Charsets.UTF_8)
        } finally { c.disconnect() }
    }
    fun lines(): List<Route> = JSONArray(read("GetLineInfoByLine", mapOf("lineName" to "", "domainId" to "false"), true)).objects().map { Route.api(it) }
    fun stationNames(query: String): List<String> {
        val a = JSONArray(read("GetStationName", mapOf("stationName" to query.take(40), "domainId" to "false"), true))
        return (0 until a.length()).map { a.getString(it) }.distinct()
    }
    fun stationLines(station: String): List<Route> = JSONArray(read("GetLineInfosByStation", mapOf("stationName" to station.take(80), "domainId" to "false"), true)).objects().map { Route.api(it) }.distinctBy { it.id to it.direction }
    fun vehicles(route: Route): Snapshot {
        val data = JSONObject(read("GetLineStationGpsData", mapOf("lineid" to route.id, "direction" to route.direction.toString(), "domainId" to "false")))
        require(data.getJSONArray("lineStationInfoTemp").objects().all {
            it.optString("LineId") == route.id && it.optInt("Direction", route.direction) == route.direction
        }) { "线路返回与所选方向不一致" }
        return Snapshot.api(data, System.currentTimeMillis())
    }
    fun nextDeparture(route: Route): String = JSONObject(read("GetLinePlanInfos", mapOf("lineid" to route.id, "direction" to route.direction.toString(), "domainId" to "false"))).optString("SendTime").take(5)
    fun transfer(start: String, end: String): List<JSONObject> = JSONArray(read("GetTransferInfo", mapOf("startStationName" to start, "endStationName" to end, "domainId" to "false"), true)).objects()
}
