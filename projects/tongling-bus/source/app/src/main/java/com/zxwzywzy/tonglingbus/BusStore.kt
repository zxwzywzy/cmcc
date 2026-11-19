package com.zxwzywzy.tonglingbus

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

class BusStore(context: Context) {
    val prefs = context.applicationContext.getSharedPreferences("tongling.v1", Context.MODE_PRIVATE)
    @Synchronized fun watches(): List<Watch> = runCatching {
        JSONArray(prefs.getString("watches", "[]")).objects().map { Watch.from(it) }
    }.getOrDefault(emptyList())
    fun selected(): Watch? = watches().let { list -> list.firstOrNull { it.key == prefs.getString("selected", "") } ?: list.firstOrNull() }
    @Synchronized fun save(w: Watch) {
        val all = (listOf(w) + watches().filter { it.key != w.key }).take(20)
        prefs.edit().putString("watches", JSONArray().also { a -> all.forEach { a.put(it.json()) } }.toString())
            .putString("selected", w.key).apply()
    }
    @Synchronized fun select(key: String) { if (watches().any { it.key == key }) prefs.edit().putString("selected", key).apply() }
    @Synchronized fun remove(key: String) {
        val all = watches().filter { it.key != key }
        prefs.edit().putString("watches", JSONArray().also { a -> all.forEach { a.put(it.json()) } }.toString())
            .remove("snapshot:$key").remove("error:$key")
            .apply { if (prefs.getString("selected", "") == key) putString("selected", all.firstOrNull()?.key.orEmpty()) }.apply()
    }
    fun snapshot(key: String): Snapshot? = runCatching { Snapshot.from(JSONObject(prefs.getString("snapshot:$key", null) ?: return null)) }.getOrNull()
    @Synchronized fun snapshot(w: Watch, snapshot: Snapshot) {
        if (watches().any { it.key == w.key }) prefs.edit().putString("snapshot:${w.key}", snapshot.json().toString()).remove("error:${w.key}").apply()
    }
    @Synchronized fun failure(w: Watch) {
        if (watches().any { it.key == w.key }) prefs.edit().putString("error:${w.key}", "网络暂不可用，请刷新重试").apply()
    }
    fun error(key: String): String? = prefs.getString("error:$key", null)
    fun visibleWatches(): List<Watch> {
        val selected = selected() ?: return emptyList()
        return (listOf(selected) + watches().filter { it.stop.name == selected.stop.name && it.route.id != selected.route.id })
            .distinctBy { it.route.id }.take(3)
    }
    fun lines(): List<Route> = runCatching { JSONArray(prefs.getString("lines", "[]")).objects().map { Route.from(it) } }.getOrDefault(emptyList())
    fun lines(lines: List<Route>) { prefs.edit().putString("lines", JSONArray().also { a -> lines.forEach { a.put(it.json()) } }.toString()).apply() }
}
