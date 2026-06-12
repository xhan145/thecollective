package com.collective.app.data.local.mapper

import com.collective.app.data.local.entity.FeedbackEntity
import com.collective.app.data.local.entity.ProofEntity
import com.collective.app.data.local.entity.ProofMediaEntity
import com.collective.app.data.local.entity.TrustEventEntity
import com.collective.app.data.model.FeedbackKind
import com.collective.app.data.model.FeedbackRecord
import com.collective.app.data.model.MediaKind
import com.collective.app.data.model.ProofLifecycleStatus
import com.collective.app.data.model.ProofMediaRecord
import com.collective.app.data.model.ProofRecord
import com.collective.app.data.model.ProofVisibility
import com.collective.app.data.model.TrustEventRecord
import com.collective.app.data.model.TrustEventSource
import com.collective.app.data.model.UploadStatus

fun ProofRecord.toEntity(): ProofEntity =
    ProofEntity(
        id = id,
        userId = userId,
        pathId = pathId,
        title = title,
        reflectionText = reflectionText,
        feedbackRequest = feedbackRequest,
        mediaKind = media?.mediaKind?.name ?: MediaKind.NONE.name,
        mediaLocalUri = media?.localUri,
        visibility = visibility.name,
        status = status.name,
        feedbackCount = feedbackCount,
        trustWeight = trustWeight,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )

fun ProofEntity.toModel(): ProofRecord =
    ProofRecord(
        id = id,
        userId = userId,
        pathId = pathId,
        title = title,
        reflectionText = reflectionText,
        feedbackRequest = feedbackRequest,
        media = if (mediaKind == MediaKind.NONE.name) null else ProofMediaRecord(
            id = "media-$id",
            proofId = id,
            userId = userId,
            mediaKind = runCatching { MediaKind.valueOf(mediaKind) }.getOrDefault(MediaKind.NONE),
            fileName = null,
            fileType = null,
            fileSizeBytes = null,
            localUri = mediaLocalUri,
            storagePath = null,
            thumbnailUrl = null,
            uploadStatus = UploadStatus.LOCAL_ONLY,
            createdAt = createdAt,
        ),
        visibility = runCatching { ProofVisibility.valueOf(visibility) }.getOrDefault(ProofVisibility.FEEDBACK_ONLY),
        status = runCatching { ProofLifecycleStatus.valueOf(status) }.getOrDefault(ProofLifecycleStatus.SUBMITTED),
        feedbackCount = feedbackCount,
        trustWeight = trustWeight,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )

fun FeedbackRecord.toEntity(): FeedbackEntity =
    FeedbackEntity(id, proofId, reviewerId, feedbackText, feedbackKind.name, helpfulCount, createdAt)

fun FeedbackEntity.toModel(): FeedbackRecord =
    FeedbackRecord(
        id = id,
        proofId = proofId,
        reviewerId = reviewerId,
        feedbackText = feedbackText,
        feedbackKind = runCatching { FeedbackKind.valueOf(feedbackKind) }.getOrDefault(FeedbackKind.SUGGESTION),
        helpfulCount = helpfulCount,
        createdAt = createdAt,
    )

fun ProofMediaRecord.toEntity(): ProofMediaEntity =
    ProofMediaEntity(
        id = id,
        proofId = proofId,
        userId = userId,
        mediaKind = mediaKind.name,
        fileName = fileName,
        fileType = fileType,
        fileSizeBytes = fileSizeBytes,
        localUri = localUri,
        storagePath = storagePath,
        thumbnailUrl = thumbnailUrl,
        uploadStatus = uploadStatus.name,
        createdAt = createdAt,
    )

fun ProofMediaEntity.toModel(): ProofMediaRecord =
    ProofMediaRecord(
        id = id,
        proofId = proofId,
        userId = userId,
        mediaKind = runCatching { MediaKind.valueOf(mediaKind) }.getOrDefault(MediaKind.NONE),
        fileName = fileName,
        fileType = fileType,
        fileSizeBytes = fileSizeBytes,
        localUri = localUri,
        storagePath = storagePath,
        thumbnailUrl = thumbnailUrl,
        uploadStatus = runCatching { UploadStatus.valueOf(uploadStatus) }.getOrDefault(UploadStatus.LOCAL_ONLY),
        createdAt = createdAt,
    )

fun TrustEventRecord.toEntity(): TrustEventEntity =
    TrustEventEntity(id, userId, source.name, sourceId, points, reason, createdAt)

fun TrustEventEntity.toModel(): TrustEventRecord =
    TrustEventRecord(
        id = id,
        userId = userId,
        source = runCatching { TrustEventSource.valueOf(source) }.getOrDefault(TrustEventSource.CONTRIBUTION),
        sourceId = sourceId,
        points = points,
        reason = reason,
        createdAt = createdAt,
    )
