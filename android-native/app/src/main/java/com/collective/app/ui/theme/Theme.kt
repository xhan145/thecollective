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
    primary = ForestGreen,
    onPrimary = PureWhite,
    secondary = SoftPurple,
    onSecondary = PureWhite,
    background = CollectiveBackground,
    onBackground = CollectiveText,
    surface = CollectiveSurface,
    onSurface = CollectiveText,
    surfaceVariant = CollectiveElevated,
    onSurfaceVariant = CollectiveTextSecondary,
    outline = CollectiveLine,
    error = CollectiveError
)

@Composable
fun CollectiveTheme(content: @Composable () -> Unit) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = CollectiveBackground.toArgb()
            window.navigationBarColor = CollectiveBackground.toArgb()
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
