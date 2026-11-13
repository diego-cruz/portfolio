/*
* Background video mouse-scrubbing.
* Mouse position relative to the character controls the look direction.
* Seeks are queued through an isSeeking flag so we never flood the decoder.
*/

(function () {
  "use strict";

  // Calibrated against the source: character at 72% of the image width.
  var CHARACTER_X = 0.72;
  var LOOK_LEFT = 0.35;
  var LOOK_CENTER = 0.95;
  var LOOK_RIGHT = 1.35;
  var LOOK_DISTANCE = 250;

  var DESKTOP = "(min-width: 769px)";

  var video = document.getElementById("bg-video");
  if (!video) return;

  // The video is hidden on mobile, so don't spend the download there.
  // Loading is deferred until the viewport is actually wide enough.
  var loaded = false;

  function loadVideo() {
    if (loaded) return;
    var src = video.getAttribute("data-src");
    if (!src) return;
    loaded = true;
    video.poster = "video/diego-bg-poster-left.jpg";
    video.src = src;
    video.load();
  }

  function isDesktop() {
    return !window.matchMedia || window.matchMedia(DESKTOP).matches;
  }

  if (isDesktop()) {
    loadVideo();
  } else if (window.matchMedia) {
    var mq = window.matchMedia(DESKTOP);
    var onChange = function () {
      if (mq.matches) loadVideo();
    };
    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
    } else if (mq.addListener) {
      mq.addListener(onChange);
    }
  }

  var pointerX = null;
  var targetTime = LOOK_LEFT;
  var lastSeekTime = -1;
  var isSeeking = false;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function isReady() {
    return video.readyState >= 1 && isFinite(video.duration) && video.duration > 0;
  }

  function seek() {
    // Nudge away from the exact end: some browsers won't fire "seeked" there.
    var time = Math.min(targetTime, video.duration - 0.05);

    // A no-op seek may not fire "seeked", which would leave isSeeking stuck on.
    if (Math.abs(video.currentTime - time) < 0.001) {
      lastSeekTime = targetTime;
      isSeeking = false;
      return;
    }

    lastSeekTime = targetTime;
    isSeeking = true;
    video.currentTime = time;
  }

  video.addEventListener("seeked", function () {
    if (targetTime !== lastSeekTime) {
      // The mouse moved while we were seeking, so chase the newest target.
      seek();
    } else {
      isSeeking = false;
    }
  });

  video.addEventListener("error", function () {
    isSeeking = false;
  });

  function updateLook() {
    if (!isReady() || !isDesktop()) return;
    var rect = video.getBoundingClientRect();
    // Match object-fit: cover and centered object-position, including cropping.
    var scale = Math.max(rect.width / video.videoWidth, rect.height / video.videoHeight);
    var renderedWidth = video.videoWidth * scale;
    var characterX = rect.left + (rect.width - renderedWidth) / 2 + renderedWidth * CHARACTER_X;
    var position = pointerX === null ? -1 : clamp((pointerX - characterX) / LOOK_DISTANCE, -1, 1);
    targetTime = position < 0
      ? LOOK_CENTER + (-position) * (LOOK_LEFT - LOOK_CENTER)
      : LOOK_CENTER + position * (LOOK_RIGHT - LOOK_CENTER);
    if (!isSeeking) seek();
  }

  video.addEventListener("loadeddata", updateLook);
  window.addEventListener("mousemove", function (e) {
    pointerX = e.clientX;
    updateLook();
  });
  window.addEventListener("resize", updateLook);
})();
