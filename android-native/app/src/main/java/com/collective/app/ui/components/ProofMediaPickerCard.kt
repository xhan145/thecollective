package com.collective.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.collective.app.media.MediaValidator
import com.collective.app.media.SelectedMedia
import com.collective.app.ui.theme.DeepText
import com.collective.app.ui.theme.PureWhite
import com.collective.app.ui.theme.SecondaryText

@Composable
fun ProofMediaPickerCard(
    selectedMedia: SelectedMedia?,
    statusMessage: String?,
    onChooseMedia: () -> Unit
) {
    SoftCard(color = PureWhite, radius = 24.dp) {
        Text("Proof media", style = MaterialTheme.typography.titleMedium, color = DeepText)
        Text(
            "Choose an image or video from this device. Upload is local-only until remote storage is connected.",
            style = MaterialTheme.typography.bodyMedium,
            color = SecondaryText
        )
        if (selectedMedia != null) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(selectedMedia.displayName, style = MaterialTheme.typography.labelLarge, color = DeepText)
                Text(
                    "${selectedMedia.mediaType.label} - ${MediaValidator.formatFileSize(selectedMedia.sizeBytes)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = SecondaryText
                )
            }
        }
        statusMessage?.let {
            Text(it, style = MaterialTheme.typography.bodySmall, color = SecondaryText)
        }
        SecondaryPillButton(
            label = if (selectedMedia == null) "Choose media" else "Choose different media",
            modifier = Modifier.fillMaxWidth(),
            onClick = onChooseMedia
        )
    }
}
