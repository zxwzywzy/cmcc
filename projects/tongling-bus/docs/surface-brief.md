# 安卓候车界面与桌面组件

模式：Operate。目标为小米 15 手机屏幕及启动器提供的可缩放安卓组件；采用已提出并由用户要求开始实现的原生应用与三种桌面布局。

## Direction contract

THESIS：以明确的候车站、方向和剩余站数帮助决定何时出门。当前数据只支持站序位置，所有界面以此为真值。

OWN-WORLD：原生 Material 3，日间浅绿地面、深绿文字与选择态；夜间深绿灰底和低亮度绿色。系统中文无衬线字体，正文随系统缩放；20dp 页面边距，48dp 点击区。界面在户外候车时优先可读。

STORY：搜索站点或线路，选择方向与上车站，保存后查看候车卡；点击线路读站序，添加桌面组件，候车时主动开启限时刷新。

FIRST VIEWPORT：顶部为当前候车站和选站操作，中央主卡显示线路、终点、剩余站数、所在站和车牌，下方换向与限时候车；底部保留原生导航。无收藏时只显示明确的选站入口。

FORM：数字交通服务界面，方向候选 7；seed:72dd869de106d2f0。外部世界只影响色彩、密度与站序节点的表达，不替代安卓原生控件与导航。没有采用图形密钥或机场巨大标牌作为控件。

SIGNATURE：线路详情以站序节点标出候车站和运营方报告的车辆所在站；重复站点明确标为歧义，不伪装成 GPS 地图。状态变动采用 Material 原生反馈，不用装饰性动画打断读数。

FINISH：unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
