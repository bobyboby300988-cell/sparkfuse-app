const { withGradleProperties } = require("@expo/config-plugins");

/**
 * Replaces org.gradle.jvmargs in android/gradle.properties so the Gradle
 * daemon gets 4 GB of heap instead of the default 2 GB.
 */
module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;

    // Remove any existing org.gradle.jvmargs entries
    const filtered = props.filter(
      (p) => !(p.type === "property" && p.key === "org.gradle.jvmargs")
    );

    // Append our override at the end so it's unambiguous
    filtered.push({
      type: "property",
      key: "org.gradle.jvmargs",
      value: "-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError",
    });

    config.modResults = filtered;
    return config;
  });
};
