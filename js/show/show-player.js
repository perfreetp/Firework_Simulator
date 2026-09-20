"use strict";

(function initShowPlayer(global) {
	const { FireworksAppConfig } = global;
	let nodes;
	let state = null;

	function formatClock(seconds) {
		const totalSeconds = Math.max(0, Math.round(seconds));
		const minutes = Math.floor(totalSeconds / 60);
		const remainSeconds = totalSeconds % 60;
		return `${minutes}:${String(remainSeconds).padStart(2, "0")}`;
	}

	function cacheNodes() {
		nodes = {
			player: document.querySelector(FireworksAppConfig.selectors.showPlayer),
			name: document.querySelector(FireworksAppConfig.selectors.showPlayerName),
			current: document.querySelector(FireworksAppConfig.selectors.showPlayerCurrent),
			progressBar: document.querySelector(FireworksAppConfig.selectors.showPlayerProgressBar),
			elapsed: document.querySelector(FireworksAppConfig.selectors.showPlayerElapsed),
			total: document.querySelector(FireworksAppConfig.selectors.showPlayerTotal),
			pauseBtn: document.querySelector(FireworksAppConfig.selectors.showPlayerPauseBtn),
			pauseIcon: document.querySelector(FireworksAppConfig.selectors.showPlayerPauseIcon),
			skipBtn: document.querySelector(FireworksAppConfig.selectors.showPlayerSkipBtn),
			stopBtn: document.querySelector(FireworksAppConfig.selectors.showPlayerStopBtn),
		};
	}

	function getActiveIndex() {
		if (!state) {
			return -1;
		}

		let activeIndex = -1;
		for (let index = 0; index < state.programs.length; index += 1) {
			if (state.fired.has(state.programs[index].id)) {
				activeIndex = index;
			}
		}

		if (activeIndex < 0) {
			activeIndex = Math.min(state.nextIndex, state.programs.length - 1);
		}

		return activeIndex;
	}

	function getCurrentProgram() {
		if (!state) {
			return null;
		}

		return state.programs[getActiveIndex()] || null;
	}

	function render() {
		if (!state) {
			nodes.player.classList.add("hide");
			return;
		}

		nodes.player.classList.remove("hide");
		nodes.name.textContent = state.name;
		const program = getCurrentProgram();
		const activeIndex = getActiveIndex();
		if (program) {
			nodes.current.textContent = `当前节目：${program.name}（${activeIndex + 1}/${state.programs.length}）`;
		} else {
			nodes.current.textContent = "播放结束";
		}

		const progress = state.totalTime > 0 ? Math.min(1, state.elapsed / state.totalTime) : 1;
		nodes.progressBar.style.width = `${progress * 100}%`;
		nodes.elapsed.textContent = formatClock(state.elapsed);
		nodes.total.textContent = formatClock(state.totalTime);
		const pauseIcon = store.state.paused || state.paused ? "#icon-play" : "#icon-pause";
		nodes.pauseIcon.setAttribute("href", pauseIcon);
		nodes.pauseIcon.setAttribute("xlink:href", pauseIcon);
	}

	function finishPlayback() {
		if (!state) {
			return;
		}

		state = null;
		render();
		if (global.togglePause) {
			global.togglePause(false);
		}
	}

	function skipCurrentProgram() {
		if (!state || store.state.paused) {
			return;
		}

		const targetIndex = state.fired.size === 0 ? state.nextIndex : getActiveIndex() + 1;
		if (targetIndex >= state.programs.length) {
			finishPlayback();
			return;
		}

		const program = state.programs[targetIndex];
		state.elapsed = program.time;
		for (let index = state.nextIndex; index <= targetIndex; index += 1) {
			const skipped = state.programs[index];
			if (!state.fired.has(skipped.id)) {
				state.fired.add(skipped.id);
				global.launchProgramShell(skipped);
			}
		}
		state.nextIndex = targetIndex + 1;
		render();
	}

	function setPaused(paused) {
		if (!state) {
			return;
		}

		if (global.togglePause) {
			global.togglePause(paused);
		}
		render();
	}

	function startPlayback(show) {
		const programs = (show.programs || []).slice().sort((first, second) => first.time - second.time);
		if (!programs.length) {
			return;
		}

		const totalTime = programs[programs.length - 1].time + 4;
		state = {
			name: show.name || "我的烟花秀",
			programs,
			nextIndex: 0,
			elapsed: 0,
			totalTime,
			paused: false,
			fired: new Set(),
		};

		if (global.setShowEditorOpen) {
			global.setShowEditorOpen(false);
		}
		if (global.setWishPanelOpen) {
			global.setWishPanelOpen(false);
		}
		if (global.togglePause) {
			global.togglePause(false);
		}

		render();
	}

	function updatePlayback(timeStepMs) {
		if (!state) {
			return;
		}

		const effectivelyPaused = store.state.paused || store.state.menuOpen;
		if (effectivelyPaused) {
			state.paused = true;
			render();
			return;
		}

		state.paused = false;
		state.elapsed += timeStepMs / 1000;

		while (state.nextIndex < state.programs.length && state.programs[state.nextIndex].time <= state.elapsed) {
			const program = state.programs[state.nextIndex];
			if (!state.fired.has(program.id)) {
				state.fired.add(program.id);
				global.launchProgramShell(program);
			}
			state.nextIndex += 1;
		}

		if (state.elapsed >= state.totalTime) {
			finishPlayback();
			return;
		}

		render();
	}

	function isPlaying() {
		return Boolean(state);
	}

	function bindEvents() {
		nodes.pauseBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			if (!state) {
				return;
			}

			setPaused(!store.state.paused);
		});
		nodes.skipBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			skipCurrentProgram();
		});
		nodes.stopBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			finishPlayback();
		});
	}

	function init() {
		cacheNodes();
		bindEvents();
		render();
	}

	global.initShowPlayer = init;
	global.startShowPlayback = startPlayback;
	global.updateShowPlayback = updatePlayback;
	global.isShowPlaying = isPlaying;
})(window);
