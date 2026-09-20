"use strict";

const ShowPlayer = (function createShowPlayer() {
	const tailDuration = 6000;

	function createPlayer(options) {
		const store = options.store;
		let state = {
			active: false,
			showName: "",
			programs: [],
			index: 0,
			nextIndex: 0,
			elapsed: 0,
			totalDuration: 0,
			paused: false,
		};

		function notify() {
			if (typeof options.onChange === "function") {
				options.onChange(getSnapshot());
			}
		}

		function getSnapshot() {
			const displayIndex = Math.min(Math.max(0, state.index), state.programs.length - 1);
			const program = state.programs[displayIndex] || null;
			return {
				active: state.active,
				paused: state.paused,
				showName: state.showName,
				index: displayIndex,
				total: state.programs.length,
				elapsed: state.elapsed,
				totalDuration: state.totalDuration,
				currentProgram: program,
			};
		}

		function fireProgram(program) {
			if (!program) {
				return;
			}

			registerUserInteraction();

			if (program.useWord && program.word) {
				launchShellWithOptions({
					shell: program.shell,
					size: program.size,
					color: program.color,
					position: program.position,
					height: program.height,
					word: program.word,
				});
				return;
			}

			launchShellWithOptions({
				shell: program.shell,
				size: program.size,
				color: program.color,
				position: program.position,
				height: program.height,
			});
		}

		function finish() {
			if (!state.active) {
				return;
			}

			state.active = false;
			state.paused = false;
			state.elapsed = state.totalDuration;
			notify();
			if (typeof options.onFinish === "function") {
				options.onFinish();
			}
		}

		function start(show) {
			if (!show || !Array.isArray(show.programs) || show.programs.length === 0) {
				return false;
			}

			const programs = show.programs
				.slice()
				.map((program) => ({ ...program }))
				.sort((a, b) => a.time - b.time);

			state = {
				active: true,
				showName: show.name || "烟花秀",
				programs,
				index: 0,
				nextIndex: 0,
				elapsed: 0,
				totalDuration: programs[programs.length - 1].time + tailDuration,
				paused: false,
			};

			togglePause(false);
			notify();
			return true;
		}

		function tick(timeStep) {
			if (!state.active || state.paused) {
				return;
			}

			state.elapsed += timeStep;

			while (
				state.nextIndex < state.programs.length &&
				state.elapsed >= state.programs[state.nextIndex].time
			) {
				fireProgram(state.programs[state.nextIndex]);
				state.index = state.nextIndex;
				state.nextIndex += 1;
			}

			if (state.nextIndex >= state.programs.length && state.elapsed >= state.totalDuration) {
				finish();
				return;
			}

			notify();
		}

		function setPaused(paused) {
			if (!state.active) {
				return;
			}

			state.paused = paused;
			togglePause(paused);
			notify();
		}

		function togglePaused() {
			setPaused(!state.paused);
		}

		function skipCurrent() {
			if (!state.active) {
				return;
			}

			if (state.nextIndex >= state.programs.length) {
				state.elapsed = state.totalDuration;
				finish();
				return;
			}

			const nextProgram = state.programs[state.nextIndex];
			state.elapsed = nextProgram.time;
			fireProgram(nextProgram);
			state.index = state.nextIndex;
			state.nextIndex += 1;

			if (state.nextIndex >= state.programs.length) {
				state.elapsed = state.totalDuration;
				finish();
				return;
			}

			notify();
		}

		function stop() {
			if (!state.active) {
				return;
			}

			state.active = false;
			state.paused = false;
			notify();
		}

		function isActive() {
			return state.active;
		}

		function isPaused() {
			return state.paused;
		}

		return {
			start,
			tick,
			skipCurrent,
			stop,
			setPaused,
			togglePaused,
			isActive,
			isPaused,
			getSnapshot,
		};
	}

	return { create: createPlayer };
})();
