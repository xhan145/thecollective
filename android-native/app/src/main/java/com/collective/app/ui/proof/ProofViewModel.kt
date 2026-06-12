package com.collective.app.ui.proof

import android.net.Uri
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class ProofViewModel(
    private val repository: ProofRepository,
) {
    val proofItems: StateFlow<List<ProofItem>> = repository.proofItems

    private val _draft = MutableStateFlow(ProofDraftState())
    val draft: StateFlow<ProofDraftState> = _draft.asStateFlow()

    private val _selectedProof = MutableStateFlow<ProofItem?>(null)
    val selectedProof: StateFlow<ProofItem?> = _selectedProof.asStateFlow()

    private val _latestProof = MutableStateFlow(repository.proofItems.value.firstOrNull())
    val latestProof: StateFlow<ProofItem?> = _latestProof.asStateFlow()

    fun onProofTypeSelected(type: ProofMediaType) {
        _draft.value = _draft.value.copy(
            selectedType = type,
            mediaUri = null,
            mediaDisplayName = null,
            mediaMimeType = null,
            isSubmitted = false,
            errorMessage = null,
        )
    }

    fun onBodyChanged(text: String) {
        _draft.value = _draft.value.copy(
            body = text.take(280),
            isSubmitted = false,
            errorMessage = null,
        )
    }

    fun onMediaPicked(uri: Uri, displayName: String?, mimeType: String?) {
        val inferredType = inferProofMediaTypeFromMimeType(mimeType)
        val nextType = if (inferredType == ProofMediaType.Text) _draft.value.selectedType else inferredType
        _draft.value = _draft.value.copy(
            selectedType = nextType,
            mediaUri = uri.toString(),
            mediaDisplayName = displayName ?: fallbackDisplayName(nextType),
            mediaMimeType = mimeType,
            isSubmitted = false,
            errorMessage = null,
        )
    }

    fun onRemoveAttachment() {
        _draft.value = _draft.value.copy(
            mediaUri = null,
            mediaDisplayName = null,
            mediaMimeType = null,
            errorMessage = null,
        )
    }

    fun onSubmitProof(): Boolean {
        val current = _draft.value
        if (current.body.isBlank() && current.mediaUri == null) {
            _draft.value = current.copy(
                isSubmitting = false,
                isSubmitted = false,
                errorMessage = "Add a short reflection or attach proof before submitting.",
            )
            return false
        }

        _draft.value = current.copy(isSubmitting = true, errorMessage = null)
        val proof = repository.submitProof(current)
        _selectedProof.value = proof
        _latestProof.value = proof
        _draft.value = current.copy(
            isSubmitting = false,
            isSubmitted = true,
            errorMessage = null,
        )
        return true
    }

    fun onProofSelected(proof: ProofItem) {
        _selectedProof.value = proof
    }

    fun onClearSelectedProof() {
        _selectedProof.value = null
    }

    fun onResetDraft() {
        _draft.value = ProofDraftState()
    }

    fun onDismissSuccess() {
        onResetDraft()
    }
}
