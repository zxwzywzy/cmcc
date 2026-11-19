package com.zxwzywzy.tonglingbus

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

@Composable fun BusTheme(content: @Composable () -> Unit) {
    val dark = darkColorScheme(primary = Color(0xFF9BD6C2), onPrimary = Color(0xFF00382A),
        primaryContainer = Color(0xFF17513F), onPrimaryContainer = Color(0xFFB7F2DD),
        background = Color(0xFF101713), surface = Color(0xFF101713),
        surfaceContainer = Color(0xFF1C2520), surfaceContainerHigh = Color(0xFF27312B),
        onSurface = Color(0xFFDFE7E0), onSurfaceVariant = Color(0xFFBBC9BF))
    val light = lightColorScheme(primary = Color(0xFF1D6650), onPrimary = Color.White,
        primaryContainer = Color(0xFFCCECDC), onPrimaryContainer = Color(0xFF103C2B),
        background = Color(0xFFF4F8F3), surface = Color(0xFFF4F8F3),
        surfaceContainer = Color(0xFFE8F0E7), surfaceContainerHigh = Color(0xFFDFE9DF),
        onSurface = Color(0xFF19251D), onSurfaceVariant = Color(0xFF4E6053))
    MaterialTheme(colorScheme = if (isSystemInDarkTheme()) dark else light, content = content)
}

object BusIcons {
    private fun icon(name: String, block: androidx.compose.ui.graphics.vector.PathBuilder.() -> Unit) =
        ImageVector.Builder(name, 24.dp, 24.dp, 24f, 24f).apply {
            path(fill = null, stroke = SolidColor(Color.Black), strokeLineWidth = 1.8f,
                strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round, pathBuilder = block)
        }.build()
    val Bus = icon("Bus") {
        moveTo(5f, 18f); lineTo(5f, 5f); quadTo(5f, 3f, 8f, 3f); lineTo(16f, 3f); quadTo(19f, 3f, 19f, 5f)
        lineTo(19f, 18f); lineTo(5f, 18f); moveTo(5f, 12f); lineTo(19f, 12f)
        moveTo(8f, 15f); lineTo(8.1f, 15f); moveTo(16f, 15f); lineTo(16.1f, 15f)
        moveTo(7f, 18f); lineTo(7f, 21f); moveTo(17f, 18f); lineTo(17f, 21f)
    }
    val Star = icon("Saved") {
        moveTo(12f, 3f); lineTo(14.8f, 8.6f); lineTo(21f, 9.5f); lineTo(16.5f, 13.9f)
        lineTo(17.6f, 20f); lineTo(12f, 17.1f); lineTo(6.4f, 20f); lineTo(7.5f, 13.9f)
        lineTo(3f, 9.5f); lineTo(9.2f, 8.6f); close()
    }
    val Grid = icon("Widgets") {
        moveTo(4f, 4f); lineTo(10f, 4f); lineTo(10f, 10f); lineTo(4f, 10f); close()
        moveTo(14f, 4f); lineTo(20f, 4f); lineTo(20f, 10f); lineTo(14f, 10f); close()
        moveTo(4f, 14f); lineTo(10f, 14f); lineTo(10f, 20f); lineTo(4f, 20f); close()
        moveTo(14f, 14f); lineTo(20f, 14f); lineTo(20f, 20f); lineTo(14f, 20f); close()
    }
    val Settings = icon("Settings") {
        moveTo(4f, 6f); lineTo(20f, 6f); moveTo(4f, 12f); lineTo(20f, 12f); moveTo(4f, 18f); lineTo(20f, 18f)
        moveTo(8f, 4f); lineTo(8f, 8f); moveTo(16f, 10f); lineTo(16f, 14f); moveTo(10f, 16f); lineTo(10f, 20f)
    }
    val Refresh = icon("Refresh") {
        moveTo(20f, 10f); curveTo(19f, 5f, 14f, 2f, 9f, 4f); curveTo(3f, 6f, 2f, 13f, 6f, 18f)
        curveTo(10f, 22f, 17f, 20f, 19f, 16f); moveTo(20f, 4f); lineTo(20f, 10f); lineTo(14f, 10f)
    }
    val Back = icon("Back") { moveTo(15f, 5f); lineTo(8f, 12f); lineTo(15f, 19f) }
    val Close = icon("Close") { moveTo(6f, 6f); lineTo(18f, 18f); moveTo(18f, 6f); lineTo(6f, 18f) }
    val Swap = icon("Reverse") { moveTo(4f, 7f); lineTo(20f, 7f); lineTo(16f, 3f); moveTo(20f, 17f); lineTo(4f, 17f); lineTo(8f, 21f) }
}
