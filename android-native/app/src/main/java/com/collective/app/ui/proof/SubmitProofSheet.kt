package com.collective.app.ui.proof

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.collective.app.ui.brand.CollectiveSheetHeader
import com.collective.app.ui.brand.CollectiveSuccessMark
import com.collective.app.ui.components.CollectiveBottomSheetScaffoldContent
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.theme.CollectiveTokens

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmitProofModalSheet(
    draft: ProofDraftState,
    onTypeSelected: (ProofMediaType) -> Unit,
    onBodyChanged: (String) -> Unit,
    onMediaPicked: (Uri, String?, String?) -> Unit,
    onRemoveAttachment: () -> Unit,
    onSubmit: () -> Unit,
    onDone: () -> Unit,
    onDismiss: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = CollectiveTokens.Cream,
        dragHandle = { SheetHandle() },
    ) {
        SubmitProofSheetContent(
            draft = draft,
            onTypeSelected = onTypeSelected,
            onBodyChanged = onBodyChanged,
            onMediaPicked = onMediaPicked,
            onRemoveAttachment = onRemoveAttachment,
            onSubmit = onSubmit,
            onDone = onDone,
        )
        Spacer(Modifier.height(28.dp))
    }
}

@Composable
fun SubmitProofSheetContent(
    draft: ProofDraftState,
    onTypeSelected: (ProofMediaType) -> Unit,
    onBodyChanged: (String) -> Unit,
    onMediaPicked: (Uri, String?, String?) -> Unit,
    onRemoveAttachment: () -> Unit,
    onSubmit: () -> Unit,
    onDone: () -> Unit,
) {
    val context = LocalContext.current
    fun handlePicked(uri: Uri?) {
        if (uri != null) {
            onMediaPicked(
                uri,
                getDisplayNameForUri(context, uri),
                getMimeTypeForUri(context, uri),
            )
        }
    }

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        handlePicked(uri)
    }
    val videoPicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        handlePicked(uri)
    }
    val audioPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        handlePicked(uri)
    }

    fun launchPicker(type: ProofMediaType) {
        when (type) {
            ProofMediaType.Text -> Unit
            ProofMediaType.Image -> imagePicker.launch(
                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
            )
            ProofMediaType.Video -> videoPicker.launch(
                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly),
            )
            ProofMediaType.Audio -> audioPicker.launch("audio/*")
        }
    }

    CollectiveBottomSheetScaffoldContent {
        if (draft.isSubmitted) {
            ProofSubmittedContent(onDone = onDone)
        } else {
            SubmitProofForm(
                draft = draft,
                onTypeSelected = { type ->
                    onTypeSelected(type)
                    if (type != ProofMediaType.Text) launchPicker(type)
                },
                onBodyChanged = onBodyChanged,
                onAttach = { launchPicker(draft.selectedType) },
                onRemoveAttachment = onRemoveAttachment,
                onSubmit = onSubmit,
            )
        }
    }
}

@Composable
private fun SubmitProofForm(
    draft: ProofDraftState,
    onTypeSelected: (ProofMediaType) -> Unit,
    onBodyChanged: (String) -> Unit,
    onAttach: () -> Unit,
    onRemoveAttachment: () -> Unit,
    onSubmit: () -> Unit,
) {
    CollectiveSheetHeader(
        title = "Submit proof",
        subtitle = "Show what you practiced. It does not need to be perfect.",
    )
    CollectiveCard(radius = 16.dp, padding = 14.dp) {
        Text("Proof is private in this prototype.", color = CollectiveTokens.Text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        Text("You can share more later. Start with what feels safe.", color = CollectiveTokens.Muted, fontSize = 12.sp, lineHeight = 17.sp)
    }
    Text("Proof type", color = CollectiveTokens.Text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    ProofTypeSelector(selectedType = draft.selectedType, onSelected = onTypeSelected)
    Text("What did you practice or improve?", color = CollectiveTokens.Text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    Box {
        OutlinedTextField(
            value = draft.body,
            onValueChange = onBodyChanged,
            modifier = Modifier.fillMaxWidth(),
            minLines = 4,
            shape = RoundedCornerShape(16.dp),
            placeholder = { Text("Write a short reflection...") },
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
        )
        Text(
            text = "${draft.body.length}/280",
            modifier = Modifier.align(Alignment.BottomEnd).padding(end = 12.dp, bottom = 10.dp),
            color = CollectiveTokens.Muted,
            fontSize = 11.sp,
        )
    }
    Text("Attachment", color = CollectiveTokens.Text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    ProofAttachmentPickerCard(
        draft = draft,
        onAttach = onAttach,
        onRemove = onRemoveAttachment,
    )
    draft.errorMessage?.let {
        Text(it, color = CollectiveTokens.Danger, fontSize = 13.sp, lineHeight = 18.sp)
    }
    Text(
        text = "Only share what you are comfortable sharing.",
        color = CollectiveTokens.Muted,
        fontSize = 12.sp,
        lineHeight = 17.sp,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth(),
    )
    CollectivePrimaryButton("Submit proof", onClick = onSubmit)
}

@Composable
private fun ProofSubmittedContent(onDone: () -> Unit) {
    androidx.compose.foundation.layout.Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(16.dp),
    ) {
        CollectiveSuccessMark()
        Text(
            text = "Proof saved.",
            color = CollectiveTokens.Text,
            fontSize = 24.sp,
            lineHeight = 28.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
        Text(
            text = "Feedback can come next.",
            color = CollectiveTokens.Muted,
            fontSize = 15.sp,
            lineHeight = 21.sp,
            textAlign = TextAlign.Center,
        )
        CollectiveCard(radius = CollectiveTokens.CardRadius, padding = 14.dp) {
            Text("What's next?", color = CollectiveTokens.Text, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            listOf(
                "Your proof stays local in this prototype.",
                "You may receive feedback later.",
                "Use feedback to improve.",
            ).forEachIndexed { index, item ->
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Text("${index + 1}", color = CollectiveTokens.Muted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text(item, color = CollectiveTokens.TextSoft, fontSize = 13.sp, lineHeight = 18.sp)
                }
            }
        }
        CollectivePrimaryButton("Got it", onClick = onDone)
    }
}

@Composable
private fun SheetHandle() {
    Box(
        modifier = Modifier
            .padding(top = 10.dp, bottom = 8.dp)
            .size(width = 42.dp, height = 4.dp)
            .clip(CircleShape)
            .background(CollectiveTokens.Line),
    )
}
