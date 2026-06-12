package com.collective.app.data.repository

import com.collective.app.core.config.CollectiveAppConfig
import com.collective.app.core.config.CollectiveRuntimeConfig
import com.collective.app.data.local.LocalCollectiveServiceLocator
import com.collective.app.data.remote.RemoteAuthRepository
import com.collective.app.data.remote.RemoteFeedbackRepository
import com.collective.app.data.remote.RemoteMediaUploadRepository
import com.collective.app.data.remote.RemoteModerationRepository
import com.collective.app.data.remote.RemoteProofRepository
import com.collective.app.data.remote.RemoteTrustEventRepository

object CollectiveRepositoryFactory {
    fun create(config: CollectiveAppConfig = CollectiveRuntimeConfig.current): CollectiveRepositories {
        return if (config.environment.isRemoteReady) {
            CollectiveRepositories(
                auth = RemoteAuthRepository(),
                proofs = RemoteProofRepository(),
                feedback = RemoteFeedbackRepository(),
                trust = RemoteTrustEventRepository(),
                mediaUploads = RemoteMediaUploadRepository(),
                moderation = RemoteModerationRepository()
            )
        } else {
            LocalCollectiveServiceLocator.createRepositories()
        }
    }
}
