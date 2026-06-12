package com.collective.app.beta.ui.discover

import com.collective.app.beta.model.Direction
import com.collective.app.beta.ui.BetaSession
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

/** Choose or change a direction. The selected direction is stored on the current user's profile. */
class BetaDiscoverViewModel(private val session: BetaSession) {

    val directions: StateFlow<List<Direction>> = session.repositories.directionRepository.getDirections()

    val selectedDirectionId: StateFlow<String?> =
        session.currentUser
            .map { it.selectedDirectionId }
            .stateIn(session.scope, SharingStarted.Eagerly, session.currentUser.value.selectedDirectionId)

    fun chooseDirection(directionId: String) {
        session.selectDirection(directionId)
    }
}
