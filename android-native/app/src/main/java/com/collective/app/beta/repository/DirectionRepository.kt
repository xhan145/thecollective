package com.collective.app.beta.repository

import com.collective.app.beta.model.Direction
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

interface DirectionRepository {
    fun getDirections(): StateFlow<List<Direction>>
    fun getDirection(directionId: String): Flow<Direction?>
    fun getDirectionNow(directionId: String): Direction?
}

class MockDirectionRepository(
    seedDirections: List<Direction>,
) : DirectionRepository {

    private val _directions = MutableStateFlow(seedDirections)

    override fun getDirections(): StateFlow<List<Direction>> = _directions.asStateFlow()

    override fun getDirection(directionId: String): Flow<Direction?> =
        _directions.map { list -> list.firstOrNull { it.id == directionId } }

    override fun getDirectionNow(directionId: String): Direction? =
        _directions.value.firstOrNull { it.id == directionId }
}
