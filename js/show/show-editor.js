"use strict";

(function initShowEditor(global) {
	const { FireworksAppConfig, FireworksShowStore } = global;
	let nodes;
	let show;
	let open = false;
	let initialized = false;
	let statusTimer = 0;

	const sizeOptions = ['3"', '4"', '6"', '8"', '12"', '16"'];

	function getShellNames() {
		return typeof shellNames !== "undefined" && Array.isArray(shellNames) && shellNames.length ? shellNames : ["Random"];
	}

	function cacheNodes() {
		nodes = {
			editor: document.querySelector(FireworksAppConfig.selectors.showEditor),
			close: document.querySelector(FireworksAppConfig.selectors.showEditorClose),
			nameInput: document.querySelector(FireworksAppConfig.selectors.showNameInput),
			addBtn: document.querySelector(FireworksAppConfig.selectors.showAddBtn),
			playBtn: document.querySelector(FireworksAppConfig.selectors.showPlayBtn),
			exportBtn: document.querySelector(FireworksAppConfig.selectors.showExportBtn),
			importBtn: document.querySelector(FireworksAppConfig.selectors.showImportBtn),
			importFile: document.querySelector(FireworksAppConfig.selectors.showImportFile),
			status: document.querySelector(FireworksAppConfig.selectors.showStatus),
			list: document.querySelector(FireworksAppConfig.selectors.showProgramList),
			track: document.querySelector(FireworksAppConfig.selectors.showTimelineTrack),
			timelineTotal: document.querySelector(FireworksAppConfig.selectors.showTimelineTotal),
			openBtn: document.querySelector(FireworksAppConfig.selectors.showBtn),
		};
	}

	function showStatus(message, isError) {
		clearTimeout(statusTimer);
		nodes.status.textContent = message;
		nodes.status.dataset.state = isError ? "error" : "success";
		if (message) {
			statusTimer = setTimeout(() => {
				nodes.status.textContent = "";
			}, 2600);
		}
	}

	function persist() {
		FireworksShowStore.sortPrograms(show.programs);
		FireworksShowStore.saveDraftShow(show);
		FireworksShowStore.saveShowToLibrary(show);
	}

	function formatTime(seconds) {
		const totalSeconds = Math.max(0, Math.round(seconds));
		const minutes = Math.floor(totalSeconds / 60);
		const remainSeconds = totalSeconds % 60;
		return `${minutes}:${String(remainSeconds).padStart(2, "0")}`;
	}

	function shellOptionsMarkup(selected) {
		return getShellNames()
			.map((name) => `<option value="${name}"${name === selected ? " selected" : ""}>${name}</option>`)
			.join("");
	}

	function colorOptionsMarkup(selected) {
		return FireworksShowStore.shellColorOptions
			.map(
				(option) =>
					`<option value="${option.value}"${option.value === selected ? " selected" : ""}>${option.label}</option>`
			)
			.join("");
	}

	function sizeOptionsMarkup(selectedSize) {
		return sizeOptions
			.map((label, index) => `<option value="${index}"${index === selectedSize ? " selected" : ""}>${label}</option>`)
			.join("");
	}

	function rowMarkup(program, index) {
		const wordChecked = program.wordEnabled ? " checked" : "";
		const wordValue = program.word ? program.word.replace(/"/g, "&quot;") : "";
		const positionPercent = Math.round(program.x * 100);
		return `
			<div class="show-program" data-id="${program.id}">
				<div class="show-program__main">
					<span class="show-program__index">${index + 1}</span>
					<input class="show-program__name" type="text" maxlength="20" value="${program.name.replace(/"/g, "&quot;")}" placeholder="节目名称" />
					<button class="show-program__delete" type="button" aria-label="删除节目">删除</button>
				</div>
				<div class="show-program__fields">
					<label>时间(秒)
						<input class="show-program__time" type="number" min="0" step="0.1" value="${Math.round(program.time * 10) / 10}" />
					</label>
					<label>类型
						<select class="show-program__shell">${shellOptionsMarkup(program.shell)}</select>
					</label>
					<label>大小
						<select class="show-program__size">${sizeOptionsMarkup(program.size)}</select>
					</label>
					<label>颜色
						<select class="show-program__color">${colorOptionsMarkup(program.color)}</select>
					</label>
				</div>
				<div class="show-program__fields">
					<label class="show-program__position"><span class="show-program__position-label">发射位置 ${positionPercent}%</span>
						<input class="show-program__x" type="range" min="0" max="100" value="${positionPercent}" />
					</label>
					<label class="show-program__word-check">文字烟花
						<input class="show-program__word-enabled" type="checkbox"${wordChecked} />
					</label>
					<input class="show-program__word" type="text" maxlength="12" value="${wordValue}" placeholder="文字内容"${program.wordEnabled ? "" : " disabled"} />
				</div>
			</div>`;
	}

	function getMaxTime() {
		return show.programs.reduce((max, program) => Math.max(max, program.time), 0);
	}

	function renderTimeline() {
		const maxTime = getMaxTime();
		nodes.track.innerHTML = show.programs
			.map((program, index) => {
				const left = maxTime > 0 ? (program.time / maxTime) * 100 : 0;
				return `<button class="show-timeline__mark" data-id="${program.id}" style="left:${left}%" title="${formatTime(program.time)} · ${program.name}">${index + 1}</button>`;
			})
			.join("");
		nodes.timelineTotal.textContent = `${formatTime(maxTime)} 总时长`;
	}

	function renderList() {
		if (!show.programs.length) {
			nodes.list.innerHTML = `<div class="show-program-list__empty">还没有节目，点击「添加节目」开始编排</div>`;
		} else {
			nodes.list.innerHTML = show.programs.map(rowMarkup).join("");
		}

		renderTimeline();
	}

	function renderAll() {
		nodes.nameInput.value = show.name;
		renderList();
	}

	function findProgram(id) {
		return show.programs.find((program) => program.id === id);
	}

	function updateProgramFromField(program, field, value) {
		switch (field) {
			case "name":
				program.name = String(value).slice(0, 20) || "未命名节目";
				break;
			case "time":
				program.time = Math.min(86400, Math.max(0, Number(value) || 0));
				break;
			case "shell":
				program.shell = getShellNames().includes(value) ? value : "Random";
				break;
			case "size":
				program.size = Math.min(5, Math.max(0, Number(value) || 0));
				break;
			case "color":
				program.color = value;
				break;
			case "x":
				program.x = Math.min(100, Math.max(0, Number(value) || 0)) / 100;
				break;
			case "wordEnabled":
				program.wordEnabled = Boolean(value);
				break;
			case "word":
				program.word = String(value).slice(0, 12);
				break;
			default:
				break;
		}
	}

	function bindListEvents() {
		nodes.list.addEventListener("input", (event) => {
			const row = event.target.closest(".show-program");
			if (!row) {
				return;
			}

			const program = findProgram(row.dataset.id);
			if (!program) {
				return;
			}

			const target = event.target;
			if (target.classList.contains("show-program__name")) {
				updateProgramFromField(program, "name", target.value);
				persist();
				return;
			}

			if (target.classList.contains("show-program__word")) {
				updateProgramFromField(program, "word", target.value);
				persist();
				return;
			}

			if (target.classList.contains("show-program__x")) {
				updateProgramFromField(program, "x", target.value);
				const labelNode = row.querySelector(".show-program__position-label");
				if (labelNode) {
					labelNode.textContent = `发射位置 ${target.value}%`;
				}
				persist();
				renderTimeline();
			}
		});

		nodes.list.addEventListener("change", (event) => {
			const row = event.target.closest(".show-program");
			if (!row) {
				return;
			}

			const program = findProgram(row.dataset.id);
			if (!program) {
				return;
			}

			const target = event.target;
			const fieldMap = {
				"show-program__time": "time",
				"show-program__shell": "shell",
				"show-program__size": "size",
				"show-program__color": "color",
				"show-program__word-enabled": "wordEnabled",
			};
			const field = fieldMap[target.className];
			if (field) {
				updateProgramFromField(program, field, target.type === "checkbox" ? target.checked : target.value);
				if (field === "wordEnabled") {
					const wordInput = row.querySelector(".show-program__word");
					wordInput.disabled = !program.wordEnabled;
					if (program.wordEnabled && !program.word) {
						wordInput.focus();
					}
				}
				persist();
				renderTimeline();
			}
		});

		nodes.list.addEventListener("click", (event) => {
			if (!event.target.classList.contains("show-program__delete")) {
				return;
			}

			const row = event.target.closest(".show-program");
			const program = row && findProgram(row.dataset.id);
			if (!program) {
				return;
			}

			show.programs = show.programs.filter((item) => item.id !== program.id);
			persist();
			renderList();
			showStatus("节目已删除");
		});

		nodes.track.addEventListener("click", (event) => {
			const mark = event.target.closest(".show-timeline__mark");
			if (!mark) {
				return;
			}

			const row = nodes.list.querySelector(`.show-program[data-id="${mark.dataset.id}"]`);
			if (row) {
				row.scrollIntoView({ behavior: "smooth", block: "center" });
				row.classList.add("show-program--flash");
				setTimeout(() => row.classList.remove("show-program--flash"), 900);
			}
		});
	}

	function suggestNextTime() {
		if (!show.programs.length) {
			return 0;
		}

		return Math.round((getMaxTime() + 3) * 10) / 10;
	}

	function addProgram() {
		const time = suggestNextTime();
		const program = FireworksShowStore.createProgram({
			name: `节目 ${show.programs.length + 1}`,
			time,
			shell: store.state.config.shell,
			size: Number(store.state.config.size),
		});
		show.programs.push(program);
		FireworksShowStore.sortPrograms(show.programs);
		persist();
		renderList();
		setTimeout(() => {
			const row = nodes.list.querySelector(`.show-program[data-id="${program.id}"]`);
			if (row) {
				row.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}, 0);
		showStatus("节目已添加");
	}

	function downloadShowFile() {
		const fileName = `${show.name || "烟花秀节目单"}.json`;
		const blob = new Blob([FireworksShowStore.exportShow(show)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	function importShowFile(file) {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const importedShow = FireworksShowStore.parseImportedShow(String(reader.result), getShellNames());
				importedShow.id = show.id;
				show = importedShow;
				persist();
				renderAll();
				showStatus(`已导入「${show.name}」，共 ${show.programs.length} 个节目`);
			} catch (error) {
				showStatus(error.message || "导入失败", true);
			}
		};
		reader.onerror = () => showStatus("读取文件失败", true);
		reader.readAsText(file);
	}

	function startPlayback() {
		if (!show.programs.length) {
			showStatus("节目单是空的，先添加节目", true);
			return;
		}

		persist();
		setOpen(false);
		global.startShowPlayback(show);
	}

	function setOpen(nextOpen) {
		if (nextOpen && !initialized) {
			init();
		}

		open = nextOpen;
		nodes.editor.classList.toggle("hide", !open);
		if (open) {
			if (global.setWishPanelOpen) {
				global.setWishPanelOpen(false);
			}
			renderAll();
		}
	}

	function getShow() {
		return show;
	}

	function bindEvents() {
		nodes.openBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			setOpen(!open);
		});
		nodes.close.addEventListener("click", () => setOpen(false));
		nodes.addBtn.addEventListener("click", addProgram);
		nodes.playBtn.addEventListener("click", startPlayback);
		nodes.exportBtn.addEventListener("click", downloadShowFile);
		nodes.importBtn.addEventListener("click", () => nodes.importFile.click());
		nodes.importFile.addEventListener("change", () => {
			const file = nodes.importFile.files && nodes.importFile.files[0];
			if (file) {
				importShowFile(file);
			}
			nodes.importFile.value = "";
		});
		nodes.nameInput.addEventListener("input", () => {
			show.name = nodes.nameInput.value.slice(0, 40);
			persist();
		});
		bindListEvents();
	}

	function init() {
		if (initialized) {
			return;
		}

		cacheNodes();
		show = FireworksShowStore.loadDraftShow(getShellNames());
		bindEvents();
		renderAll();
		initialized = true;
	}

	global.initShowEditor = init;
	global.toggleShowEditor = () => setOpen(!open);
	global.isShowEditorOpen = () => open;
	global.setShowEditorOpen = setOpen;
	global.getEditorShow = getShow;
})(window);
