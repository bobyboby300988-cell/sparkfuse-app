---
name: react-native-worklets RN version pinning
description: react-native-worklets has strict native C++ compatibility per RN version; using a mismatched version causes silent Gradle failures on EAS
---

## Rule
Always match `react-native-worklets` to the installed React Native version. The package ships C++ native code; a version mismatch compiles silently during the JS bundle step but fails at Gradle (EAS reports "Gradle build failed with unknown error" after 400 tasks).

**Compatibility matrix (confirmed):**
- `react-native-worklets` 0.5.x → built for RN ~0.78–0.79
- `react-native-worklets` 0.8.3 → explicitly requires `react-native: "0.81 - 0.85"` ✅

**Why:** The CMakeLists.txt in worklets references `ReactAndroid/cmake-utils/folly-flags.cmake` and uses C++20 against RN's headers. When the worklets version is older than the RN version, the headers mismatch and the linker fails. EAS wraps this as "unknown error."

**How to apply:** When RN version is 0.81.x, use `react-native-worklets: "0.8.3"` (or latest 0.8.x). When upgrading RN, check worklets peerDependencies (`npm info react-native-worklets@X.Y.Z peerDependencies`) before submitting an EAS build.

## Additional: META-INF packaging conflict on EAS
When `mergeReleaseJavaResource` fails with "2 files found with path 'META-INF/versions/9/OSGI-INF/MANIFEST.MF'", the fix is `expo-build-properties` with `android.packagingOptions.pickFirst`. Root cause was `org.jspecify:jspecify` and `com.squareup.okhttp3:logging-interceptor` both shipping the same META-INF file.
