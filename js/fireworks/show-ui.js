"use strict";

function formatMilliseconds(duration) {
	const totalSeconds = Math.max(0, Math.floor(duration / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function createShowUI(options) {
	const nodes = options.nodes;
	const showManager = options.showManager;
	const wishManager = options.wishManager;
	const player = options.player;
	const shellNames = options.shellNames;
	const colorOptions = window.FireworksAppConfig.shellColorOptions;
	const sizeOptions = ['3"', '4"', '6"', '8"', '12"', '16"'];

	let lastRenderedShowId = null;

	function getElements(container, selectorMap) {
		return Object.keys(selectorMap).reduce((result, key) => {
			result[key] = container.querySelector(selectorMap[key]);
			return result;
		}, {});
	}

	const editor = getElements(nodes.showPanel, {
		select: ".show-select",
		nameInput: ".show-name-input",
		saveBtn: ".show-save-btn",
		newBtn: ".show-new-btn",
		deleteBtn: ".show-delete-btn",
		exportBtn: ".show-export-btn",
		importBtn: ".show-import-btn",
		importFile: ".show-import-file",
		list: ".show-program-list",
		empty: ".show-program-empty",
		total: ".show-total__value",
		form: ".program-add-form",
		time: ".program-time",
		shell: ".program-shell",
		size: ".program-size",
		color: ".program-color",
		position: ".program-position",
		height: ".program-height",
		positionValue: ".program-position-value",
		heightValue: ".program-height-value",
		useWord: ".program-use-word",
		word: ".program-word",
		addBtn: ".program-add-btn",
		playBtn: ".show-play-btn",
	});

	const wishPanel = getElements(nodes.wishPanel, {
		form: ".wish-form",
		input: ".wish-input",
		list: ".wish-list",
		empty: ".wish-empty",
		clearBtn: ".wish-clear-btn",
	});

	const hud = getElements(nodes.playerHud, {
		name: ".player-hud__name",
		index: ".player-hud__index",
		elapsed: ".player-hud__elapsed",
		total: ".player-hud__total",
		progress: ".player-hud__progress-fill",
		pauseBtn: ".player-hud__pause-btn",
		skipBtn: ".player-hud__skip-btn",
		stopBtn: ".player-hud__stop-btn",
	});

	function buildOptions(values, labels) {
		return values
			.map((value, index) => `<option value="${value}">${labels ? labels[index] : value}</option>`)
			.join("");
	}

	function populateForm() {
		editor.shell.innerHTML = buildOptions(shellNames);
		editor.size.innerHTML = buildOptions(["0", "1", "2", "3", "4", "5"], sizeOptions);
		editor.color.innerHTML = buildOptions(
			colorOptions.map((option) => option.value),
			colorOptions.map((option) => option.label)
		);
	}

	function colorLabel(value) {
		const option = colorOptions.find((item) => item.value === value);
		return option ? option.label : "随机";
	}

	function renderShowSelect() {
		const shows = showManager.getShows();
		const activeShow = showManager.getActiveShow();
		editor.select.innerHTML =
			(shows.length
				? ""
				: '<option value="">（暂无节目单）</option>') +
			shows.map((show) => `<option value="${show.id}">${escapeHtml(show.name)}</option>`).join("");

		if (activeShow) {
			editor.select.value = activeShow.id;
			editor.nameInput.value = activeShow.name;
		} else {
			editor.nameInput.value = "";
		}

		editor.deleteBtn.disabled = shows.length === 0;
		editor.exportBtn.disabled = !activeShow;
		editor.playBtn.disabled = !activeShow || activeShow.programs.length === 0;
	}

	function escapeHtml(text) {
		return String(text)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	function renderProgramList() {
		const activeShow = showManager.getActiveShow();
		const programs = activeShow ? activeShow.programs : [];

		editor.empty.style.display = programs.length ? "none" : "block";
		editor.list.innerHTML = programs
			.map((program, index) => {
				const dot =
					program.color && program.color !== "random"
						? `<span class="program-item__color-dot" style="background:${program.color}"></span>`
						: "";
				const wordLine = program.useWord && program.word
					? `<span class="program-item__word">文字：${escapeHtml(program.word)}</span>`
					: "";
				return `
				<div class="program-item" data-id="${program.id}">
					<div class="program-item__row">
						<span class="program-item__time">${formatMilliseconds(program.time)}</span>
						<span class="program-item__desc">
							${dot}${escapeHtml(program.shell)} · ${sizeOptions[Number(program.size)] || sizeOptions[2]} · ${colorLabel(program.color)}
							<br />位置 ${Math.round(program.position * 100)}% · 高度 ${Math.round(program.height * 100)}%
							${wordLine}
						</span>
						<span class="program-item__actions">
							<button type="button" data-action="up" ${index === 0 ? "disabled" : ""}>↑</button>
							<button type="button" data-action="down" ${index === programs.length - 1 ? "disabled" : ""}>↓</button>
							<button type="button" data-action="del">删</button>
						</span>
					</div>
				</div>`;
			})
			.join("");

		const totalDuration = programs.length ? programs[programs.length - 1].time + 6000 : 0;
		editor.total.textContent = formatMilliseconds(totalDuration);
		editor.playBtn.disabled = programs.length === 0;
	}

	function renderEditor() {
		renderShowSelect();
		renderProgramList();
	}

	function renderWishes() {
		const wishes = wishManager.getWishes().slice().reverse();
		wishPanel.empty.style.display = wishes.length ? "none" : "block";
		wishPanel.clearBtn.disabled = wishes.length === 0;
		wishPanel.list.innerHTML = wishes
			.map(
				(wish) => `
			<div class="wish-item" data-id="${wish.id}">
				<span class="wish-item__text">${escapeHtml(wish.text)}</span>
				<span class="wish-item__time">${new Date(wish.createdAt).toLocaleDateString()}</span>
				<button type="button" data-action="replay">再放</button>
			</div>`
			)
			.join("");
	}

	function readProgramForm() {
		const timeSeconds = Number.parseFloat(editor.time.value);
		const time = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) * 1000 : 0;
		return {
			time,
			shell: editor.shell.value,
			size: editor.size.value,
			color: editor.color.value,
			position: Number(editor.position.value),
			height: Number(editor.height.value),
			useWord: editor.useWord.checked,
			word: editor.word.value.trim(),
		};
	}

	function downloadFile(fileName, text) {
		const blob = new Blob([text], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	function exportActiveShow() {
		const activeShow = showManager.getActiveShow();
		if (!activeShow) {
			return;
		}

		const safeName = activeShow.name.replace(/[\\/:*?"<>|]/g, "_") || "fireworks-show";
		downloadFile(`${safeName}.json`, showManager.serializeShow(activeShow));
	}

	function importShowFile(file) {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				showManager.importShowJson(String(reader.result));
			} catch (error) {
				window.alert("导入失败：文件格式不正确");
			}
		};
		reader.readAsText(file);
	}

	function submitWish() {
		const text = wishPanel.input.value.trim();
		if (!text) {
			return;
		}

		const wish = wishManager.addWish(text);
		if (!wish) {
			return;
		}

		wishPanel.input.value = "";
		registerUserInteraction();
		togglePause(false);
		launchWishShell(wish.text);
	}

	function startPlayback() {
		const activeShow = showManager.getActiveShow();
		if (!activeShow || activeShow.programs.length === 0) {
			return;
		}

		if (player.start(activeShow)) {
			options.setEditorOpen(false);
		}
	}

	function setHudIcon(button, iconName) {
		const useNode = button.querySelector("use");
		if (useNode) {
			useNode.setAttribute("href", `#icon-${iconName}`);
			useNode.setAttribute("xlink:href", `#icon-${iconName}`);
		}
	}

	function renderHud(snapshot) {
		nodes.playerHud.classList.toggle("hide", !snapshot.active);
		if (!snapshot.active) {
			return;
		}

		hud.name.textContent = snapshot.showName;
		hud.index.textContent = `第 ${Math.min(snapshot.index + 1, snapshot.total)} / ${snapshot.total} 个节目`;
		hud.elapsed.textContent = formatMilliseconds(snapshot.elapsed);
		hud.total.textContent = formatMilliseconds(snapshot.totalDuration);
		const progress = snapshot.totalDuration ? Math.min(1, snapshot.elapsed / snapshot.totalDuration) : 0;
		hud.progress.style.width = `${progress * 100}%`;
		setHudIcon(hud.pauseBtn, snapshot.paused ? "play" : "pause");
	}

	function bindEvents() {
		editor.select.addEventListener("change", () => {
			showManager.setActiveShow(editor.select.value || null);
		});
		editor.newBtn.addEventListener("click", () => showManager.createShow(""));
		editor.deleteBtn.addEventListener("click", () => {
			if (window.confirm("确定删除当前节目单吗？")) {
				showManager.deleteActiveShow();
			}
		});
		editor.saveBtn.addEventListener("click", () => showManager.renameActiveShow(editor.nameInput.value));
		editor.nameInput.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				showManager.renameActiveShow(editor.nameInput.value);
			}
		});
		editor.exportBtn.addEventListener("click", exportActiveShow);
		editor.importBtn.addEventListener("click", () => editor.importFile.click());
		editor.importFile.addEventListener("change", () => {
			const file = editor.importFile.files && editor.importFile.files[0];
			if (file) {
				importShowFile(file);
			}
			editor.importFile.value = "";
		});

		editor.position.addEventListener("input", () => {
			editor.positionValue.textContent = `${Math.round(Number(editor.position.value) * 100)}%`;
		});
		editor.height.addEventListener("input", () => {
			editor.heightValue.textContent = `${Math.round(Number(editor.height.value) * 100)}%`;
		});
		editor.useWord.addEventListener("change", () => {
			editor.word.disabled = !editor.useWord.checked;
			if (editor.useWord.checked) {
				editor.word.focus();
			}
		});

		editor.form.addEventListener("submit", (event) => {
			event.preventDefault();
			const data = readProgramForm();
			if (data.useWord && !data.word) {
				window.alert("请输入文字烟花内容，或取消文字烟花选项");
				return;
			}
			showManager.addProgram(data);
		});

		editor.list.addEventListener("click", (event) => {
			const button = event.target.closest("button[data-action]");
			if (!button) {
				return;
			}

			const item = event.target.closest(".program-item");
			if (!item) {
				return;
			}

			const action = button.dataset.action;
			if (action === "del") {
				showManager.removeProgram(item.dataset.id);
			} else if (action === "up") {
				showManager.moveProgram(item.dataset.id, -1);
			} else if (action === "down") {
				showManager.moveProgram(item.dataset.id, 1);
			}
		});

		editor.playBtn.addEventListener("click", startPlayback);

		wishPanel.form.addEventListener("submit", (event) => {
			event.preventDefault();
			submitWish();
		});
		wishPanel.clearBtn.addEventListener("click", () => {
			if (window.confirm("确定清空全部祝福吗？")) {
				wishManager.clearWishes();
			}
		});
		wishPanel.list.addEventListener("click", (event) => {
			const button = event.target.closest("button[data-action]");
			if (!button) {
				return;
			}

			const item = event.target.closest(".wish-item");
			const wish = wishManager.getWishes().find((entry) => entry.id === item.dataset.id);
			if (wish) {
				registerUserInteraction();
				togglePause(false);
				launchWishShell(wish.text);
			}
		});

		hud.pauseBtn.addEventListener("click", () => player.togglePaused());
		hud.skipBtn.addEventListener("click", () => player.skipCurrent());
		hud.stopBtn.addEventListener("click", () => player.stop());

		nodes.showPanelCloseBtn.addEventListener("click", () => options.setEditorOpen(false));
		nodes.wishPanelCloseBtn.addEventListener("click", () => options.setWishOpen(false));

		[nodes.showPanel, nodes.wishPanel, nodes.playerHud].forEach((panel) => {
			["mousedown", "touchstart", "mousemove", "touchmove"].forEach((eventName) => {
				panel.addEventListener(eventName, (event) => event.stopPropagation());
			});
		});
	}

	function onStateChange(state) {
		const activeShow = showManager.getActiveShow();
		const activeShowId = activeShow ? activeShow.id : null;
		if (activeShowId !== lastRenderedShowId) {
			lastRenderedShowId = activeShowId;
			renderShowSelect();
		} else if (activeShow) {
			const selectedOption = editor.select.options[editor.select.selectedIndex];
			if (selectedOption && selectedOption.textContent !== activeShow.name) {
				selectedOption.textContent = activeShow.name;
			}
			editor.nameInput.value = activeShow.name;
			editor.deleteBtn.disabled = false;
			editor.exportBtn.disabled = false;
		}
		renderProgramList();
		renderWishes();
		nodes.showPanel.classList.toggle("hide", !state.editorOpen);
		nodes.wishPanel.classList.toggle("hide", !state.wishOpen);
	}

	populateForm();
	bindEvents();
	renderEditor();
	renderWishes();

	return {
		renderEditor,
		renderWishes,
		renderHud,
		onStateChange,
	};
}
