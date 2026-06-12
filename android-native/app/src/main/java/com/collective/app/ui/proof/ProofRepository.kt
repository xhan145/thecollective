package com.collective.app.ui.proof

import kotlinx.coroutines.flow.StateFlow

interface ProofRepository {
    val proofItems: StateFlow<List<ProofItem>>
    fun submitProof(draft: ProofDraftState): ProofItem
    fun getProofById(id: String): ProofItem?
}
