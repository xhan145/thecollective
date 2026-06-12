package com.collective.app.beta.ui.proof

import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.collective.app.beta.model.ProofAttachment
import com.collective.app.beta.model.ProofType
import com.collective.app.ui.components.CollectiveSecondaryButton
import com.collective.app.ui.proof.getMimeTypeForUri

/**
 * Reuses the existing proof-capture machinery (the Android media pickers + the URI helpers from
 * `com.collective.app.ui.proof`) and adapts the single picked item into the beta [ProofAttachment]
 * shape. MVP captures one attachment; the Proof model still stores a list for Firebase scalability.
 */
@Composable
fun BetaMediaPicker(
    onPicked: (ProofAttachment) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current

    val visualLauncher = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) onPicked(buildAttachment(context, uri))
    }
    val audioLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) onPicked(buildAttachment(context, uri))
    }

    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            CollectiveSecondaryButton(
                label = "Add photo or video",
                modifier = Modifier.weight(1f),
            ) {
                visualLauncher.launch(
                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageAndVideo),
                )
            }
        }
        CollectiveSecondaryButton(label = "Add audio file") {
            audioLauncher.launch("audio/*")
        }
    }
}

private fun buildAttachment(context: Context, uri: Uri): ProofAttachment {
    val mime = getMimeTypeForUri(context, uri)
    val type = when {
        mime?.startsWith("image/") == true -> ProofType.IMAGE
        mime?.startsWith("video/") == true -> ProofType.VIDEO
        mime?.startsWith("audio/") == true -> ProofType.AUDIO
        else -> ProofType.TEXT
    }
    val now = System.currentTimeMillis()
    return ProofAttachment(
        id = "att-$now",
        type = type,
        localUri = uri.toString(),
        remoteUrl = null,
        mimeType = mime,
        createdAt = now,
    )
}
