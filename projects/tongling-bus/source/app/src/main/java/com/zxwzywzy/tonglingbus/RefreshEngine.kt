package com.zxwzywzy.tonglingbus

import android.content.Context
import android.os.Handler
import android.os.Looper
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

object RefreshEngine {
    private val executor = Executors.newFixedThreadPool(3)
    private val main = Handler(Looper.getMainLooper())
    private val flights = mutableMapOf<String, MutableList<() -> Unit>>()
    fun refresh(context: Context, w: Watch, done: () -> Unit = {}) {
        synchronized(flights) {
            flights[w.key]?.let { it.add(done); return }
            flights[w.key] = mutableListOf(done)
        }
        val app = context.applicationContext
        executor.execute {
            val store = BusStore(app)
            try { store.snapshot(w, BusApi.vehicles(w.route)) } catch (_: Exception) { store.failure(w) }
            val listeners = synchronized(flights) { flights.remove(w.key).orEmpty() }
            main.post { BusWidgets.renderAll(app); listeners.forEach { it() } }
        }
    }
    fun widgets(context: Context, done: () -> Unit = {}) {
        val watches = BusStore(context).visibleWatches()
        if (watches.isEmpty()) { main.post { BusWidgets.renderAll(context); done() }; return }
        val left = AtomicInteger(watches.size)
        watches.forEach { refresh(context, it) { if (left.decrementAndGet() == 0) done() } }
    }
}
