package com.collective.app.ui.proof

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class MockProofRepository : ProofRepository {
    private val _proofItems = MutableStateFlow(seedProofItems())
    override val proofItems: StateFlow<List<ProofItem>> = _proofItems.asStateFlow()

    override fun submitProof(draft: ProofDraftState): ProofItem {
        val type = if (draft.mediaUri == null) draft.selectedType else inferProofMediaTypeFromMimeType(draft.mediaMimeType).let {
            if (it == ProofMediaType.Text) draft.selectedType else it
        }
        val item = ProofItem(
            id = "proof-local-${System.currentTimeMillis()}",
            title = generateProofTitle(draft.body, type),
            body = draft.body.trim(),
            mediaUri = draft.mediaUri,
            mediaType = type,
            mediaDisplayName = draft.mediaDisplayName,
            mediaMimeType = draft.mediaMimeType,
            createdAtMillis = System.currentTimeMillis(),
            feedbackCount = 0,
            status = ProofStatus.Submitted,
        )
        _proofItems.value = listOf(item) + _proofItems.value
        return item
    }

    override fun getProofById(id: String): ProofItem? =
        _proofItems.value.firstOrNull { it.id == id }

    private fun seedProofItems(): List<ProofItem> {
        val now = System.currentTimeMillis()
        return listOf(
            ProofItem(
                id = "proof-team-meeting",
                title = "Explained my ideas more clearly in our team meeting.",
                body = "I practiced explaining one idea with a clear example.",
                mediaUri = null,
                mediaType = ProofMediaType.Video,
                mediaDisplayName = "Team meeting proof",
                mediaMimeType = null,
                createdAtMillis = now - 2 * 60 * 60 * 1000L,
                feedbackCount = 3,
                status = ProofStatus.FeedbackReady,
            ),
            ProofItem(
                id = "proof-planning-question",
                title = "Asked one useful question during planning.",
                body = "I focused on asking instead of proving.",
                mediaUri = null,
                mediaType = ProofMediaType.Text,
                mediaDisplayName = null,
                mediaMimeType = null,
                createdAtMillis = now - 2 * 24 * 60 * 60 * 1000L,
                feedbackCount = 1,
                status = ProofStatus.FeedbackReady,
            ),
            ProofItem(
                id = "proof-voice-note",
                title = "Recorded a 60-second voice note.",
                body = "I practiced saying one idea out loud.",
                mediaUri = null,
                mediaType = ProofMediaType.Audio,
                mediaDisplayName = "Voice note",
                mediaMimeType = null,
                createdAtMillis = now - 3 * 24 * 60 * 60 * 1000L,
                feedbackCount = 0,
                status = ProofStatus.Submitted,
            ),
        )
    }
}
