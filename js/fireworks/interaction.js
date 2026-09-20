/*
Copyright © 2022 NianBroken. All rights reserved.
Github：https://github.com/NianBroken/Firework_Simulator
Gitee：https://gitee.com/nianbroken/Firework_Simulator
本项目采用 Apache-2.0 许可证
简而言之，你可以自由使用、修改和分享本项目的代码，但前提是在其衍生作品中必须保留原始许可证和版权信息，并且必须以相同的许可证发布所有修改过的代码。
*/

"use strict";

let isUpdatingSpeed = false;
let currentFrame = 0;
let speedBarOpacity = 0;
let autoLaunchTime = 0;

function registerUserInteraction() {
	soundManager.registerInteraction();
}

const topControlButtons = [
	{ nodeSelector: ".pause-btn", action: togglePause },
	{ nodeSelector: ".sound-btn", action: toggleSound },
	{ nodeSelector: ".settings-btn", action: () => toggleMenu() },
	{ nodeSelector: ".show-btn", action: () => setEditorOpen(true) },
	{ nodeSelector: ".wish-btn", action: () => setWishOpen(true) },
];

function pointHitsButton(event, button) {
	if (!button || button.offsetParent === null) {
		return false;
	}

	const scaleX = mainStage.width / (mainStage.canvas.getBoundingClientRect().width || mainStage.width);
	const scaleY = mainStage.height / (mainStage.canvas.getBoundingClientRect().height || mainStage.height);
	const rect = button.getBoundingClientRect();
	const canvasRect = mainStage.canvas.getBoundingClientRect();
	const left = (rect.left - canvasRect.left) * scaleX;
	const right = (rect.right - canvasRect.left) * scaleX;
	const top = (rect.top - canvasRect.top) * scaleY;
	const bottom = (rect.bottom - canvasRect.top) * scaleY;
	return event.x >= left && event.x <= right && event.y >= top && event.y <= bottom;
}

function handlePointerStart(event) {
	registerUserInteraction();

	const controlsVisible = !appNodes.controls.classList.contains("hide");
	if (controlsVisible) {
		for (const control of topControlButtons) {
			if (pointHitsButton(event, document.querySelector(control.nodeSelector))) {
				control.action();
				return;
			}
		}
	}

	if (!isRunning()) {
		return;
	}

	if (showPlayer.isActive()) {
		return;
	}

	if (updateSpeedFromEvent(event)) {
		isUpdatingSpeed = true;
		return;
	}

	if (event.onCanvas) {
		launchShellFromConfig(event);
	}
}

function handlePointerEnd() {
	isUpdatingSpeed = false;
}

function handlePointerMove(event) {
	if (!isRunning() || !isUpdatingSpeed) {
		return;
	}

	updateSpeedFromEvent(event);
}

function handleKeydown(event) {
	registerUserInteraction();

	if (event.keyCode === 80) {
		togglePause();
		return;
	}

	if (event.keyCode === 79) {
		toggleMenu();
		return;
	}

	if (event.keyCode === 27) {
		if (store.state.editorOpen) {
			setEditorOpen(false);
			return;
		}
		if (store.state.wishOpen) {
			setWishOpen(false);
			return;
		}
		toggleMenu(false);
	}
}

function handleResize() {
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;
	const containerWidth = Math.min(viewportWidth, MAX_WIDTH);
	const containerHeight = viewportWidth <= 420 ? viewportHeight : Math.min(viewportHeight, MAX_HEIGHT);

	appNodes.stageContainer.style.width = `${containerWidth}px`;
	appNodes.stageContainer.style.height = `${containerHeight}px`;
	stages.forEach((stage) => stage.resize(containerWidth, containerHeight));

	const scaleFactor = scaleFactorSelector();
	stageW = containerWidth / scaleFactor;
	stageH = containerHeight / scaleFactor;
}

function updateSpeedFromEvent(event) {
	if (isUpdatingSpeed || event.y >= mainStage.height - 44) {
		const edgePadding = 16;
		const newSpeed = (event.x - edgePadding) / (mainStage.width - edgePadding * 2);
		simSpeed = Math.min(Math.max(newSpeed, 0), 1);
		speedBarOpacity = 1;
		return true;
	}

	return false;
}

function updateGlobals(timeStep, lag) {
	currentFrame += 1;

	if (!isUpdatingSpeed) {
		speedBarOpacity -= lag / 30;
		if (speedBarOpacity < 0) {
			speedBarOpacity = 0;
		}
	}

	if (showPlayer.isActive()) {
		showPlayer.tick(timeStep);
		return;
	}

	if (store.state.config.autoLaunch) {
		autoLaunchTime -= timeStep;
		if (autoLaunchTime <= 0) {
			autoLaunchTime = startSequence() * 1.25;
		}
	}
}
