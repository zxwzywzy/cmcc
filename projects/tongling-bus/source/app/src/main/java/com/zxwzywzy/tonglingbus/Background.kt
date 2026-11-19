package com.zxwzywzy.tonglingbus

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock

class RefreshJob : android.app.job.JobService() {
    companion object {
        private const val PERIODIC = 701
        private const val ONCE = 702
        fun schedule(context: Context) {
            val scheduler = context.getSystemService(JobScheduler::class.java)
            if (BusWidgets.hasWidgets(context) && scheduler.getPendingJob(PERIODIC) == null) {
                scheduler.schedule(JobInfo.Builder(PERIODIC, ComponentName(context, RefreshJob::class.java))
                    .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPeriodic(15 * 60_000L).setPersisted(true).build())
            }
        }
        fun once(context: Context) {
            context.getSystemService(JobScheduler::class.java).schedule(JobInfo.Builder(ONCE, ComponentName(context, RefreshJob::class.java))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setOverrideDeadline(0).build())
        }
        fun cancel(context: Context) {
            val scheduler = context.getSystemService(JobScheduler::class.java)
            scheduler.cancel(PERIODIC); scheduler.cancel(ONCE)
        }
    }
    private val running = mutableSetOf<Int>()
    override fun onStartJob(params: JobParameters): Boolean {
        running.add(params.jobId)
        RefreshEngine.widgets(this) { if (running.remove(params.jobId)) jobFinished(params, false) }
        return true
    }
    override fun onStopJob(params: JobParameters): Boolean { running.remove(params.jobId); return true }
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) RefreshJob.schedule(context)
    }
}

class WaitingService : Service() {
    companion object {
        private const val CHANNEL = "waiting"
        @Volatile private var until = 0L
        fun running() = until > SystemClock.elapsedRealtime()
    }
    private val handler = Handler(Looper.getMainLooper())
    private val tick = object : Runnable {
        override fun run() {
            if (!running() || BusStore(this@WaitingService).selected() == null) { stopSelf(); return }
            RefreshEngine.widgets(this@WaitingService)
            getSystemService(NotificationManager::class.java).notify(23, notification())
            handler.postDelayed(this, 15_000)
        }
    }
    override fun onCreate() {
        super.onCreate()
        getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel(CHANNEL, "候车刷新", NotificationManager.IMPORTANCE_LOW))
    }
    private fun notification(): Notification {
        val open = PendingIntent.getActivity(this, 23, Intent(this, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val stop = PendingIntent.getService(this, 24, Intent(this, WaitingService::class.java).setAction("stop"), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val minutes = ((until - SystemClock.elapsedRealtime()).coerceAtLeast(0) + 59_999) / 60_000
        return Notification.Builder(this, CHANNEL).setSmallIcon(R.drawable.ic_bus)
            .setContentTitle("铜陵候车 · 约每 15 秒查询")
            .setContentText("剩余 $minutes 分钟 · ${BusStore(this).selected()?.stop?.name.orEmpty()}")
            .setContentIntent(open).setOngoing(true).setOnlyAlertOnce(true)
            .addAction(Notification.Action.Builder(null, "停止候车", stop).build()).build()
    }
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "stop") { stopSelf(); return START_NOT_STICKY }
        if (BusStore(this).selected() == null) { stopSelf(); return START_NOT_STICKY }
        until = SystemClock.elapsedRealtime() + 15 * 60_000L
        if (Build.VERSION.SDK_INT >= 29) startForeground(23, notification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        else startForeground(23, notification())
        handler.removeCallbacks(tick); handler.post(tick)
        BusWidgets.renderAll(this)
        return START_NOT_STICKY
    }
    override fun onTimeout(startId: Int, fgsType: Int) { stopSelf() }
    override fun onDestroy() {
        until = 0L; handler.removeCallbacksAndMessages(null)
        stopForeground(STOP_FOREGROUND_REMOVE); BusWidgets.renderAll(this); super.onDestroy()
    }
    override fun onBind(intent: Intent?): IBinder? = null
}
