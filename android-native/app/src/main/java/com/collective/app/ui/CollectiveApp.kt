package com.collective.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.collective.app.ai.CollectiveAiCore
import com.collective.app.data.repository.CollectiveRepositoryFactory
import com.collective.app.ui.theme.CardBackground
import com.collective.app.ui.theme.CreamBackground
import com.collective.app.ui.theme.ForestGreen
import com.collective.app.ui.theme.PureWhite
import com.collective.app.ui.theme.Sage
import com.collective.app.ui.theme.TertiaryText

@Composable
fun CollectiveApp() {
    var currentRoute by remember { mutableStateOf(Routes.Home) }
    val snackbarHostState = remember { SnackbarHostState() }
    val repositories = remember { CollectiveRepositoryFactory.create() }
    val aiAssistRepository = remember { CollectiveAiCore.defaultRepository() }
    val navigate: (String) -> Unit = { route -> currentRoute = route }

    CollectiveScaffold(
        currentRoute = currentRoute,
        snackbarHostState = snackbarHostState,
        onNavigate = navigate,
        onCreate = { navigate(Routes.practice("communication")) },
    ) { innerPadding ->
        CollectiveNavGraph(
            currentRoute = currentRoute,
            snackbarHostState = snackbarHostState,
            repositories = repositories,
            aiAssistRepository = aiAssistRepository,
            modifier = Modifier.padding(innerPadding),
            navigate = navigate,
        )
    }
}

@Composable
fun CollectiveScaffold(
    currentRoute: String,
    snackbarHostState: SnackbarHostState,
    onNavigate: (String) -> Unit,
    onCreate: () -> Unit,
    content: @Composable (PaddingValues) -> Unit,
) {
    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = CreamBackground,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            BottomNavBar(
                currentRoute = currentRoute,
                onNavigate = onNavigate,
                onCreate = onCreate,
            )
        },
        content = content,
    )
}

@Composable
fun BottomNavBar(currentRoute: String, onNavigate: (String) -> Unit, onCreate: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().navigationBarsPadding(),
        color = CardBackground,
        shadowElevation = 8.dp,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().height(78.dp).padding(horizontal = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            BottomNavItem("Home", "H", currentRoute == Routes.Home) { onNavigate(Routes.Home) }
            BottomNavItem("Paths", "P", currentRoute.startsWith("pathDetail")) { onNavigate(Routes.pathDetail("communication")) }
            CenterCreateButton(onClick = onCreate)
            BottomNavItem("Progress", "|||", currentRoute == Routes.Progress) { onNavigate(Routes.Progress) }
            BottomNavItem("Profile", "Me", currentRoute == Routes.Profile) { onNavigate(Routes.Profile) }
        }
    }
}

@Composable
fun CenterCreateButton(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .offset(y = (-17).dp)
            .size(66.dp)
            .shadow(10.dp, CircleShape)
            .clip(CircleShape)
            .background(ForestGreen)
            .clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) {
        Text("+", style = MaterialTheme.typography.headlineSmall, color = PureWhite)
    }
}

@Composable
private fun BottomNavItem(label: String, icon: String, selected: Boolean, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(62.dp)
            .clip(RoundedCornerShape(18.dp))
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Surface(shape = CircleShape, color = if (selected) Sage else Color.Transparent, modifier = Modifier.size(30.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Text(icon, color = if (selected) ForestGreen else TertiaryText, style = MaterialTheme.typography.labelLarge)
            }
        }
        Text(label, color = if (selected) ForestGreen else TertiaryText, style = MaterialTheme.typography.labelSmall, maxLines = 1)
    }
}
