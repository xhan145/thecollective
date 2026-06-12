package com.collective.app.ai.repository

import com.collective.app.ai.model.AiAssistRequest
import com.collective.app.ai.model.AiAssistResponse
import com.collective.app.core.result.AppResult

interface AiAssistRepository {
    fun assist(request: AiAssistRequest): AppResult<AiAssistResponse>
}
