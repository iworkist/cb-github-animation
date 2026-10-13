// Entry point: build the model from the data files, assemble the slides, start the loop.
(function () {
  const cfg = window.CB_CONFIG;
  const M = window.ShowModel.build();
  const { playlist, chapters } = window.ShowScenes.build(M, cfg);
  window.Show.run({ cfg, playlist, chapters, names: M.names });
})();
