export function distributeMarginTracks(pageEl: HTMLElement, win: Window): void {
	for (const loc of ["top", "bottom"] as const) {
		const marginGroup = pageEl.querySelector<HTMLElement>(
			`:is(.printedjs_margin-${loc}, .pagedjs_margin-${loc})`,
		);
		const center = pageEl.querySelector<HTMLElement>(
			`:is(.printedjs_margin-${loc}-center, .pagedjs_margin-${loc}-center)`,
		);
		const left = pageEl.querySelector<HTMLElement>(
			`:is(.printedjs_margin-${loc}-left, .pagedjs_margin-${loc}-left)`,
		);
		const right = pageEl.querySelector<HTMLElement>(
			`:is(.printedjs_margin-${loc}-right, .pagedjs_margin-${loc}-right)`,
		);

		if (!marginGroup || !center || !left || !right) continue;

		const centerContent = center.classList.contains("hasContent");
		const leftContent = left.classList.contains("hasContent");
		const rightContent = right.classList.contains("hasContent");

		let leftWidth: string | undefined;
		let rightWidth: string | undefined;
		let centerWidth: string | undefined;

		if (leftContent) {
			leftWidth = win.getComputedStyle(left).maxWidth;
		}
		if (rightContent) {
			rightWidth = win.getComputedStyle(right).maxWidth;
		}

		if (centerContent) {
			centerWidth = win.getComputedStyle(center).maxWidth;

			if (centerWidth === "none" || centerWidth === "auto") {
				if (!leftContent && !rightContent) {
					marginGroup.style.gridTemplateColumns = "0 1fr 0";
				} else if (leftContent) {
					if (!rightContent) {
						if (leftWidth !== "none" && leftWidth !== "auto" && leftWidth) {
							marginGroup.style.gridTemplateColumns = `${leftWidth} 1fr ${leftWidth}`;
						} else {
							marginGroup.style.gridTemplateColumns = "auto auto 1fr";
							left.style.whiteSpace = "nowrap";
							center.style.whiteSpace = "nowrap";
							const leftOuterWidth = left.offsetWidth;
							const centerOuterWidth = center.offsetWidth;
							const outerwidths = leftOuterWidth + centerOuterWidth;
							const newcenterWidth =
								outerwidths > 0 ? (centerOuterWidth * 100) / outerwidths : 50;
							marginGroup.style.gridTemplateColumns = `minmax(16.66%, 1fr) minmax(33%, ${newcenterWidth}%) minmax(16.66%, 1fr)`;
							left.style.whiteSpace = "normal";
							center.style.whiteSpace = "normal";
						}
					} else {
						if (leftWidth !== "none" && leftWidth !== "auto" && leftWidth) {
							if (rightWidth !== "none" && rightWidth !== "auto" && rightWidth) {
								marginGroup.style.gridTemplateColumns = `${leftWidth} 1fr ${rightWidth}`;
							} else {
								marginGroup.style.gridTemplateColumns = `${leftWidth} 1fr ${leftWidth}`;
							}
						} else {
							if (rightWidth !== "none" && rightWidth !== "auto" && rightWidth) {
								marginGroup.style.gridTemplateColumns = `${rightWidth} 1fr ${rightWidth}`;
							} else {
								marginGroup.style.gridTemplateColumns = "auto auto 1fr";
								left.style.whiteSpace = "nowrap";
								center.style.whiteSpace = "nowrap";
								right.style.whiteSpace = "nowrap";
								const leftOuterWidth = left.offsetWidth;
								const centerOuterWidth = center.offsetWidth;
								const rightOuterWidth = right.offsetWidth;
								const outerwidths = leftOuterWidth + centerOuterWidth + rightOuterWidth;
								const newcenterWidth =
									outerwidths > 0 ? (centerOuterWidth * 100) / outerwidths : 33.33;
								if (newcenterWidth > 40) {
									marginGroup.style.gridTemplateColumns = `minmax(16.66%, 1fr) minmax(33%, ${newcenterWidth}%) minmax(16.66%, 1fr)`;
								} else {
									marginGroup.style.gridTemplateColumns = "repeat(3, 1fr)";
								}
								left.style.whiteSpace = "normal";
								center.style.whiteSpace = "normal";
								right.style.whiteSpace = "normal";
							}
						}
					}
				} else {
					if (rightWidth !== "none" && rightWidth !== "auto" && rightWidth) {
						marginGroup.style.gridTemplateColumns = `${rightWidth} 1fr ${rightWidth}`;
					} else {
						marginGroup.style.gridTemplateColumns = "auto auto 1fr";
						right.style.whiteSpace = "nowrap";
						center.style.whiteSpace = "nowrap";
						const rightOuterWidth = right.offsetWidth;
						const centerOuterWidth = center.offsetWidth;
						const outerwidths = rightOuterWidth + centerOuterWidth;
						const newcenterWidth =
							outerwidths > 0 ? (centerOuterWidth * 100) / outerwidths : 50;
						marginGroup.style.gridTemplateColumns = `minmax(16.66%, 1fr) minmax(33%, ${newcenterWidth}%) minmax(16.66%, 1fr)`;
						right.style.whiteSpace = "normal";
						center.style.whiteSpace = "normal";
					}
				}
			} else if (centerWidth) {
				if (leftContent && leftWidth !== "none" && leftWidth !== "auto" && leftWidth) {
					marginGroup.style.gridTemplateColumns = `${leftWidth} ${centerWidth} 1fr`;
				} else if (
					rightContent &&
					rightWidth !== "none" &&
					rightWidth !== "auto" &&
					rightWidth
				) {
					marginGroup.style.gridTemplateColumns = `1fr ${centerWidth} ${rightWidth}`;
				} else {
					marginGroup.style.gridTemplateColumns = `1fr ${centerWidth} 1fr`;
				}
			}
		} else {
			if (leftContent) {
				if (!rightContent) {
					marginGroup.style.gridTemplateColumns = "1fr 0 0";
				} else {
					if (leftWidth !== "none" && leftWidth !== "auto" && leftWidth) {
						if (rightWidth !== "none" && rightWidth !== "auto" && rightWidth) {
							marginGroup.style.gridTemplateColumns = `${leftWidth} 1fr ${rightWidth}`;
						} else {
							marginGroup.style.gridTemplateColumns = `${leftWidth} 0 1fr`;
						}
					} else {
						if (rightWidth !== "none" && rightWidth !== "auto" && rightWidth) {
							marginGroup.style.gridTemplateColumns = `1fr 0 ${rightWidth}`;
						} else {
							marginGroup.style.gridTemplateColumns = "auto 1fr auto";
							left.style.whiteSpace = "nowrap";
							right.style.whiteSpace = "nowrap";
							const leftOuterWidth = left.offsetWidth;
							const rightOuterWidth = right.offsetWidth;
							const outerwidths = leftOuterWidth + rightOuterWidth;
							const newLeftWidth =
								outerwidths > 0 ? (leftOuterWidth * 100) / outerwidths : 50;
							marginGroup.style.gridTemplateColumns = `minmax(16.66%, ${newLeftWidth}%) 0 1fr`;
							left.style.whiteSpace = "normal";
							right.style.whiteSpace = "normal";
						}
					}
				}
			} else {
				if (rightWidth !== "none" && rightWidth !== "auto" && rightWidth) {
					marginGroup.style.gridTemplateColumns = `1fr 0 ${rightWidth}`;
				} else if (rightContent) {
					marginGroup.style.gridTemplateColumns = "0 0 1fr";
				}
			}
		}
	}

	for (const loc of ["left", "right"] as const) {
		const middle = pageEl.querySelector<HTMLElement>(
			`:is(.printedjs_margin-${loc}-middle, .pagedjs_margin-${loc}-middle).hasContent`,
		);
		const marginGroup = pageEl.querySelector<HTMLElement>(
			`:is(.printedjs_margin-${loc}, .pagedjs_margin-${loc})`,
		);
		const top = pageEl.querySelector<HTMLElement>(
			`:is(.printedjs_margin-${loc}-top, .pagedjs_margin-${loc}-top)`,
		);
		const bottom = pageEl.querySelector<HTMLElement>(
			`:is(.printedjs_margin-${loc}-bottom, .pagedjs_margin-${loc}-bottom)`,
		);

		if (!marginGroup || !top || !bottom) continue;

		const topContent = top.classList.contains("hasContent");
		const bottomContent = bottom.classList.contains("hasContent");

		let topHeight: string | undefined;
		let bottomHeight: string | undefined;

		if (topContent) {
			topHeight = win.getComputedStyle(top).maxHeight;
		}
		if (bottomContent) {
			bottomHeight = win.getComputedStyle(bottom).maxHeight;
		}

		if (middle) {
			const middleHeight = win.getComputedStyle(middle).maxHeight;

			if (middleHeight === "none" || middleHeight === "auto") {
				if (!topContent && !bottomContent) {
					marginGroup.style.gridTemplateRows = "0 1fr 0";
				} else if (topContent) {
					if (!bottomContent) {
						if (topHeight !== "none" && topHeight !== "auto" && topHeight) {
							marginGroup.style.gridTemplateRows = `${topHeight} calc(100% - ${topHeight}*2) ${topHeight}`;
						}
					} else {
						if (topHeight !== "none" && topHeight !== "auto" && topHeight) {
							if (bottomHeight !== "none" && bottomHeight !== "auto" && bottomHeight) {
								marginGroup.style.gridTemplateRows = `${topHeight} calc(100% - ${topHeight} - ${bottomHeight}) ${bottomHeight}`;
							} else {
								marginGroup.style.gridTemplateRows = `${topHeight} calc(100% - ${topHeight}*2) ${topHeight}`;
							}
						} else {
							if (bottomHeight !== "none" && bottomHeight !== "auto" && bottomHeight) {
								marginGroup.style.gridTemplateRows = `${bottomHeight} calc(100% - ${bottomHeight}*2) ${bottomHeight}`;
							}
						}
					}
				} else {
					if (bottomHeight !== "none" && bottomHeight !== "auto" && bottomHeight) {
						marginGroup.style.gridTemplateRows = `${bottomHeight} calc(100% - ${bottomHeight}*2) ${bottomHeight}`;
					}
				}
			} else {
				if (topContent && topHeight !== "none" && topHeight !== "auto" && topHeight) {
					marginGroup.style.gridTemplateRows = `${topHeight} ${middleHeight} calc(100% - (${topHeight} + ${middleHeight}))`;
				} else if (
					bottomContent &&
					bottomHeight !== "none" &&
					bottomHeight !== "auto" &&
					bottomHeight
				) {
					marginGroup.style.gridTemplateRows = `1fr ${middleHeight} ${bottomHeight}`;
				} else {
					marginGroup.style.gridTemplateRows = `calc((100% - ${middleHeight})/2) ${middleHeight} calc((100% - ${middleHeight})/2)`;
				}
			}
		} else {
			if (topContent) {
				if (!bottomContent) {
					marginGroup.style.gridTemplateRows = "1fr 0 0";
				} else {
					if (topHeight !== "none" && topHeight !== "auto" && topHeight) {
						if (bottomHeight !== "none" && bottomHeight !== "auto" && bottomHeight) {
							marginGroup.style.gridTemplateRows = `${topHeight} 1fr ${bottomHeight}`;
						} else {
							marginGroup.style.gridTemplateRows = `${topHeight} 0 1fr`;
						}
					} else {
						if (bottomHeight !== "none" && bottomHeight !== "auto" && bottomHeight) {
							marginGroup.style.gridTemplateRows = `1fr 0 ${bottomHeight}`;
						} else {
							marginGroup.style.gridTemplateRows = "1fr 0 1fr";
						}
					}
				}
			} else {
				if (bottomHeight !== "none" && bottomHeight !== "auto" && bottomHeight) {
					marginGroup.style.gridTemplateRows = `1fr 0 ${bottomHeight}`;
				} else if (bottomContent) {
					marginGroup.style.gridTemplateRows = "0 0 1fr";
				}
			}
		}
	}
}
