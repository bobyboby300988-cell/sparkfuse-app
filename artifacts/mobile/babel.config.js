module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    assumptions: {
      privateFieldsAsProperties: true,
      setPublicClassFields: true,
    },
  };
};
