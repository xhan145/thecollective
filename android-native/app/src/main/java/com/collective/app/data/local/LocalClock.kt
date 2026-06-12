package com.collective.app.data.local

import java.time.Instant

object LocalClock {
    fun nowIso(): String = Instant.now().toString()
}
