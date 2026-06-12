package com.collective.app.data.repository

import android.content.Context
import com.collective.app.ai.logging.AiRunLoggerProvider
import com.collective.app.data.local.LocalCollectiveDataSource
import com.collective.app.data.local.datastore.CollectivePreferencesDataStore
import com.collective.app.data.local.db.CollectiveLocalDatabase

object RepositoryProvider {
    private var localDataSource = LocalCollectiveDataSource()
    private var database: CollectiveLocalDatabase? = null
    private var preferencesDataStore: CollectivePreferencesDataStore? = null

    fun initialize(context: Context) {
        if (database != null) return
        database = CollectiveLocalDatabase(context.applicationContext)
        preferencesDataStore = CollectivePreferencesDataStore(context.applicationContext)
        localDataSource = LocalCollectiveDataSource(database)
        AiRunLoggerProvider.initialize(database!!)
    }

    val authRepository: AuthRepository get() = MockAuthRepository(localDataSource)
    val pathRepository: PathRepository get() = DefaultPathRepository(localDataSource)
    val proofRepository: ProofRepository get() = DefaultProofRepository(localDataSource)
    val feedbackRepository: FeedbackRepository get() = DefaultFeedbackRepository(localDataSource)
    val trustRepository: TrustRepository get() = DefaultTrustRepository(localDataSource)
    val mediaRepository: MediaRepository = MockMediaRepository()
    val practiceRepository: PracticeRepository get() = DefaultPracticeRepository(localDataSource)
    val activityRepository: ActivityRepository get() = DefaultActivityRepository(localDataSource)
    val aiRunRepository: AiRunRepository get() = DefaultAiRunRepository(database)
    val aiSafetyReviewRepository: AiSafetyReviewRepository get() = DefaultAiSafetyReviewRepository(database)
    val preferences: CollectivePreferencesDataStore? get() = preferencesDataStore
}
