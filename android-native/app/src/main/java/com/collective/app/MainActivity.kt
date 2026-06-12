package com.collective.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.collective.app.data.repository.RepositoryProvider
import com.collective.app.ui.CollectiveApp
import com.collective.app.ui.theme.CollectiveTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        RepositoryProvider.initialize(applicationContext)
        enableEdgeToEdge()
        setContent {
            CollectiveTheme {
                CollectiveApp()
            }
        }
    }
}
