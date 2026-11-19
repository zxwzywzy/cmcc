# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Stack

Kotlin、Jetpack Compose Material 3、RemoteViews 安卓组件。独立 APK，最低 Android API 26，面向小米 15；首次发布为 0.1.0 预览版。

## Users

用户的朋友，使用小米 15，在铜陵等公交，希望在桌面看车辆和候车站。

## Product Purpose

直接查询“铜陵公交”公众号公开乘客接口，将线路、车辆所在站、车牌和剩余站数放到安卓应用及桌面组件。

## Operating Context

原有入口为微信公众号查询页面，乘车使用微信乘车码。没有要求获取后台管理权限或绕过登录。原有 iOS 项目独立维护。

## Capabilities and Constraints

目前可获取站序级车辆位置，未取得真实车辆 GPS、速度或可靠 ETA；站点坐标抽查为零。手动选择并收藏站点，换向后重新确认候车站。应用中及三种桌面组件显示保守的站数判断。

前台候车模式由用户主动开启，最多 15 分钟；普通后台受安卓和小米系统调度约束。乘车按钮仅引导打开微信。没有登录、抓包、定位、直接取码、余额或订单功能。

## Evidence on Hand

`../docs/api.md` 记录公开接口研究；`../docs/validation.md` 记录构建、自动测试、签名校验和缺失的真机验证。无有效原生截图或小米真机验收证据。

## Product Principles

- 数据只按真实返回解释，区分站序位置和 GPS。
- 不把旧快照包装成实时结果；每个到站读数显示查询时效。
- 各尺寸组件减少内容以保留可读性与可点击性。
- 收藏、方向和候车站明确，查询不需要账号授权。
