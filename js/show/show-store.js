"use strict";

(function initShowStore(global) {
	const SHOW_DRAFT_KEY = "cm_fireworks_show_draft";
	const SHOW_LIBRARY_KEY = "cm_fireworks_show_library";
	const WISH_LIST_KEY = "cm_fireworks_wishes";
	const SHOW_FILE_VERSION = 1;
	const MAX_WISHES = 200;
	const MAX_SAVED_SHOWS = 50;
	const MAX_TEXT_LENGTH = 60;
	const SHELL_COLORS = Object.freeze([
		{ value: "random", label: "随机" },
		{ value: "Red", label: "红色" },
		{ value: "Green", label: "绿色" },
		{ value: "Blue", label: "蓝色" },
		{ value: "Purple", label: "紫色" },
		{ value: "Gold", label: "金色" },
		{ value: "White", label: "白色" },
	]);

	let programIdCounter = Date.now();

	function nextProgramId() {
		programIdCounter += 1;
		return `p_${programIdCounter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
	}

	function safeParse(rawValue) {
		try {
			return JSON.parse(rawValue);
		} catch (error) {
			return null;
		}
	}

	function readJson(key) {
		try {
			return safeParse(localStorage.getItem(key));
		} catch (error) {
			return null;
		}
	}

	function writeJson(key, value) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
			return true;
		} catch (error) {
			return false;
		}
	}

	function finiteNumber(value, fallback, min, max) {
		const parsed = Number(value);
		if (!Number.isFinite(parsed)) {
			return fallback;
		}

		return Math.min(max, Math.max(min, parsed));
	}

	function normalizeText(value) {
		if (typeof value !== "string") {
			return "";
		}

		return value.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
	}

	function normalizeShellType(value, allowedNames) {
		if (typeof value !== "string") {
			return "Random";
		}

		if (Array.isArray(allowedNames) && allowedNames.includes(value)) {
			return value;
		}

		try {
			if (typeof shellTypes !== "undefined" && shellTypes[value]) {
				return value;
			}
		} catch (error) {
			// shellTypes 尚未定义时回退为 Random
		}

		return "Random";
	}

	function normalizeColor(value) {
		return SHELL_COLORS.some((option) => option.value === value) ? value : "random";
	}

	function normalizeProgram(rawProgram, allowedNames, keepId) {
		const raw = rawProgram && typeof rawProgram === "object" ? rawProgram : {};
		const wordEnabled = raw.wordEnabled === true;
		return {
			id: keepId && raw.id ? String(raw.id) : nextProgramId(),
			name: normalizeText(raw.name) || "未命名节目",
			time: finiteNumber(raw.time, 0, 0, 86400),
			shell: normalizeShellType(raw.shell, allowedNames),
			size: finiteNumber(raw.size, 2, 0, 5),
			color: normalizeColor(raw.color),
			x: finiteNumber(raw.x, 0.5, 0, 1),
			height: finiteNumber(raw.height, 0.55, 0, 1),
			wordEnabled,
			word: wordEnabled ? normalizeText(raw.word) : "",
		};
	}

	function sortPrograms(programs) {
		return programs
			.slice()
			.sort((first, second) => first.time - second.time || first.id.localeCompare(second.id));
	}

	function normalizeShow(rawShow, allowedNames) {
		const raw = rawShow && typeof rawShow === "object" ? rawShow : {};
		const rawPrograms = Array.isArray(raw.programs) ? raw.programs : [];
		const usedIds = new Set();
		const programs = rawPrograms.map((rawProgram) => {
			const program = normalizeProgram(rawProgram, allowedNames, Boolean(rawProgram && rawProgram.id));
			while (usedIds.has(program.id)) {
				program.id = nextProgramId();
			}
			usedIds.add(program.id);
			return program;
		});

		return {
			id: typeof raw.id === "string" && raw.id ? raw.id : nextProgramId(),
			name: normalizeText(raw.name) || "我的烟花秀",
			updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : Date.now(),
			programs: sortPrograms(programs),
		};
	}

	function createEmptyShow() {
		return {
			id: nextProgramId(),
			name: "",
			updatedAt: Date.now(),
			programs: [],
		};
	}

	function loadDraftShow(allowedNames) {
		const parsed = readJson(SHOW_DRAFT_KEY);
		if (!parsed) {
			return createEmptyShow();
		}

		return normalizeShow(parsed, allowedNames);
	}

	function saveDraftShow(show) {
		writeJson(SHOW_DRAFT_KEY, { ...show, updatedAt: Date.now() });
	}

	function loadSavedShows(allowedNames) {
		const parsed = readJson(SHOW_LIBRARY_KEY);
		const list = Array.isArray(parsed) ? parsed : [];
		return list.slice(0, MAX_SAVED_SHOWS).map((item) => normalizeShow(item, allowedNames));
	}

	function persistSavedShows(shows) {
		writeJson(SHOW_LIBRARY_KEY, shows.slice(0, MAX_SAVED_SHOWS));
	}

	function saveShowToLibrary(show) {
		const rawList = readJson(SHOW_LIBRARY_KEY);
		const savedShows = Array.isArray(rawList) ? rawList.slice(0, MAX_SAVED_SHOWS) : [];
		const libraryShow = {
			...show,
			id: show.id || nextProgramId(),
			name: show.name || "未命名节目单",
			updatedAt: Date.now(),
		};
		const existingIndex = savedShows.findIndex((item) => item.id === libraryShow.id);
		if (existingIndex >= 0) {
			savedShows[existingIndex] = libraryShow;
		} else {
			savedShows.unshift(libraryShow);
		}

		persistSavedShows(savedShows);
		return libraryShow;
	}

	function exportShow(show) {
		const payload = {
			app: "firework-simulator-show",
			version: SHOW_FILE_VERSION,
			exportedAt: new Date().toISOString(),
			show: {
				name: show.name,
				programs: show.programs.map((program) => ({
					name: program.name,
					time: program.time,
					shell: program.shell,
					size: program.size,
					color: program.color,
					x: program.x,
					height: program.height,
					wordEnabled: program.wordEnabled,
					word: program.word,
				})),
			},
		};
		return JSON.stringify(payload, null, 2);
	}

	function parseImportedShow(text, allowedNames) {
		const parsed = safeParse(text);
		if (!parsed || typeof parsed !== "object") {
			throw new Error("文件不是有效的 JSON");
		}

		const showPayload = parsed.app === "firework-simulator-show" ? parsed.show : parsed;
		if (!showPayload || typeof showPayload !== "object" || !Array.isArray(showPayload.programs)) {
			throw new Error("文件中没有找到节目数据");
		}

		return normalizeShow(showPayload, allowedNames);
	}

	function createProgram(defaults) {
		const settings = defaults || {};
		const word = normalizeText(settings.word);
		return {
			id: nextProgramId(),
			name: normalizeText(settings.name) || "未命名节目",
			time: finiteNumber(settings.time, 0, 0, 86400),
			shell: settings.shell || "Random",
			size: finiteNumber(settings.size, 2, 0, 5),
			color: normalizeColor(settings.color),
			x: finiteNumber(settings.x, 0.5, 0, 1),
			height: finiteNumber(settings.height, 0.55, 0, 1),
			wordEnabled: word ? true : settings.wordEnabled === true,
			word,
		};
	}

	function normalizeWish(rawWish) {
		const raw = rawWish && typeof rawWish === "object" ? rawWish : {};
		return {
			id: typeof raw.id === "string" && raw.id ? raw.id : nextProgramId(),
			text: normalizeText(raw.text),
			createdAt: Number.isFinite(Number(raw.createdAt)) ? Number(raw.createdAt) : Date.now(),
		};
	}

	function loadWishes() {
		const parsed = readJson(WISH_LIST_KEY);
		const list = Array.isArray(parsed) ? parsed : [];
		return list
			.map(normalizeWish)
			.filter((wish) => wish.text)
			.slice(0, MAX_WISHES);
	}

	function saveWishes(wishes) {
		writeJson(
			WISH_LIST_KEY,
			wishes
				.filter((wish) => wish && wish.text)
				.slice(0, MAX_WISHES)
				.map((wish) => ({ id: wish.id, text: wish.text, createdAt: wish.createdAt }))
		);
	}

	function addWish(text) {
		const normalizedText = normalizeText(text);
		if (!normalizedText) {
			return null;
		}

		const wish = {
			id: nextProgramId(),
			text: normalizedText,
			createdAt: Date.now(),
		};
		const wishes = [wish, ...loadWishes()].slice(0, MAX_WISHES);
		saveWishes(wishes);
		return wish;
	}

	global.FireworksShowStore = Object.freeze({
		createEmptyShow,
		createProgram,
		normalizeShow,
		normalizeProgram,
		sortPrograms,
		loadDraftShow,
		saveDraftShow,
		loadSavedShows,
		saveShowToLibrary,
		exportShow,
		parseImportedShow,
		loadWishes,
		saveWishes,
		addWish,
		shellColorOptions: SHELL_COLORS,
	});
})(window);
