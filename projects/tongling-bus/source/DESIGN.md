---
name: "铜陵候车"
description: "Code-derived native Android design system; preview, without rendered signoff."
colors:
  light-primary: "#1D6650"
  light-on-primary: "#FFFFFF"
  light-primary-container: "#CCECDC"
  light-on-primary-container: "#103C2B"
  light-background: "#F4F8F3"
  light-surface: "#F4F8F3"
  light-surface-container: "#E8F0E7"
  light-surface-container-high: "#DFE9DF"
  light-ink: "#19251D"
  light-muted: "#4E6053"
  dark-primary: "#9BD6C2"
  dark-on-primary: "#00382A"
  dark-primary-container: "#17513F"
  dark-on-primary-container: "#B7F2DD"
  dark-background: "#101713"
  dark-surface: "#101713"
  dark-surface-container: "#1C2520"
  dark-surface-container-high: "#27312B"
  dark-ink: "#DFE7E0"
  dark-muted: "#BBC9BF"
  widget-dark-bg: "#16221B"
  widget-dark-button: "#234B3A"
typography:
  emphasis:
    fontWeight: 700
  widget-heading:
    fontSize: "17sp"
    fontWeight: 700
  widget-caption:
    fontSize: "11sp"
  widget-detail:
    fontSize: "12sp"
  widget-empty:
    fontSize: "14sp"
  widget-status-compact:
    fontSize: "16sp"
    fontWeight: 700
  widget-status-roomy:
    fontSize: "21sp"
    fontWeight: 700
rounded:
  compact-card: "20dp"
  widget: "24dp"
  widget-button: "20dp"
spacing:
  section: "16dp"
  compact-card: "18dp"
  page: "20dp"
  arrival-card: "22dp"
  widget: "12dp"
components:
  arrival-card-light:
    backgroundColor: "{colors.light-primary-container}"
    textColor: "{colors.light-on-primary-container}"
    padding: "{spacing.arrival-card}"
  arrival-card-dark:
    backgroundColor: "{colors.dark-primary-container}"
    textColor: "{colors.dark-on-primary-container}"
    padding: "{spacing.arrival-card}"
  compact-card:
    rounded: "{rounded.compact-card}"
    padding: "{spacing.compact-card}"
  widget:
    rounded: "{rounded.widget}"
    padding: "{spacing.widget}"
  widget-action:
    height: "48dp"
---
# Design System: 铜陵候车
## Overview
Existing Compose Material 3 application and RemoteViews widgets, documented from source on 2026-11-19. Android preview; no new aesthetic direction.
Sources: `PRODUCT.md`, `../docs/surface-brief.md`, `Design.kt`, `MainActivity.kt`, `BusWidgets.kt`, `Model.kt`, `Background.kt`, `BusStore.kt`, and `app/src/main/res/`. Kotlin files are under `app/src/main/java/com/zxwzywzy/tonglingbus/`.
## Colors
Compose follows system dark mode with static schemes; no Dynamic Color. Primary highlights routes, readouts and station nodes; primaryContainer holds arrival cards; surfaceContainer holds compact cards; ink/muted map to onSurface/onSurfaceVariant. Unspecified roles retain Material defaults, including error and outlineVariant.
Widgets resolve Android values/values-night resources: light bg/ink/muted/accent/button use light background/ink/muted/primary/primaryContainer; dark ink/muted/accent use dark equivalents, with dedicated widget-dark-bg/button. Timestamp/age use muted; status/plate/refresh/reverse use accent; ride label uses ink. Arrival divider uses onPrimaryContainer at alpha 0.16.
## Typography
Material 3 system/locale fonts and inherited role metrics; no custom Compose font, size, line-height or tracking scale. Text follows system sp scaling; bold call-site emphasis is 700.
Hierarchy: displaySmall = approaching readout; headlineLarge = first-use heading; headlineMedium = route/settings heading; headlineSmall = station/widget heading; titleLarge/titleMedium = card/state/section/plate; bodyLarge/Medium/Small = station, supporting copy, time/error/caveat; labelLarge = selected-stop label. Native controls inherit their component type styles.
Widget heading/caption/detail/empty/status sizes are in frontmatter. No-arrival status is 12sp bold; ride is 12sp bold. Most metadata is one line, with ellipsis on station/route/direction/position/next; status allows two lines within 80dp. Compact-card direction permits two ellipsized lines; status width caps at 170dp.
## Layout
Scaffold padding with edge-to-edge; picker adds IME padding. Scrollable screens use 20dp page margins and the extracted 16/18/20/22dp spacing. Widget header minimum/action heights are 48dp; weighted action widths have no separate minimum. First-use action minimum is 52dp; main waiting/reverse actions minimum is 50dp.
Widget initial minimums: small 160x220dp, medium 250x220dp, large 250x300dp; all resize down to 160x220dp. Compact means width <240dp or height <260dp; font scale used for capacity is at least 1.
WidgetCapacity estimates row height as 88*scale for noncompact large, otherwise 64*scale; reserves 56*scale+72dp; truncates remaining height/row height and clamps to >=0, capped at 1 small/compact, 2 medium, 3 large. Zero rows is valid: retain header/time/controls, omit row and empty prompt; active-watch header opens route detail, otherwise selection. Nonzero-capacity header opens selection.
Compact hides position/plate/next; medium with two rows also hides position. Plate requires noncompact large; next additionally requires another arrival and spare height >24*scale. Reverse hides below 240dp; refresh always says 刷新; ride shortens to 乘车 below 280dp or scale >1.2. Chronometer hides at scale >=1.5; absolute timestamp remains. No tablet rail/drawer adaptation is implemented.
## Elevation & Depth
Material Card/ElevatedCard/control defaults and tonal surfaces; no project shadow or motion tokens. Compact Surface has no explicit elevation; widget XML shapes are solid without an explicit shadow. Animation-scale behavior is unverified.
## Shapes
Compact cards and widget actions use the 20dp corner tokens; widget shell uses 24dp. Other Compose shapes inherit Material defaults. Station diagram nodes are circular, 10dp ordinary/14dp emphasized, joined by 2dp-wide, 52dp-high connectors. Icons are 24dp rounded-stroke vectors.
## Components
Native Scaffold/TopAppBar and NavigationBar destinations: 实时公交 / 收藏 / 组件 / 设置. Detail hides bottom navigation; toolbar Back and BackHandler return; picker has staged BackHandler. Predictive Back animation is unverified.
Button, FilledTonalButton, OutlinedButton, TextButton, IconButton, FilterChip, OutlinedTextField, ListItem, LinearProgressIndicator, Card, Surface, AlertDialog and SnackbarHost retain Material interaction states. Working controls disable; search caps at 40 characters; station search needs two trimmed characters and a 350ms delay; failures expose retry. Ride confirmation opens WeChat only.
Signature: route station-sequence diagram marks the chosen stop and uniquely matched operating vehicle stops. Repeated/unmatched vehicle IDs stay uncertain; target occurrence uses saved ordinal. No real GPS, speed or reliable minute ETA is available.
State vocabulary (app -> widget): 等待查询 -> 待查询; 请重新选择站点 -> 重新选站; 本站附近 -> 上次 本站附近; N 站 -> 上次 N 站; 暂无运营车辆 -> 上次无车; 车辆位置待确认 -> 上次待确认; 暂无待到站车辆 -> 上次已过站. Snapshot observations always retain 上次; no-query/reselection labels are actionable exceptions.
Freshness: fetchedAt is successful local query time, not vehicle measurement time. Failed fetches retain cached results. Existing app snapshots become stale on failure, nonpositive timestamp, clock rollback or age >90 seconds: headline gains 上次 · and position becomes 上次位置. Compact-card timestamp follows this predicate; arrival-card timestamp suffix checks age only, with separate failure text.
Widgets show the oldest displayed query timestamp, falling back to active snapshot when zero rows. 点击刷新 means no timestamp; otherwise 查询于 HH:mm:ss, with 待更新 on render for age >90 seconds, displayed-watch failure or missing displayed snapshots. Zero-row failure checks still inspect the empty displayed list. Native Chronometer base is elapsedRealtime()-max(now-oldest,0), format 已过 %s; visible only for positive timestamp and scale <1.5. It ages locally without fetching; headline, timestamp and stale suffix stay static until render. Widget clock-rollback handling differs from app Freshness.
Runtime: foreground/waiting targets 15-second queries; user-started waiting lasts at most 15 minutes with notification/Stop and API 33+ notification permission. Ordinary widget refresh requests a 15-minute network-constrained JobScheduler period; updatePeriodMillis=0. Android/Xiaomi may delay updates; cadence is not guaranteed.
Verification: final handoff reports signed release built, 18 unit tests passed, debug/release lint zero errors and all three review findings closed; not rerun for documentation. Software emulator could not boot; no native screenshots or rendered signoff exist. Xiaomi 15 interaction, themes/system bars, large fonts, resizing, notifications, WeChat and background networking remain unverified. Platform window theme retains light defaults. Native Android only; HTML/CSS detector and web previews do not apply.
## Do's and Don'ts
- Do retain native controls, Back behavior, system font scaling, query time and conservative state language.
- Do allow zero rows and preserve active-route header fallback.
- Don't imply continuous live data, exact GPS/ETA, guaranteed background cadence or rendered acceptance.
