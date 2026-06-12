package com.collective.app.data.remote

import com.collective.app.core.result.AppResult
import com.collective.app.data.model.FeedbackDraft
import com.collective.app.data.model.FeedbackRecord
import com.collective.app.data.model.ProofDraft
import com.collective.app.data.model.ProofRecord

interface RemoteCollectiveDataSource {
    fun createProof(draft: ProofDraft): AppResult<ProofRecord>
    fun addFeedback(draft: FeedbackDraft): AppResult<FeedbackRecord>
}

class SupabaseRemoteCollectiveDataSource : RemoteCollectiveDataSource {
    override fun createProof(draft: ProofDraft): AppResult<ProofRecord> =
        AppResult.Failure(
            message = "Remote proof persistence is not connected yet. Demo proof remains local.",
            recoverable = true,
        )

    override fun addFeedback(draft: FeedbackDraft): AppResult<FeedbackRecord> =
        AppResult.Failure(
            message = "Remote feedback persistence is not connected yet. Demo feedback remains local.",
            recoverable = true,
        )
}
