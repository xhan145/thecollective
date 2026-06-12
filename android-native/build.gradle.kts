plugins {
    id("com.android.application") version "9.2.1" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.3.21" apply false
    // Firebase: deferred until a real Firebase project + google-services.json exist. When ready, add:
    //   id("com.google.gms.google-services") version "4.4.2" apply false
    // here, apply it in app/build.gradle.kts, drop google-services.json into app/, and flip
    // BetaConfig.USE_FIREBASE to true. See beta/firebase/FirebaseSchema.md.
}
