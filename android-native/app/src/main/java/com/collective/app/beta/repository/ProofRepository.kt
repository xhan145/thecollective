package com.collective.app.beta.repository

import com.collective.app.beta.model.Proof
import com.collective.app.beta.model.ProofStatus
import com.collective.app.beta.model.TrustEventType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * Cohort-scoped proof store. Submitting a proof awards the owner a PROOF_SUBMITTED trust event.
 * Note: this is a distinct type from the live `com.collective.app.ui.proof.ProofRepository`.
 */
interface ProofRepository {
    fun getProofFeed(cohortId: String): StateFlow<List<Proof>>
    fun getProofsByUser(userId: String): Flow<List<Proof>>
    fun getProof(proofId: String): Flow<Proof?>
    fun getProofNow(proofId: String): Proof?
    suspend fun saveDraftProof(proof: Proof)
    suspend fun submitProof(proof: Proof): Proof
}

class MockProofRepository(
    seedProofs: List<Proof>,
    private val trustRepository: TrustRepository,
) : ProofRepository {

    private val _proofs = MutableStateFlow(seedProofs)

    override fun getProofFeed(cohortId: String): StateFlow<List<Proof>> = _proofs.asStateFlow()

    override fun getProofsByUser(userId: String): Flow<List<Proof>> =
        _proofs.map { list -> list.filter { it.ownerUserId == userId }.sortedByDescending { it.createdAt } }

    override fun getProof(proofId: String): Flow<Proof?> =
        _proofs.map { list -> list.firstOrNull { it.id == proofId } }

    override fun getProofNow(proofId: String): Proof? = _proofs.value.firstOrNull { it.id == proofId }

    override suspend fun saveDraftProof(proof: Proof) {
        val draft = proof.copy(status = ProofStatus.DRAFT, updatedAt = System.currentTimeMillis())
        upsert(draft)
    }

    override suspend fun submitProof(proof: Proof): Proof {
        val now = System.currentTimeMillis()
        val submitted = proof.copy(
            status = ProofStatus.SUBMITTED,
            createdAt = if (proof.createdAt == 0L) now else proof.createdAt,
            updatedAt = now,
        )
        upsert(submitted)
        trustRepository.addTrustEvent(
            userId = submitted.ownerUserId,
            cohortId = submitted.cohortId,
            type = TrustEventType.PROOF_SUBMITTED,
            sourceId = submitted.id,
        )
        return submitted
    }

    private fun upsert(proof: Proof) {
        val existing = _proofs.value
        _proofs.value = if (existing.any { it.id == proof.id }) {
            existing.map { if (it.id == proof.id) proof else it }
        } else {
            listOf(proof) + existing
        }
    }
}
