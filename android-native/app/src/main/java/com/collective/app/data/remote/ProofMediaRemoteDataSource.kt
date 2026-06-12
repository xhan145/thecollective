package com.collective.app.data.remote

import com.collective.app.core.config.AppConfig
import com.collective.app.core.result.AppResult
import com.collective.app.data.model.ProofMediaRecord

interface ProofMediaRemoteDataSource {
    fun uploadProofMedia(record: ProofMediaRecord): AppResult<ProofMediaRecord>
}

class SupabaseProofMediaRemoteDataSource : ProofMediaRemoteDataSource {
    override fun uploadProofMedia(record: ProofMediaRecord): AppResult<ProofMediaRecord> =
        AppResult.Failure(
            message = "Supabase Storage bucket '${AppConfig.proofMediaBucket}' is planned but not connected.",
            recoverable = true,
        )
}
