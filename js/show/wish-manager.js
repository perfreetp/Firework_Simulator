"use strict";

(function initWishManager(global) {
	const { FireworksAppConfig, FireworksShowStore } = global;
	let nodes;
	let open = false;
	let wishes = [];

	function cacheNodes() {
		nodes = {
			panel: document.querySelector(FireworksAppConfig.selectors.wishPanel),
			close: document.querySelector(FireworksAppConfig.selectors.wishPanelClose),
			input: document.querySelector(FireworksAppConfig.selectors.wishInput),
			submitBtn: document.querySelector(FireworksAppConfig.selectors.wishSubmitBtn),
			clearBtn: document.querySelector(FireworksAppConfig.selectors.wishClearBtn),
			list: document.querySelector(FireworksAppConfig.selectors.wishList),
			openBtn: document.querySelector(FireworksAppConfig.selectors.wishBtn),
		};
	}

	function formatDate(timestamp) {
		try {
			return new Date(timestamp).toLocaleString("zh-CN", {
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch (error) {
			return "";
		}
	}

	function escapeHtml(text) {
		return text.replace(/[&<>"']/g, (char) => {
			const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
			return map[char];
		});
	}

	function renderList() {
		if (!wishes.length) {
			nodes.list.innerHTML = `<div class="wish-panel__empty">还没有祝福，来做第一个许愿的人吧</div>`;
			return;
		}

		nodes.list.innerHTML = wishes
			.map(
				(wish) => `
				<div class="wish-item">
					<div class="wish-item__text">${escapeHtml(wish.text)}</div>
					<div class="wish-item__time">${formatDate(wish.createdAt)}</div>
				</div>`
			)
			.join("");
	}

	function setOpen(nextOpen) {
		open = nextOpen;
		nodes.panel.classList.toggle("hide", !open);
		if (open) {
			if (global.setShowEditorOpen) {
				global.setShowEditorOpen(false);
			}
			renderList();
			setTimeout(() => nodes.input.focus(), 50);
		}
	}

	function launchWish(text) {
		if (global.togglePause) {
			global.togglePause(false);
		}
		setOpen(false);
		global.launchWordFirework(text, {
			x: 0.2 + Math.random() * 0.6,
		});
	}

	function submitWish() {
		const text = nodes.input.value.replace(/\s+/g, " ").trim().slice(0, 12);
		if (!text) {
			nodes.input.focus();
			return;
		}

		const wish = FireworksShowStore.addWish(text);
		if (wish) {
			wishes = FireworksShowStore.loadWishes();
			renderList();
			nodes.input.value = "";
			launchWish(wish.text);
		}
	}

	function clearWishes() {
		if (!wishes.length) {
			return;
		}

		if (!window.confirm("确定要清空全部祝福历史吗？")) {
			return;
		}

		FireworksShowStore.saveWishes([]);
		wishes = [];
		renderList();
	}

	function bindEvents() {
		nodes.openBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			setOpen(!open);
		});
		nodes.close.addEventListener("click", () => setOpen(false));
		nodes.submitBtn.addEventListener("click", submitWish);
		nodes.clearBtn.addEventListener("click", clearWishes);
		nodes.input.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				submitWish();
			}
		});
	}

	function init() {
		cacheNodes();
		wishes = FireworksShowStore.loadWishes();
		bindEvents();
		renderList();
	}

	global.initWishManager = init;
	global.toggleWishPanel = () => setOpen(!open);
	global.isWishPanelOpen = () => open;
	global.setWishPanelOpen = setOpen;
})(window);
