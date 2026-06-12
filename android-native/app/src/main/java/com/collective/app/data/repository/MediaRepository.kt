package com.collective.app.data.repository

import com.collective.app.core.config.AppConfig
import com.collective.app.core.result.AppResult
import com.collective.app.data.local.LocalClock
import com.collective.app.data.model.MediaKind
import com.collective.app.data.model.ProofMediaRecord
import com.collective.app.data.model.UploadStatus
import com.collective.app.data.remote.ProofMediaRemoteDataSource
import com.collective.app.data.remote.SupabaseProofMediaRemoteDataSource
import java.util.UUID

data class ProofMediaInput(
    val userId: String,
    val mediaKind: MediaKind,
    val fileName: String?,
    val fileType: String?,
    val fileSizeBytes: Long?,
    val localUri: String?,
)

interface MediaRepository {
    fun createDemoMediaRecord(input: ProofMediaInput): ProofMediaRecord
    fun prepareStoragePath(userId: String, fileName: String?): String
    fun uploadProofMedia(record: ProofMediaRecord): AppResult<ProofMediaRecord>
}

class MockMediaRepository(
    private val remoteDataSource: ProofMediaRemoteDataSource = SupabaseProofMediaRemoteDataSource(),
) : MediaRepository {
    override fun createDemoMediaRecord(input: ProofMediaInput): ProofMediaRecord =
        ProofMediaRecord(
            id = "media-${UUID.randomUUID()}",
            proofId = null,
            userId = input.userId,
            mediaKind = input.mediaKind,
            fileName = input.fileName,
            fileType = input.fileType,
            fileSizeBytes = input.fileSizeBytes,
            localUri = input.localUri,
            storagePath = prepareStoragePath(input.userId, input.fileName),
            thumbnailUrl = null,
            uploadStatus = UploadStatus.LOCAL_ONLY,
            createdAt = LocalClock.nowIso(),
        )

    override fun prepareStoragePath(userId: String, fileName: String?): String {
        val safeName = fileName
            ?.replace(Regex("[^A-Za-z0-9._-]"), "-")
            ?.take(80)
            ?: "proof-media"
        return "$userId/${UUID.randomUUID()}-$safeName"
    }

    override fun uploadProofMedia(record: ProofMediaRecord): AppResult<ProofMediaRecord> {
        if (AppConfig.isDemoMode) {
            return AppResult.Success(record.copy(uploadStatus = UploadStatus.LOCAL_ONLY))
        }
        return remoteDataSource.uploadProofMedia(record)
    }
}
