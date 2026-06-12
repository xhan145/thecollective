package com.collective.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.collective.app.ai.model.AiAssistResponse
import com.collective.app.ui.theme.DeepText
import com.collective.app.ui.theme.PureWhite
import com.collective.app.ui.theme.Sage
import com.collective.app.ui.theme.SecondaryText
import com.collective.app.ui.theme.SoftGoldPale

@Composable
fun AiAssistCard(
    response: AiAssistResponse,
    modifier: Modifier = Modifier,
    onApplySuggestion: ((String) -> Unit)? = null
) {
    SoftCard(modifier = modifier, color = PureWhite, radius = 24.dp) {
        StatusChip(response.label, color = Sage)
        Text(response.primaryText, style = MaterialTheme.typography.bodyLarge, color = DeepText)
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            response.suggestions.take(3).forEach { suggestion ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = Sage.copy(alpha = 0.62f),
                    onClick = { onApplySuggestion?.invoke(suggestion) }
                ) {
                    Text(
                        suggestion,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        style = MaterialTheme.typography.bodyMedium,
                        color = DeepText
                    )
                }
            }
        }
        if (response.requiresHumanReview || !response.safety.allowed) {
            StatusChip("Needs review", color = SoftGoldPale)
        }
        Text(response.disclaimer, style = MaterialTheme.typography.bodySmall, color = SecondaryText)
    }
}
