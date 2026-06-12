package com.collective.app.domain.usecase

import com.collective.app.core.result.AppResult
import com.collective.app.data.local.entity.PracticeCompletionEntity
import com.collective.app.data.repository.PracticeRepository
import com.collective.app.data.repository.RepositoryProvider

class CompletePracticeUseCase(
    private val practiceRepository: PracticeRepository = RepositoryProvider.practiceRepository,
) {
    operator fun invoke(pathId: String, practiceId: String): AppResult<PracticeCompletionEntity> =
        practiceRepository.completePractice(pathId = pathId, practiceId = practiceId)
}
