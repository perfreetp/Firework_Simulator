"use strict";

(function initFireworksAppStore(global) {
	const appConfig = global.FireworksAppConfig;
	const qualityValues = new Set(Object.values(appConfig.qualityLevels).map(String));
	const skyLightingValues = new Set(Object.values(appConfig.skyLightingModes).map(String));
	const scaleFactorValues = new Set(appConfig.scaleFactorOptions.map((value) => value.toFixed(2)));
	const shellSizeValues = new Set(["0", "1", "2", "3", "4", "5"]);
	const programShellNames = new Set([
		"Random",
		"Crackle",
		"Crossette",
		"Crysanthemum",
		"Falling Leaves",
		"Floral",
		"Ghost",
		"Horse Tail",
		"Palm",
		"Ring",
		"Strobe",
		"Willow",
	]);
	const programColorValues = new Set([
		"random",
		"#ff0043",
		"#14fc56",
		"#1e7fff",
		"#e60aff",
		"#ffbf36",
		"#ffffff",
	]);
	const legacyStorageKey = "schemaVersion";

	function isObject(value) {
		return value !== null && typeof value === "object" && !Array.isArray(value);
	}

	function asBoolean(value, fallback) {
		return typeof value === "boolean" ? value : fallback;
	}

	function asString(value, fallback) {
		return typeof value === "string" && value.trim() ? value : fallback;
	}

	function asAllowedString(value, allowedValues, fallback) {
		return allowedValues.has(String(value)) ? String(value) : fallback;
	}

	function asScaleFactor(value, fallback) {
		const parsed = Number(value);
		if (!Number.isFinite(parsed)) {
			return fallback;
		}

		const normalizedValue = parsed.toFixed(2);
		return scaleFactorValues.has(normalizedValue) ? parsed : fallback;
	}

	function normalizeBackground(rawBackground, fallbackBackground, inferConfiguredFromValue = false) {
		const fallback =
			fallbackBackground ||
			({
				mode: "none",
				value: "",
				configured: false,
			});

		if (!isObject(rawBackground)) {
			return { ...fallback };
		}

		const value = typeof rawBackground.value === "string" ? rawBackground.value.trim() : "";
		if (!value) {
			return {
				mode: "none",
				value: "",
				configured: false,
			};
		}

		return {
			mode: rawBackground.mode === "style" ? "style" : "image",
			value,
			configured: typeof rawBackground.configured === "boolean" ? rawBackground.configured : inferConfiguredFromValue,
		};
	}

	function buildDefaultConfig(runtime) {
		let defaultShellSize = "2";
		if (runtime.isDesktop) {
			defaultShellSize = "3";
		} else if (runtime.isHeader) {
			defaultShellSize = "1.2";
		}

		return {
			quality: String(runtime.isHighEndDevice ? appConfig.qualityLevels.high : appConfig.qualityLevels.normal),
			shell: "Random",
			size: defaultShellSize,
			wordShell: false,
			wordShellConfigured: false,
			autoLaunch: true,
			finale: true,
			skyLighting: String(appConfig.skyLightingModes.normal),
			hideControls: runtime.isHeader,
			longExposure: false,
			scaleFactor: runtime.defaultScaleFactor,
		};
	}

	function normalizeConfig(rawConfig, defaultConfig) {
		const config = isObject(rawConfig) ? rawConfig : {};
		return {
			quality: asAllowedString(config.quality, qualityValues, defaultConfig.quality),
			shell: asString(config.shell, defaultConfig.shell),
			size: asAllowedString(config.size, shellSizeValues, defaultConfig.size),
			wordShell: asBoolean(config.wordShell, defaultConfig.wordShell),
			wordShellConfigured: asBoolean(config.wordShellConfigured, defaultConfig.wordShellConfigured),
			autoLaunch: asBoolean(config.autoLaunch, defaultConfig.autoLaunch),
			finale: asBoolean(config.finale, defaultConfig.finale),
			skyLighting: asAllowedString(config.skyLighting, skyLightingValues, defaultConfig.skyLighting),
			hideControls: asBoolean(config.hideControls, defaultConfig.hideControls),
			longExposure: asBoolean(config.longExposure, defaultConfig.longExposure),
			scaleFactor: asScaleFactor(config.scaleFactor, defaultConfig.scaleFactor),
		};
	}

	function normalizeLegacyWordShellConfig(rawConfig, defaultConfig) {
		return {
			...normalizeConfig(rawConfig, defaultConfig),
			wordShell: false,
			wordShellConfigured: false,
		};
	}

	function clampNumber(value, min, max, fallback) {
		const parsed = Number(value);
		if (!Number.isFinite(parsed)) {
			return fallback;
		}

		return Math.min(max, Math.max(min, parsed));
	}

	function normalizeProgram(rawProgram, fallbackIndex) {
		const program = isObject(rawProgram) ? rawProgram : {};
		const time = clampNumber(program.time, 0, 7200000, fallbackIndex * 3000);
		const position = clampNumber(program.position, 0, 1, 0.5);
		const height = clampNumber(program.height, 0, 1, 0.5);
		const sizeIndex = Math.round(clampNumber(program.size, 0, 5, 2));
		const useWord = asBoolean(program.useWord, false);

		const shell = asString(program.shell, "Random");
		const color = asString(program.color, "random");

		return {
			id: typeof program.id === "string" && program.id ? program.id : `p_${Date.now()}_${fallbackIndex}_${Math.random().toString(36).slice(2, 8)}`,
			time,
			shell: programShellNames.has(shell) ? shell : "Random",
			size: String(sizeIndex),
			color: programColorValues.has(color) ? color : "random",
			position,
			height,
			useWord,
			word: useWord ? asString(program.word, "").slice(0, 12) : "",
		};
	}

	function normalizeShow(rawShow, index) {
		const show = isObject(rawShow) ? rawShow : {};
		const rawPrograms = Array.isArray(show.programs) ? show.programs : [];
		const programs = rawPrograms
			.map((program, programIndex) => normalizeProgram(program, programIndex))
			.sort((programA, programB) => programA.time - programB.time);

		return {
			id: typeof show.id === "string" && show.id ? show.id : `show_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
			name: asString(show.name, `未命名烟花秀 ${index + 1}`).slice(0, 30),
			updatedAt: typeof show.updatedAt === "number" ? show.updatedAt : Date.now(),
			programs,
		};
	}

	function normalizeShows(rawShows) {
		if (!Array.isArray(rawShows)) {
			return [];
		}

		return rawShows
			.filter(isObject)
			.map((show, index) => normalizeShow(show, index))
			.slice(-50);
	}

	function normalizeWish(rawWish, index) {
		const wish = isObject(rawWish) ? rawWish : {};
		const text = typeof wish.text === "string" ? wish.text.trim().slice(0, 12) : "";
		if (!text) {
			return null;
		}

		return {
			id: typeof wish.id === "string" && wish.id ? wish.id : `wish_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
			text,
			createdAt: typeof wish.createdAt === "number" ? wish.createdAt : Date.now(),
		};
	}

	function normalizeWishes(rawWishes) {
		if (!Array.isArray(rawWishes)) {
			return [];
		}

		return rawWishes
			.map((wish, index) => normalizeWish(wish, index))
			.filter(Boolean)
			.slice(-100);
	}

	function createDefaultState(runtime) {
		return {
			paused: true,
			soundEnabled: true,
			menuOpen: false,
			editorOpen: false,
			wishOpen: false,
			openHelpTopic: null,
			fullscreen: runtime.fullscreen,
			config: buildDefaultConfig(runtime),
			background: {
				mode: "none",
				value: "",
				configured: false,
			},
			shows: [],
			activeShowId: null,
			wishes: [],
		};
	}

	function readLegacyState(defaultState) {
		if (localStorage.getItem(legacyStorageKey) !== "1") {
			return defaultState;
		}

		const nextState = {
			...defaultState,
			config: { ...defaultState.config },
		};

		try {
			const rawSize = localStorage.getItem("configSize");
			const parsedSize = typeof rawSize === "string" ? JSON.parse(rawSize) : null;
			const sizeValue = String(parseInt(parsedSize, 10));
			if (shellSizeValues.has(sizeValue)) {
				nextState.config.size = sizeValue;
			}
		} catch (error) {
			localStorage.removeItem("configSize");
		}

		return nextState;
	}

	function readStoredState(defaultState) {
		const serializedData = localStorage.getItem(appConfig.storageKey);
		if (!serializedData) {
			return readLegacyState(defaultState);
		}

		try {
			const parsedState = JSON.parse(serializedData);
			if (!isObject(parsedState) || !isObject(parsedState.data)) {
				throw new Error("存储结构无效");
			}

			if (parsedState.schemaVersion === appConfig.storageVersion) {
				return {
					...defaultState,
					config: normalizeConfig(parsedState.data.config, defaultState.config),
					background: normalizeBackground(parsedState.data.background, defaultState.background),
					shows: normalizeShows(parsedState.data.shows),
					activeShowId: typeof parsedState.data.activeShowId === "string" ? parsedState.data.activeShowId : null,
					wishes: normalizeWishes(parsedState.data.wishes),
				};
			}

			if (parsedState.schemaVersion === "2.1" || parsedState.schemaVersion === "2.0") {
				return {
					...defaultState,
					config: normalizeLegacyWordShellConfig(parsedState.data.config, defaultState.config),
					background: normalizeBackground(parsedState.data.background, defaultState.background, true),
					shows: normalizeShows(parsedState.data.shows),
					activeShowId: typeof parsedState.data.activeShowId === "string" ? parsedState.data.activeShowId : null,
					wishes: normalizeWishes(parsedState.data.wishes),
				};
			}

			if (parsedState.schemaVersion === "1.2" || parsedState.schemaVersion === "1.1") {
				return {
					...defaultState,
					config: normalizeLegacyWordShellConfig(parsedState.data, defaultState.config),
					background: { ...defaultState.background },
				};
			}
		} catch (error) {
			localStorage.removeItem(appConfig.storageKey);
		}

		return readLegacyState(defaultState);
	}

	function persistState(state) {
		localStorage.setItem(
			appConfig.storageKey,
			JSON.stringify({
				schemaVersion: appConfig.storageVersion,
				data: {
					config: state.config,
					background: state.background,
					shows: state.shows,
					activeShowId: state.activeShowId,
					wishes: state.wishes,
				},
			})
		);
	}

	function sanitizeActiveShowId(state) {
		if (state.activeShowId && !state.shows.some((show) => show.id === state.activeShowId)) {
			return { ...state, activeShowId: null };
		}

		return state;
	}

	function createStore(defaultState, shouldLoad) {
		const loadedState = shouldLoad ? readStoredState(defaultState) : defaultState;
		const initialState = sanitizeActiveShowId(loadedState);
		return {
			_listeners: new Set(),
			state: initialState,
			setState(nextState) {
				const prevState = this.state;
				this.state = {
					...this.state,
					...nextState,
				};
				this._listeners.forEach((listener) => listener(this.state, prevState));
				persistState(this.state);
			},
			subscribe(listener) {
				this._listeners.add(listener);
				return () => this._listeners.delete(listener);
			},
		};
	}

	global.FireworksAppStore = Object.freeze({
		createDefaultState,
		createStore,
		normalizeBackground,
		normalizeConfig,
		normalizeShow,
		normalizeShows,
		normalizeProgram,
		normalizeWishes,
		normalizeWish,
	});
})(window);
