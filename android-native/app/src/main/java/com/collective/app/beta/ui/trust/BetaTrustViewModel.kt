package com.collective.app.beta.ui.trust

import com.collective.app.beta.model.Proof
import com.collective.app.beta.model.TrustSummary
import com.collective.app.beta.model.nextLevelThreshold
import com.collective.app.beta.model.trustLevelLabel
import com.collective.app.beta.ui.BetaSession
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn

data class BetaTrustUiState(
    val userName: String = "",
    val trust: TrustSummary = TrustSummary(),
    val levelLabel: String = "New",
    val nextThreshold: Int? = 20,
    val myProofs: List<Proof> = emptyList(),
    val isFounder: Boolean = false,
)

/** Calm profile/trust summary for the current user — progress and reliability, never rank. */
@OptIn(ExperimentalCoroutinesApi::class)
class BetaTrustViewModel(private val session: BetaSession) {

    private val repos = session.repositories

    val uiState: StateFlow<BetaTrustUiState> =
        session.currentUser.flatMapLatest { user ->
            combine(
                repos.trustRepository.getTrustSummary(user.id),
                repos.proofRepository.getProofsByUser(user.id),
            ) { trust, proofs ->
                BetaTrustUiState(
                    userName = user.displayName,
                    trust = trust,
                    levelLabel = trustLevelLabel(trust.trustLevel),
                    nextThreshold = nextLevelThreshold(trust.trustLevel),
                    myProofs = proofs,
                    isFounder = session.isFounder,
                )
            }
        }.stateIn(session.scope, SharingStarted.Eagerly, BetaTrustUiState())
}
