package com.zxwzywzy.tonglingbus

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import java.util.concurrent.atomic.AtomicBoolean

open class BusWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        BusWidgets.renderAll(context); RefreshJob.schedule(context); RefreshJob.once(context)
    }
    override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, appWidgetId: Int, newOptions: Bundle) {
        BusWidgets.renderAll(context)
    }
    override fun onEnabled(context: Context) { RefreshJob.schedule(context) }
    override fun onDisabled(context: Context) { if (!BusWidgets.hasWidgets(context)) RefreshJob.cancel(context) }
}
class SmallWidget : BusWidgetProvider()
class MediumWidget : BusWidgetProvider()
class LargeWidget : BusWidgetProvider()

object BusWidgets {
    private val providers = listOf(SmallWidget::class.java, MediumWidget::class.java, LargeWidget::class.java)
    fun hasWidgets(context: Context) = providers.any { AppWidgetManager.getInstance(context).getAppWidgetIds(ComponentName(context, it)).isNotEmpty() }
    private fun appIntent(context: Context, key: String = "", kind: String = "open"): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            data = Uri.Builder().scheme("tongling").authority(kind).appendPath(key).build()
            if (key.isNotEmpty()) putExtra("watch", key)
            if (kind == "ride") putExtra("ride", true)
            if (kind == "reverse") putExtra("reverse", true)
            if (kind == "pick") putExtra("pick", true)
        }
        return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }
    fun renderAll(context: Context) {
        val manager = AppWidgetManager.getInstance(context)
        val store = BusStore(context)
        providers.forEachIndexed { size, cls ->
            manager.getAppWidgetIds(ComponentName(context, cls)).forEach { id ->
                val options = manager.getAppWidgetOptions(id)
                val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, if (size == 2) 300 else 150)
                val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, if (size == 0) 140 else 280)
                val fontScale = context.resources.configuration.fontScale.coerceAtLeast(1f)
                val compact = width < 240 || height < 260
                val rowHeight = (if (size == 2 && !compact) 88f else 64f) * fontScale
                val reserved = 56f * fontScale + 72f
                val count = WidgetCapacity.rows(size, width, height, fontScale)
                val root = RemoteViews(context.packageName, R.layout.bus_widget)
                val watches = store.visibleWatches().take(count)
                val active = store.selected()
                root.setTextViewText(R.id.widget_station, active?.stop?.name ?: "选择候车站")
                root.setOnClickPendingIntent(R.id.widget_header, if (count == 0 && active != null) appIntent(context, active.key) else appIntent(context, kind = "pick"))
                root.setContentDescription(R.id.widget_header, if (count == 0 && active != null) "查看${active.route.name}线路详情" else "选择候车站")
                root.removeAllViews(R.id.widget_rows)
                if (watches.isEmpty() && count > 0) {
                    val empty = RemoteViews(context.packageName, R.layout.widget_empty)
                    root.addView(R.id.widget_rows, empty)
                    root.setOnClickPendingIntent(R.id.widget_rows, appIntent(context, kind = "pick"))
                }
                watches.forEach { w ->
                    val s = store.snapshot(w.key)
                    val arrivals = s?.let { Arrivals.approaching(w, it) }.orEmpty()
                    val row = RemoteViews(context.packageName, R.layout.widget_row)
                    row.setTextViewText(R.id.row_route, w.route.name)
                    row.setTextViewText(R.id.row_direction, "往${w.route.end}")
                    // This label remains truthful even when the launcher does not execute us again.
                    val status = when (val text = Arrivals.headline(w, s)) {
                        "等待查询" -> "待查询"
                        "请重新选择站点" -> "重新选站"
                        "暂无运营车辆" -> "上次无车"
                        "暂无待到站车辆" -> "上次已过站"
                        "车辆位置待确认" -> "上次待确认"
                        else -> "上次 $text"
                    }
                    row.setTextViewText(R.id.row_status, status)
                    row.setTextViewTextSize(R.id.row_status, TypedValue.COMPLEX_UNIT_SP, if (arrivals.isEmpty()) 12f else if (compact) 16f else 21f)
                    val first = arrivals.firstOrNull()
                    row.setTextViewText(R.id.row_position, first?.let { "上报站 ${it.stop.name}" } ?: if (s != null) "上次 ${s.buses.count { it.operating }} 辆运营中" else "点刷新查询车辆")
                    row.setTextViewText(R.id.row_plate, first?.bus?.plate.orEmpty())
                    row.setViewVisibility(R.id.row_plate, if (size == 2 && !compact && first?.bus?.plate?.isNotBlank() == true) View.VISIBLE else View.GONE)
                    row.setViewVisibility(R.id.row_position, if (compact || size == 1 && count == 2) View.GONE else View.VISIBLE)
                    row.setTextViewText(R.id.row_next, arrivals.getOrNull(1)?.let { "下一辆 ${it.gap} 站${if (it.bus.plate.isBlank()) "" else " · ${it.bus.plate}"}" }.orEmpty())
                    row.setViewVisibility(R.id.row_next, if (size == 2 && !compact && height - reserved - count * rowHeight > 24f * fontScale && arrivals.size > 1) View.VISIBLE else View.GONE)
                    row.setOnClickPendingIntent(R.id.row_root, appIntent(context, w.key))
                    root.addView(R.id.widget_rows, row)
                }
                val snapshotWatches = watches.ifEmpty { listOfNotNull(active) }
                val snapshots = snapshotWatches.mapNotNull { store.snapshot(it.key) }
                val oldest = snapshots.minOfOrNull { it.fetchedAt } ?: 0L
                val failed = watches.any { store.error(it.key) != null }
                val stale = oldest > 0 && System.currentTimeMillis() - oldest > 90_000
                val stamp = if (oldest == 0L) "点击刷新" else "查询于 ${clock(oldest)}${if (failed || stale || snapshots.size < watches.size) " · 待更新" else ""}"
                root.setTextViewText(R.id.widget_time, stamp)
                val age = (System.currentTimeMillis() - oldest).coerceAtLeast(0)
                root.setViewVisibility(R.id.widget_age, if (oldest > 0 && fontScale < 1.5f) View.VISIBLE else View.GONE)
                root.setChronometer(R.id.widget_age, SystemClock.elapsedRealtime() - age, "已过 %s", oldest > 0)
                root.setTextViewText(R.id.widget_refresh, "刷新")
                val refresh = Intent(context, WidgetActions::class.java).setAction(WidgetActions.REFRESH)
                root.setOnClickPendingIntent(R.id.widget_refresh, PendingIntent.getBroadcast(context, 0, refresh, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
                root.setOnClickPendingIntent(R.id.widget_ride, appIntent(context, kind = "ride"))
                root.setOnClickPendingIntent(R.id.widget_reverse, appIntent(context, active?.key.orEmpty(), "reverse"))
                root.setViewVisibility(R.id.widget_reverse, if (width < 240) View.GONE else View.VISIBLE)
                root.setTextViewText(R.id.widget_ride, if (width < 280 || fontScale > 1.2f) "乘车" else "去微信乘车")
                manager.updateAppWidget(id, root)
            }
        }
    }
}

class WidgetActions : BroadcastReceiver() {
    companion object { const val REFRESH = "com.zxwzywzy.tonglingbus.REFRESH" }
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != REFRESH) return
        val pending = goAsync()
        val finished = AtomicBoolean(false)
        val finish = { if (finished.compareAndSet(false, true)) pending.finish(); Unit }
        val handler = Handler(Looper.getMainLooper())
        val deadline = Runnable { finish() }
        handler.postDelayed(deadline, 8_000)
        RefreshEngine.widgets(context.applicationContext) { handler.removeCallbacks(deadline); finish() }
    }
}
