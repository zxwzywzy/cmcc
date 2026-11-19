package com.zxwzywzy.tonglingbus

import android.Manifest
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {
    var inForeground by mutableStateOf(false)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        RefreshJob.schedule(this)
        setContent { BusTheme { TonglingApp(this) } }
    }
    override fun onStart() { super.onStart(); inForeground = true }
    override fun onStop() { inForeground = false; super.onStop() }
}

fun clock(at: Long): String = if (at > 0) SimpleDateFormat("HH:mm:ss", Locale.CHINA).format(Date(at)) else "尚未查询"
fun shortTime(value: String): String = value.substringAfterLast(' ').split(':').let {
    if (it.size >= 2) "${it[0].padStart(2, '0')}:${it[1].padStart(2, '0')}" else "—"
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun TonglingApp(activity: MainActivity) {
    val store = remember { BusStore(activity) }
    var revision by remember { mutableIntStateOf(0) }
    DisposableEffect(store) {
        val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ -> revision++ }
        store.prefs.registerOnSharedPreferenceChangeListener(listener)
        onDispose { store.prefs.unregisterOnSharedPreferenceChangeListener(listener) }
    }
    val watches = remember(revision) { store.watches() }
    val selected = remember(revision) { store.selected() }
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var detailId by rememberSaveable { mutableStateOf(activity.intent.getStringExtra("watch")) }
    var picking by rememberSaveable { mutableStateOf(activity.intent.getBooleanExtra("pick", false)) }
    var pickRoute by remember { mutableStateOf<Route?>(null) }
    var pickName by remember { mutableStateOf<String?>(null) }
    var ride by rememberSaveable { mutableStateOf(activity.intent.getBooleanExtra("ride", false)) }
    var working by remember(selected?.key) { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val notify = { message: String -> scope.launch { snackbar.showSnackbar(message) }; Unit }
    LaunchedEffect(Unit) {
        detailId?.let { key -> store.select(key) }
        if (activity.intent.getBooleanExtra("reverse", false)) {
            val current = store.selected()
            if (current != null) {
                try {
                    val lines = withContext(Dispatchers.IO) { store.lines().ifEmpty { BusApi.lines().also { store.lines(it) } } }
                    val reverse = lines.firstOrNull { it.id == current.route.id && it.direction != current.route.direction }
                    if (reverse != null) { pickRoute = reverse; pickName = current.stop.name; picking = true }
                    else notify("暂未找到反方向线路")
                } catch (_: Exception) { notify("换向查询失败，请稍后重试") }
            } else picking = true
        }
    }
    val refresh = {
        selected?.let { w -> working = true; RefreshEngine.refresh(activity, w) { working = false } }
        Unit
    }
    LaunchedEffect(activity.inForeground, selected?.key) {
        if (activity.inForeground) {
            while (true) { refresh(); revision++; delay(15_000) }
        }
    }
    val notificationPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) {
            runCatching { ContextCompat.startForegroundService(activity, Intent(activity, WaitingService::class.java)) }
                .onFailure { notify("系统暂未允许候车刷新，请重新打开应用后再试") }
        } else notify("需要允许通知，才能显示候车状态和停止按钮")
        revision++
    }
    fun waiting() {
        if (WaitingService.running()) { activity.stopService(Intent(activity, WaitingService::class.java)); revision++; return }
        if (Build.VERSION.SDK_INT >= 33 && activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            runCatching { ContextCompat.startForegroundService(activity, Intent(activity, WaitingService::class.java)) }
                .onFailure { notify("系统暂未允许候车刷新，请重新打开应用后再试") }
            revision++
        }
    }
    fun pick(route: Route? = null, name: String? = null) { pickRoute = route; pickName = name; picking = true }
    if (picking) {
        RoutePicker(store, pickRoute, pickName, onClose = { picking = false }) { w, snapshot ->
            store.save(w); store.snapshot(w, snapshot); BusWidgets.renderAll(activity)
            if (detailId != null) detailId = w.key
            picking = false; tab = 0
        }
        return
    }
    val detail = watches.firstOrNull { it.key == detailId }
    BackHandler(detail != null) { detailId = null }
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(if (detail != null) detail.route.name else listOf("铜陵候车", "常用候车站", "桌面组件", "设置")[tab], fontWeight = FontWeight.Bold) },
                navigationIcon = { if (detail != null) IconButton(onClick = { detailId = null }) { Icon(BusIcons.Back, "返回") } },
                actions = {
                    if (selected != null) IconButton(onClick = refresh, enabled = !working) { Icon(BusIcons.Refresh, "刷新公交") }
                    TextButton(onClick = { ride = true }) { Text("去微信乘车") }
                })
        },
        bottomBar = {
            if (detail == null) NavigationBar {
                val labels = listOf("实时公交", "收藏", "组件", "设置")
                val icons = listOf(BusIcons.Bus, BusIcons.Star, BusIcons.Grid, BusIcons.Settings)
                labels.forEachIndexed { i, label -> NavigationBarItem(selected = tab == i, onClick = { tab = i }, icon = { Icon(icons[i], null) }, label = { Text(label) }) }
            }
        }, snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        val modifier = Modifier.padding(padding).fillMaxSize()
        if (detail != null) {
            val snapshot = remember(revision, detail.key) { store.snapshot(detail.key) }
            RouteDetails(detail, snapshot, store.error(detail.key), modifier,
                onStopPick = { pick(detail.route, detail.stop.name) })
        } else when (tab) {
            0 -> Column(modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                if (selected == null) {
                    Spacer(Modifier.height(20.dp))
                    Text("下一班，\n从这里看。", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
                    Text("选择常坐的站台，把公交放到桌面。", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Button(onClick = { pick() }, modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp)) { Text("选择候车站") }
                    Text("支持线路、车辆所在站和车牌查询，无需登录。", style = MaterialTheme.typography.bodyMedium)
                } else {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(selected.stop.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                            Text("我的候车站", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
                        }
                        TextButton(onClick = { pick() }) { Text("选站") }
                    }
                    val snapshot = remember(revision, selected.key) { store.snapshot(selected.key) }
                    ArrivalCard(selected, snapshot, store.error(selected.key), working) { detailId = selected.key }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(onClick = {
                            scope.launch {
                                try {
                                    val lines = withContext(Dispatchers.IO) { store.lines().ifEmpty { BusApi.lines().also { store.lines(it) } } }
                                    val reverse = lines.firstOrNull { it.id == selected.route.id && it.direction != selected.route.direction }
                                    if (reverse == null) notify("暂未找到反方向线路") else pick(reverse, selected.stop.name)
                                } catch (_: Exception) { notify("换向查询失败，请稍后重试") }
                            }
                        }, modifier = Modifier.weight(1f).heightIn(min = 50.dp)) { Icon(BusIcons.Swap, null, Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text("换向") }
                        Button(onClick = { waiting() }, modifier = Modifier.weight(1.5f).heightIn(min = 50.dp)) { Text(if (WaitingService.running()) "停止候车" else "候车 15 分钟") }
                    }
                    Text(if (WaitingService.running()) "候车模式运行中，目标约每 15 秒查询，通知中可停止。" else "开启候车模式后，回到桌面也会尝试持续刷新。", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    val other = store.visibleWatches().filter { it.key != selected.key }
                    if (other.isNotEmpty()) Text("同站常用线路", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    other.forEach { w -> CompactWatch(w, store.snapshot(w.key), store.error(w.key), onClick = { store.select(w.key); detailId = w.key }) }
                    TextButton(onClick = { pick(null, selected.stop.name) }) { Text("添加同站线路") }
                }
                Spacer(Modifier.height(12.dp))
            }
            1 -> LazyColumn(modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item { Text("${watches.size} 个候车选择", color = MaterialTheme.colorScheme.onSurfaceVariant) }
                if (watches.isEmpty()) item { Text("还没有收藏。先选择常坐的站台和线路。") }
                items(watches, key = { it.key }) { w ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.weight(1f)) { CompactWatch(w, store.snapshot(w.key), store.error(w.key), onClick = { store.select(w.key); tab = 0; detailId = w.key }) }
                        IconButton(onClick = { store.remove(w.key); BusWidgets.renderAll(activity) }) { Icon(BusIcons.Close, "移除${w.route.name}${w.stop.name}收藏") }
                    }
                }
                item { FilledTonalButton(onClick = { pick() }, modifier = Modifier.fillMaxWidth()) { Text("添加候车站") } }
            }
            2 -> Column(modifier.verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("把站台放到桌面", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text("组件跟随当前候车站。同站收藏的不同线路会在中号、全景中一并显示。", color = MaterialTheme.colorScheme.onSurfaceVariant)
                listOf(Triple("小号 · 一眼看车", "一条线路，站数更醒目", SmallWidget::class.java),
                    Triple("中号 · 通勤卡", "最多两条同站线路", MediumWidget::class.java),
                    Triple("全景 · 多路候车", "最多三条同站线路与车牌", LargeWidget::class.java)).forEach { (title, subtitle, cls) ->
                    ElevatedCard(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Button(onClick = {
                                val manager = AppWidgetManager.getInstance(activity)
                                if (manager.isRequestPinAppWidgetSupported) {
                                    manager.requestPinAppWidget(ComponentName(activity, cls), null, null)
                                } else notify("请长按桌面，选择添加小组件，再找到铜陵候车")
                            }) { Text("添加到桌面") }
                        }
                    }
                }
                Text("也可长按小米桌面 → 添加小部件 → 安卓小部件 → 铜陵候车。具体名称随系统版本不同。", style = MaterialTheme.typography.bodyMedium)
                Text("支持随尺寸调整和深浅色。普通后台刷新由系统安排；点组件刷新可主动查询。", style = MaterialTheme.typography.bodySmall)
            }
            else -> SettingsPage(activity, modifier, notify)
        }
    }
    if (ride) AlertDialog(onDismissRequest = { ride = false }, title = { Text("去微信乘车") }, text = {
        Text("当前版本会打开微信。请在微信乘车码中选择铜陵并出示官方乘车码，应用不生成或保存支付码。")
    }, confirmButton = { TextButton(onClick = {
        ride = false
        val launch = activity.packageManager.getLaunchIntentForPackage("com.tencent.mm")
        if (launch == null) notify("尚未安装微信") else activity.startActivity(launch)
    }) { Text("打开微信") } }, dismissButton = { TextButton(onClick = { ride = false }) { Text("取消") } })
}

@Composable private fun ArrivalCard(w: Watch, s: Snapshot?, error: String?, loading: Boolean, onClick: () -> Unit) {
    val approaching = s?.let { Arrivals.approaching(w, it) }.orEmpty()
    val stale = Freshness.stale(s, System.currentTimeMillis(), error != null)
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(w.route.name, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Text("开往 ${w.route.end}", style = MaterialTheme.typography.bodyLarge)
            Text(Freshness.headline(w, s, System.currentTimeMillis(), error != null), style = if (approaching.isNotEmpty()) MaterialTheme.typography.displaySmall else MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            approaching.firstOrNull()?.let { a ->
                Text("${if (stale) "上次位置" else "上报站点"}：${a.stop.name}", style = MaterialTheme.typography.bodyLarge)
                if (a.bus.plate.isNotBlank()) Text(a.bus.plate, style = MaterialTheme.typography.titleMedium)
            }
            approaching.getOrNull(1)?.let { Text("下一辆 · 还剩 ${it.gap} 站${if (it.bus.plate.isBlank()) "" else " · ${it.bus.plate}"}", style = MaterialTheme.typography.bodyMedium) }
            HorizontalDivider(color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.16f))
            Text(if (loading) "正在查询…" else "查询于 ${clock(s?.fetchedAt ?: 0)}${if (s != null && System.currentTimeMillis() - s.fetchedAt > 90_000) " · 待更新" else ""}", style = MaterialTheme.typography.bodySmall)
            if (error != null) Text(error, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
            Text("点开查看沿线站点和所有车辆", style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable private fun CompactWatch(w: Watch, s: Snapshot?, error: String? = null, onClick: () -> Unit) {
    Surface(onClick = onClick, shape = RoundedCornerShape(20.dp), color = MaterialTheme.colorScheme.surfaceContainer, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(w.route.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Text(Freshness.headline(w, s, System.currentTimeMillis(), error != null), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary, modifier = Modifier.widthIn(max = 170.dp))
            }
            Text("${w.stop.name} · 往${w.route.end}", maxLines = 2, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("查询于 ${clock(s?.fetchedAt ?: 0)}${if (Freshness.stale(s, System.currentTimeMillis(), error != null)) " · 待更新" else ""}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (error != null) Text(error, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
        }
    }
}

@Composable private fun RouteDetails(w: Watch, s: Snapshot?, error: String?, modifier: Modifier, onStopPick: () -> Unit) {
    LazyColumn(modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(0.dp)) {
        item {
            Text("${w.route.start} → ${w.route.end}", style = MaterialTheme.typography.titleMedium)
            Text("首班 ${shortTime(w.route.first)}  ·  末班 ${shortTime(w.route.last)}", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(vertical = 8.dp))
            ArrivalCard(w, s, error, false) { }
            TextButton(onClick = onStopPick) { Text("更换这条线路的候车站") }
            Text("车辆所在站 · 站序示意", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(vertical = 12.dp))
            Text("按运营方返回的当前站显示，无精确 GPS 和到站分钟预测。", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(bottom = 16.dp))
            s?.buses?.filter { it.operating && s.stops.count { stop -> stop.id == it.stopId } != 1 }?.forEach {
                Text("${it.plate.ifBlank { "车辆" }} · 位置待确认", style = MaterialTheme.typography.bodyMedium)
            }
        }
        if (s == null) item { Text("正在查询沿线站点…") }
        s?.stops?.forEachIndexed { index, stop ->
            item(key = "$index:${stop.id}") {
                val buses = s.buses.filter { it.operating && it.stopId == stop.id && s.stops.count { item -> item.id == stop.id } == 1 }
                val target = Arrivals.targetIndex(w, s) == index
                Row(Modifier.fillMaxWidth().heightIn(min = 64.dp), verticalAlignment = Alignment.Top) {
                    Column(Modifier.width(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Spacer(Modifier.height(8.dp))
                        Box(Modifier.size(if (target || buses.isNotEmpty()) 14.dp else 10.dp).background(if (target || buses.isNotEmpty()) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(50)))
                        if (index < s.stops.lastIndex) Box(Modifier.width(2.dp).height(52.dp).background(MaterialTheme.colorScheme.outlineVariant))
                    }
                    Column(Modifier.weight(1f).padding(start = 8.dp, bottom = 16.dp)) {
                        Text(stop.name, style = MaterialTheme.typography.bodyLarge, fontWeight = if (target) FontWeight.Bold else FontWeight.Normal)
                        if (target) Text("我的候车站", color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge)
                        buses.forEach { Text("${it.plate.ifBlank { "车辆" }} · 上报在此站", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary) }
                        if (buses.isNotEmpty() && s.stops.count { it.id == stop.id } > 1) Text("重复站点，所在位置待确认", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
        item { Spacer(Modifier.height(24.dp)) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun RoutePicker(store: BusStore, initialRoute: Route?, initialName: String?, onClose: () -> Unit, onPick: (Watch, Snapshot) -> Unit) {
    var stage by remember { mutableIntStateOf(if (initialRoute != null) 2 else if (initialName != null) 1 else 0) }
    var stationMode by remember { mutableStateOf(true) }
    var query by rememberSaveable { mutableStateOf("") }
    var stationName by remember { mutableStateOf(initialName.orEmpty()) }
    var allLines by remember { mutableStateOf(store.lines()) }
    var names by remember { mutableStateOf(emptyList<String>()) }
    var routes by remember { mutableStateOf(emptyList<Route>()) }
    var routesStation by remember { mutableStateOf("") }
    var route by remember { mutableStateOf(initialRoute) }
    var snapshot by remember { mutableStateOf<Snapshot?>(null) }
    var snapshotRoute by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var retry by remember { mutableIntStateOf(0) }
    BackHandler { if (stage > 0 && initialRoute == null && initialName == null) stage-- else onClose() }
    LaunchedEffect(stage, stationMode, query, stationName, route, retry) {
        loading = true; error = null
        try {
            when (stage) {
                0 -> if (stationMode) {
                    names = emptyList()
                    if (query.trim().length >= 2) { delay(350); names = withContext(Dispatchers.IO) { BusApi.stationNames(query.trim()) } }
                } else if (allLines.isEmpty()) { allLines = withContext(Dispatchers.IO) { BusApi.lines().also { store.lines(it) } } }
                1 -> { routes = emptyList(); routesStation = ""; routes = withContext(Dispatchers.IO) { BusApi.stationLines(stationName) }; routesStation = stationName }
                2 -> { snapshot = null; snapshotRoute = ""; route?.let { r -> snapshot = withContext(Dispatchers.IO) { BusApi.vehicles(r) }; snapshotRoute = "${r.id}:${r.direction}" } }
            }
        } catch (cancelled: kotlinx.coroutines.CancellationException) { throw cancelled }
        catch (_: Exception) { error = "查询失败，请检查网络后重试" }
        finally { loading = false }
    }
    Scaffold(topBar = {
        TopAppBar(title = { Text(when(stage) { 0 -> "选择候车站"; 1 -> stationName; else -> "${route?.name.orEmpty()} · 选择站点" }) },
            navigationIcon = { IconButton(onClick = { if (stage > 0 && initialRoute == null && initialName == null) stage-- else onClose() }) { Icon(BusIcons.Back, "返回") } })
    }) { padding ->
        LazyColumn(Modifier.padding(padding).imePadding().padding(horizontal = 20.dp).fillMaxSize(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (stage == 0) {
                item { Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    FilterChip(stationMode, onClick = { stationMode = true; query = "" }, label = { Text("按站点") })
                    FilterChip(!stationMode, onClick = { stationMode = false; query = "" }, label = { Text("按线路") })
                } }
                item { OutlinedTextField(query, { query = it.take(40) }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                    label = { Text(if (stationMode) "输入站名，至少两个字" else "输入线路，如 1、D1") }) }
            }
            if (loading) item { LinearProgressIndicator(Modifier.fillMaxWidth().padding(vertical = 8.dp)) }
            if (error != null) item { Text(error!!, color = MaterialTheme.colorScheme.error); TextButton(onClick = { retry++ }) { Text("重试") } }
            if (stage == 0 && stationMode) {
                items(names) { name -> ListItem(headlineContent = { Text(name) }, modifier = Modifier.clickable { stationName = name; stage = 1 }) }
                if (!loading && query.length >= 2 && names.isEmpty() && error == null) item { Text("没找到站点，试试减少字数，或切换按线路查找。") }
            }
            if (stage == 1 || stage == 0 && !stationMode) {
                val shown = if (stage == 1) { if (!loading && routesStation == stationName) routes else emptyList() } else allLines.filter { query.isBlank() || it.name.contains(query.trim(), ignoreCase = true) }
                items(shown, key = { "${it.id}:${it.direction}" }) { r ->
                    ListItem(headlineContent = { Text(r.name, fontWeight = FontWeight.Bold) }, supportingContent = { Text("${r.start} → ${r.end}") },
                        modifier = Modifier.clickable { snapshot = null; snapshotRoute = ""; route = r; stage = 2 })
                }
                if (!loading && shown.isEmpty() && error == null) item { Text("没有匹配的线路，试试其他名称。") }
            }
            if (stage == 2) {
                item { Text("${route?.start.orEmpty()} → ${route?.end.orEmpty()}", style = MaterialTheme.typography.titleMedium)
                    Text("点你要上车的站台。换向后需重新确认站台。", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(vertical = 8.dp)) }
                snapshot?.takeIf { !loading && snapshotRoute == "${route?.id}:${route?.direction}" }?.stops?.forEachIndexed { index, stop -> item(key = "${stop.id}:$index") {
                    ListItem(headlineContent = { Text(stop.name, fontWeight = if (stop.name == stationName) FontWeight.Bold else FontWeight.Normal) },
                        supportingContent = { if (stop.name == stationName) Text("与你搜索的站名一致") },
                        modifier = Modifier.clickable { route?.let { r -> snapshot?.let { s -> onPick(Watch(r, stop, index), s) } } })
                } }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
}

@Composable private fun SettingsPage(activity: MainActivity, modifier: Modifier, notify: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var checking by remember { mutableStateOf(false) }
    Column(modifier.verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        Text("铜陵候车", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("版本 ${BuildConfig.VERSION_NAME} · 安卓版", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text("一个轻量的候车工具。公交数据来自运营方公开查询页面，本应用为第三方工具。", style = MaterialTheme.typography.bodyLarge)
        HorizontalDivider()
        Text("刷新与电量", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text("应用前台约每 15 秒查询；候车模式最多运行 15 分钟。普通桌面后台由安卓安排，可能延迟。小米限制后台联网时，可在应用电池设置中允许后台活动。")
        OutlinedButton(onClick = { activity.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${activity.packageName}"))) }) { Text("打开本应用设置") }
        Text("数据范围", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text("当前显示车辆所在站和剩余站数，未取得真实 GPS 与可靠分钟预测。暂不支持自动最近站台、公交卡余额和订单。")
        Text("乘车与隐私", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text("查车无需登录，不抓取微信账号，不读取定位。收藏和查询结果保存在手机本机。乘车时仍由微信官方乘车码完成。")
        Button(enabled = !checking, onClick = {
            checking = true
            scope.launch {
                try {
                    val update = withContext(Dispatchers.IO) {
                        val c = URI("https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/tongling-bus/packages/latest.json").toURL().openConnection() as HttpURLConnection
                        try { c.connectTimeout = 5000; c.readTimeout = 5000; check(c.responseCode == 200); JSONObject(c.inputStream.bufferedReader().use { it.readText() }) } finally { c.disconnect() }
                    }
                    if (update.getInt("versionCode") > BuildConfig.VERSION_CODE) {
                        val url = update.getString("url")
                        check(url.startsWith("https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/tongling-bus/packages/") && url.endsWith(".apk"))
                        activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    } else notify("已是当前发布版本 ${BuildConfig.VERSION_NAME}")
                } catch (cancelled: kotlinx.coroutines.CancellationException) { throw cancelled }
                catch (_: Exception) { notify("暂时无法检查更新，可稍后重试") }
                finally { checking = false }
            }
        }) { Text(if (checking) "正在检查…" else "检查更新") }
        TextButton(onClick = { activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/zxwzywzy/cmcc/tree/main/projects/tongling-bus"))) }) { Text("项目说明与下载") }
        Spacer(Modifier.height(12.dp))
    }
}
