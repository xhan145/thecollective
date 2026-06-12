package com.collective.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView

private val CollectiveColorScheme = lightColorScheme(
    primary = CollectiveTokens.Gold,
    onPrimary = CollectiveTokens.Text,
    secondary = CollectiveTokens.GoldBright,
    onSecondary = CollectiveTokens.Text,
    background = CollectiveTokens.Cream,
    onBackground = CollectiveTokens.Text,
    surface = CollectiveTokens.Card,
    onSurface = CollectiveTokens.Text,
    surfaceVariant = androidx.compose.ui.graphics.Color.White,
    onSurfaceVariant = CollectiveTokens.Muted,
    outline = CollectiveTokens.Line,
    error = CollectiveTokens.Danger
)

@Composable
@Suppress("DEPRECATION")
fun CollectiveTheme(content: @Composable () -> Unit) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = CollectiveTokens.Cream.toArgb()
            window.navigationBarColor = CollectiveTokens.Cream.toArgb()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                window.decorView.systemUiVisibility =
                    android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or
                        android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            }
        }
    }

    MaterialTheme(
        colorScheme = CollectiveColorScheme,
        typography = CollectiveTypography,
        shapes = CollectiveShapes,
        content = content
    )
}
