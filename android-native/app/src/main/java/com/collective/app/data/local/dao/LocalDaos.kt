package com.collective.app.data.local.dao

import com.collective.app.data.local.entity.ActivityEntity
import com.collective.app.data.local.entity.AiRunEntity
import com.collective.app.data.local.entity.AiSafetyReviewEntity
import com.collective.app.data.local.entity.FeedbackEntity
import com.collective.app.data.local.entity.PracticeCompletionEntity
import com.collective.app.data.local.entity.PracticeSessionEntity
import com.collective.app.data.local.entity.ProofEntity
import com.collective.app.data.local.entity.ProofMediaEntity
import com.collective.app.data.local.entity.TrustEventEntity
import com.collective.app.data.local.entity.UserPreferenceEntity

interface PracticeSessionDao {
    fun all(): List<PracticeSessionEntity>
    fun upsert(entity: PracticeSessionEntity)
}

interface PracticeCompletionDao {
    fun all(): List<PracticeCompletionEntity>
    fun insert(entity: PracticeCompletionEntity)
}

interface ProofDao {
    fun all(): List<ProofEntity>
    fun upsert(entity: ProofEntity)
    fun update(entity: ProofEntity)
}

interface FeedbackDao {
    fun all(): List<FeedbackEntity>
    fun insert(entity: FeedbackEntity)
}

interface ProofMediaDao {
    fun all(): List<ProofMediaEntity>
    fun upsert(entity: ProofMediaEntity)
}

interface TrustEventDao {
    fun all(): List<TrustEventEntity>
    fun insert(entity: TrustEventEntity)
}

interface ActivityDao {
    fun all(): List<ActivityEntity>
    fun insert(entity: ActivityEntity)
}

interface AiRunDao {
    fun all(): List<AiRunEntity>
    fun insert(entity: AiRunEntity)
    fun clear()
}

interface AiSafetyReviewDao {
    fun all(): List<AiSafetyReviewEntity>
    fun insert(entity: AiSafetyReviewEntity)
}

interface UserPreferenceDao {
    fun all(): List<UserPreferenceEntity>
    fun upsert(entity: UserPreferenceEntity)
}
