"use strict";

(function initFireworksShows(global) {
	const appConfig = global.FireworksAppConfig;
	const { normalizeShow, normalizeShows, normalizeProgram, normalizeWish } = global.FireworksAppStore;

	function sortPrograms(programs) {
		return programs.slice().sort((programA, programB) => {
			if (programA.time !== programB.time) {
				return programA.time - programB.time;
			}

			return programA.id < programB.id ? -1 : 1;
		});
	}

	function createShowManager(options) {
		const store = options.store;

		function commit(nextShows, nextActiveShowId) {
			store.setState({
				shows: nextShows,
				activeShowId: nextActiveShowId,
			});
		}

		function getShows() {
			return store.state.shows;
		}

		function getActiveShowId() {
			return store.state.activeShowId;
		}

		function getActiveShow() {
			return getShows().find((show) => show.id === store.state.activeShowId) || null;
		}

		function setActiveShow(showId) {
			if (showId !== null && !getShows().some((show) => show.id === showId)) {
				showId = null;
			}

			store.setState({ activeShowId: showId });
		}

		function createShow(name) {
			const shows = getShows();
			const show = normalizeShow(
				{
					name: name && name.trim() ? name.trim() : `未命名烟花秀 ${shows.length + 1}`,
					programs: [],
					updatedAt: Date.now(),
				},
				shows.length
			);

			commit(shows.concat(show), show.id);
			return show;
		}

		function ensureActiveShow() {
			const activeShow = getActiveShow();
			if (activeShow) {
				return activeShow;
			}

			return createShow("");
		}

		function renameActiveShow(name) {
			const activeShow = getActiveShow();
			if (!activeShow) {
				return;
			}

			updateActiveShow({
				name: (name || "").trim() ? name.trim().slice(0, 30) : activeShow.name,
			});
		}

		function updateActiveShow(patch) {
			const activeShow = getActiveShow();
			if (!activeShow) {
				return;
			}

			const nextShow = normalizeShow(
				{
					...activeShow,
					...patch,
					updatedAt: Date.now(),
				},
				0
			);

			commit(
				getShows().map((show) => (show.id === activeShow.id ? nextShow : show)),
				activeShow.id
			);
		}

		function deleteActiveShow() {
			const activeShow = getActiveShow();
			if (!activeShow) {
				return;
			}

			const remainingShows = getShows().filter((show) => show.id !== activeShow.id);
			commit(remainingShows, remainingShows.length ? remainingShows[0].id : null);
		}

		function addProgram(programData) {
			const activeShow = ensureActiveShow();
			const program = normalizeProgram(programData, activeShow.programs.length);
			const nextShow = normalizeShow(
				{
					...activeShow,
					programs: sortPrograms(activeShow.programs.concat(program)),
					updatedAt: Date.now(),
				},
				0
			);

			commit(
				getShows().map((show) => (show.id === activeShow.id ? nextShow : show)),
				activeShow.id
			);
			return program;
		}

		function updateProgram(programId, patch) {
			const activeShow = getActiveShow();
			if (!activeShow) {
				return;
			}

			const nextPrograms = sortPrograms(
				activeShow.programs.map((program) =>
					program.id === programId ? normalizeProgram({ ...program, ...patch }, 0) : program
				)
			);

			updateActiveShow({ programs: nextPrograms });
		}

		function removeProgram(programId) {
			const activeShow = getActiveShow();
			if (!activeShow) {
				return;
			}

			updateActiveShow({
				programs: activeShow.programs.filter((program) => program.id !== programId),
			});
		}

		function moveProgram(programId, direction) {
			const activeShow = getActiveShow();
			if (!activeShow) {
				return;
			}

			const programs = activeShow.programs.slice();
			const index = programs.findIndex((program) => program.id === programId);
			const targetIndex = index + direction;
			if (index < 0 || targetIndex < 0 || targetIndex >= programs.length) {
				return;
			}

			const target = programs[targetIndex];
			const current = programs[index];
			const currentTime = current.time;
			current.time = target.time;
			target.time = currentTime;
			updateActiveShow({ programs: sortPrograms(programs) });
		}

		function serializeShow(show) {
			const sourceShow = show || getActiveShow();
			if (!sourceShow) {
				return "";
			}

			return JSON.stringify(
				{
					app: "fireworks-show",
					version: appConfig.showFileVersion,
					exportedAt: new Date().toISOString(),
					show: {
						name: sourceShow.name,
						programs: sourceShow.programs,
					},
				},
				null,
				2
			);
		}

		function importShowJson(jsonText) {
			const parsed = JSON.parse(jsonText);
			const rawShow = parsed && parsed.show ? parsed.show : parsed;
			const shows = getShows();
			const show = normalizeShow(rawShow, shows.length);
			show.id = `show_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
			show.programs = show.programs.map((program, index) => ({
				...program,
				id: `p_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
			}));

			commit(shows.concat(show), show.id);
			return show;
		}

		function replaceAllShows(rawShows) {
			const shows = normalizeShows(rawShows);
			commit(shows, shows.length ? shows[0].id : null);
		}

		return {
			getShows,
			getActiveShow,
			getActiveShowId,
			setActiveShow,
			createShow,
			ensureActiveShow,
			renameActiveShow,
			deleteActiveShow,
			addProgram,
			updateProgram,
			removeProgram,
			moveProgram,
			serializeShow,
			importShowJson,
			replaceAllShows,
		};
	}

	function createWishManager(options) {
		const store = options.store;

		function getWishes() {
			return store.state.wishes;
		}

		function addWish(text) {
			const trimmedText = typeof text === "string" ? text.trim().slice(0, 12) : "";
			if (!trimmedText) {
				return null;
			}

			const wish = normalizeWish({ text: trimmedText, createdAt: Date.now() }, 0);
			store.setState({ wishes: getWishes().concat(wish).slice(-100) });
			return wish;
		}

		function clearWishes() {
			store.setState({ wishes: [] });
		}

		return {
			getWishes,
			addWish,
			clearWishes,
		};
	}

	function createId(prefix) {
		return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	}

	global.FireworksShows = Object.freeze({
		createShowManager,
		createWishManager,
		sortPrograms,
		createId,
	});
})(window);
