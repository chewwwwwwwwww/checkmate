const COLORS = {
  text: "#f7f3e8",
  muted: "#91a7c1",
  cyan: "#76e3ff",
  amber: "#ffb347",
  danger: "#ff6b6b",
  success: "#78f2b3",
  panel: "rgba(5, 13, 21, 0.72)",
  panelSoft: "rgba(16, 26, 40, 0.62)",
  wall: "#d8dee8",
  tile: "#1e2a38",
  tileAlt: "#243445",
  fixture: {
    urinal: "#64c8ff",
    stall: "#91f0af",
    occupied: "#ff8d69",
    disabled: "#5e6773",
    reward: "#ffd971"
  }
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 0;
    this.height = 0;
    this.hitRegions = [];
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(520, rect.height);
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.width = width;
    this.height = height;
  }

  hitTest(point) {
    return this.hitRegions.find(
      (region) =>
        point.x >= region.x &&
        point.x <= region.x + region.width &&
        point.y >= region.y &&
        point.y <= region.y + region.height
    );
  }

  render(model) {
    this.hitRegions = [];
    this.clear();
    this.drawBackdrop(model);
    const layout = this.getLayout();
    this.drawQueueLane(layout, model);
    this.drawRoomRows(layout, model);
    this.drawFixtures(layout, model.facilities);
    this.drawQueue(layout, model.queue);
    this.drawFloatingTexts(model.effects);
    this.drawFooter(layout, model);

    if (model.screen === "paused" || model.screen === "gameover" || model.screen === "menu") {
      this.ctx.fillStyle = model.screen === "menu" ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.34)";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  getLayout() {
    const mobile = this.width < 760;
    const laneWidth = mobile ? 126 : 178;
    const padding = mobile ? 18 : 24;
    const boardX = laneWidth + padding * 2;
    const boardWidth = this.width - boardX - padding;
    const urinalWidth = mobile ? 56 : 76;
    const urinalHeight = mobile ? 100 : 126;
    const stallWidth = mobile ? 84 : 112;
    const stallHeight = mobile ? 118 : 148;
    const urinalGap = Math.max(10, (boardWidth - urinalWidth * 5) / 6);
    const stallGap = Math.max(20, (boardWidth - stallWidth * 2) / 3);

    return {
      mobile,
      padding,
      lane: {
        x: padding,
        y: 92,
        width: laneWidth,
        height: this.height - 140
      },
      board: {
        x: boardX,
        width: boardWidth
      },
      urinals: {
        y: mobile ? 176 : 184,
        wallY: mobile ? 128 : 126,
        width: urinalWidth,
        height: urinalHeight,
        gap: urinalGap
      },
      stalls: {
        y: mobile ? 410 : 430,
        wallY: mobile ? 348 : 362,
        width: stallWidth,
        height: stallHeight,
        gap: stallGap
      }
    };
  }

  drawBackdrop(model) {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#0d1825");
    gradient.addColorStop(0.45, "#111d29");
    gradient.addColorStop(1, "#09111a");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const glow = this.ctx.createRadialGradient(this.width * 0.74, 96, 10, this.width * 0.74, 96, 260);
    glow.addColorStop(0, "rgba(118, 227, 255, 0.18)");
    glow.addColorStop(1, "rgba(118, 227, 255, 0)");
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const accent = this.ctx.createRadialGradient(90, 70, 10, 90, 70, 180);
    accent.addColorStop(0, "rgba(255, 179, 71, 0.16)");
    accent.addColorStop(1, "rgba(255, 179, 71, 0)");
    this.ctx.fillStyle = accent;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.globalAlpha = 0.55;
    for (let x = 0; x < this.width; x += 36) {
      for (let y = 0; y < this.height; y += 36) {
        const even = (Math.floor(x / 36) + Math.floor(y / 36)) % 2 === 0;
        this.ctx.fillStyle = even ? COLORS.tile : COLORS.tileAlt;
        this.ctx.fillRect(x, y, 36, 36);
      }
    }
    this.ctx.globalAlpha = 1;

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    this.ctx.fillRect(0, 72, this.width, 1);

    if (model.flash > 0.01) {
      this.ctx.fillStyle = `rgba(255, 107, 107, ${model.flash})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawQueueLane(layout, model) {
    const { lane } = layout;
    this.ctx.fillStyle = COLORS.panel;
    this.roundRect(lane.x, lane.y, lane.width, lane.height, 24, true);
    this.ctx.strokeStyle = "rgba(118, 227, 255, 0.2)";
    this.ctx.lineWidth = 1;
    this.roundRect(lane.x, lane.y, lane.width, lane.height, 24, false);

    this.ctx.fillStyle = COLORS.cyan;
    this.ctx.font = layout.mobile ? '700 14px "Avenir Next", sans-serif' : '700 16px "Avenir Next", sans-serif';
    this.ctx.fillText("QUEUE", lane.x + 16, lane.y + 26);

    this.ctx.fillStyle = COLORS.muted;
    this.ctx.font = '600 12px "Avenir Next", sans-serif';
    this.ctx.fillText(`${model.queue.length} waiting`, lane.x + 16, lane.y + 46);
  }

  drawRoomRows(layout) {
    this.ctx.fillStyle = COLORS.wall;
    this.ctx.globalAlpha = 0.88;
    this.roundRect(layout.board.x - 10, layout.urinals.wallY, layout.board.width + 20, 154, 30, true);
    this.roundRect(layout.board.x - 10, layout.stalls.wallY, layout.board.width + 20, 194, 30, true);
    this.ctx.globalAlpha = 1;

    this.ctx.fillStyle = "rgba(6, 15, 24, 0.76)";
    this.roundRect(layout.board.x + 18, layout.urinals.wallY + 18, 148, 34, 18, true);
    this.roundRect(layout.board.x + 18, layout.stalls.wallY + 18, 162, 34, 18, true);
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = '700 16px "Avenir Next", sans-serif';
    this.ctx.fillText("URINAL GRID", layout.board.x + 36, layout.urinals.wallY + 40);
    this.ctx.fillText("PRIVATE STALLS", layout.board.x + 36, layout.stalls.wallY + 40);
  }

  drawFixtures(layout, facilities) {
    const urinals = facilities.filter((facility) => facility.kind === "urinal");
    const stalls = facilities.filter((facility) => facility.kind === "stall");

    urinals.forEach((facility, index) => {
      const x = layout.board.x + layout.urinals.gap + index * (layout.urinals.width + layout.urinals.gap);
      const y = layout.urinals.y;
      this.drawUrinal(facility, x, y, layout.urinals.width, layout.urinals.height);
    });

    stalls.forEach((facility, index) => {
      const x = layout.board.x + layout.stalls.gap + index * (layout.stalls.width + layout.stalls.gap);
      const y = layout.stalls.y;
      this.drawStall(facility, x, y, layout.stalls.width, layout.stalls.height);
    });
  }

  drawUrinal(facility, x, y, width, height) {
    const tone = facility.disabled
      ? COLORS.fixture.disabled
      : facility.occupiedBy
        ? COLORS.fixture.occupied
        : COLORS.fixture.urinal;

    this.ctx.fillStyle = tone;
    this.roundRect(x, y, width, height, 26, true);
    this.ctx.fillStyle = "#eff6ff";
    this.roundRect(x + 10, y + 16, width - 20, height - 30, 18, true);
    this.ctx.fillStyle = "rgba(14, 20, 26, 0.28)";
    this.roundRect(x + width / 2 - 5, y + height - 16, 10, 12, 5, true);
    this.ctx.strokeStyle = "rgba(7, 12, 16, 0.36)";
    this.ctx.lineWidth = 1;
    this.roundRect(x, y, width, height, 26, false);

    if (facility.occupiedBy) {
      this.drawUsageBar(x + 10, y + height + 12, width - 20, facility.occupiedTimer / facility.occupiedDuration, "#ff8d69");
      this.drawOccupantGlyph(x + width / 2, y + 48, COLORS.fixture.occupied);
    }

    if (facility.reward && !facility.disabled) {
      this.drawRewardBadge(x + width - 16, y + 12);
    }

    if (facility.disabled) {
      this.drawDisabledStripe(x, y, width, height);
    }

    this.drawFixtureLabel(facility.label, x + width / 2, y + height + 34, facility.kind);
    this.hitRegions.push({ id: facility.id, kind: facility.kind, x, y, width, height });
  }

  drawStall(facility, x, y, width, height) {
    const tone = facility.disabled
      ? COLORS.fixture.disabled
      : facility.occupiedBy
        ? COLORS.fixture.occupied
        : COLORS.fixture.stall;

    this.ctx.fillStyle = "#f7fbff";
    this.roundRect(x, y, width, height, 24, true);
    this.ctx.fillStyle = tone;
    this.roundRect(x + 8, y + 8, width - 16, height - 16, 18, true);
    this.ctx.fillStyle = "#19302b";
    this.ctx.beginPath();
    this.ctx.arc(x + width - 20, y + height / 2, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(7, 12, 16, 0.36)";
    this.ctx.lineWidth = 1;
    this.roundRect(x, y, width, height, 24, false);

    if (facility.occupiedBy) {
      this.drawUsageBar(x + 12, y + height + 12, width - 24, facility.occupiedTimer / facility.occupiedDuration, "#ffb347");
      this.drawOccupantGlyph(x + width / 2, y + 54, "#fff4d8");
    }

    if (facility.reward && !facility.disabled) {
      this.drawRewardBadge(x + width - 16, y + 12);
    }

    if (facility.disabled) {
      this.drawDisabledStripe(x, y, width, height);
    }

    this.drawFixtureLabel(facility.label, x + width / 2, y + height + 34, facility.kind);
    this.hitRegions.push({ id: facility.id, kind: facility.kind, x, y, width, height });
  }

  drawQueue(layout, queue) {
    const startY = layout.lane.y + 64;
    const cardHeight = layout.mobile ? 60 : 68;
    const visible = queue.slice(0, 7);

    visible.forEach((patron, index) => {
      const y = startY + index * (cardHeight + 10);
      const lifeRatio = patron.patience / patron.maxPatience;
      const cardX = layout.lane.x + 12;
      const cardWidth = layout.lane.width - 24;

      this.ctx.fillStyle = index === 0 ? "rgba(255, 179, 71, 0.18)" : COLORS.panelSoft;
      this.roundRect(cardX, y, cardWidth, cardHeight, 18, true);
      this.ctx.strokeStyle = index === 0 ? "rgba(255, 179, 71, 0.55)" : "rgba(255, 255, 255, 0.06)";
      this.roundRect(cardX, y, cardWidth, cardHeight, 18, false);

      this.ctx.fillStyle = COLORS.text;
      this.ctx.font = '700 14px "Avenir Next", sans-serif';
      this.ctx.fillText(`#${patron.id}`, cardX + 14, y + 21);

      this.ctx.fillStyle = COLORS.muted;
      this.ctx.font = '600 11px "Avenir Next", sans-serif';
      this.ctx.fillText(index === 0 ? "Next up" : "Waiting", cardX + 14, y + 38);

      this.drawUsageBar(
        cardX + 14,
        y + cardHeight - 16,
        cardWidth - 28,
        lifeRatio,
        lifeRatio < 0.25 ? COLORS.danger : lifeRatio < 0.5 ? COLORS.amber : COLORS.success
      );
    });

    if (queue.length > visible.length) {
      this.ctx.fillStyle = COLORS.muted;
      this.ctx.font = '600 12px "Avenir Next", sans-serif';
      this.ctx.fillText(`+${queue.length - visible.length} more`, layout.lane.x + 16, this.height - 58);
    }
  }

  drawFooter(layout, model) {
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    this.ctx.fillRect(layout.board.x, this.height - 46, layout.board.width, 1);
    this.ctx.fillStyle = COLORS.muted;
    this.ctx.font = '600 12px "Avenir Next", sans-serif';
    this.ctx.fillText(
      model.screen === "playing"
        ? "Tap a fixture to route the first guest in line."
        : "Select a starting difficulty and begin the shift.",
      layout.board.x,
      this.height - 20
    );
  }

  drawFloatingTexts(effects) {
    effects.forEach((effect) => {
      this.ctx.globalAlpha = effect.life;
      this.ctx.fillStyle = effect.color;
      this.ctx.font = '700 18px "Avenir Next", sans-serif';
      this.ctx.textAlign = "center";
      this.ctx.fillText(effect.text, effect.x, effect.y);
      this.ctx.globalAlpha = 1;
    });
    this.ctx.textAlign = "left";
  }

  drawUsageBar(x, y, width, ratio, color) {
    const clamped = Math.max(0, Math.min(1, ratio));
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    this.roundRect(x, y, width, 7, 999, true);
    if (clamped > 0) {
      this.ctx.fillStyle = color;
      this.roundRect(x, y, Math.max(4, width * clamped), 7, 999, true);
    }
  }

  drawRewardBadge(x, y) {
    this.ctx.fillStyle = COLORS.fixture.reward;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 10, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = "#3b2900";
    this.ctx.font = '700 12px "Avenir Next", sans-serif';
    this.ctx.textAlign = "center";
    this.ctx.fillText("+1", x, y + 4);
    this.ctx.textAlign = "left";
  }

  drawDisabledStripe(x, y, width, height) {
    this.ctx.save();
    this.ctx.beginPath();
    this.roundRectPath(x, y, width, height, 22);
    this.ctx.clip();
    for (let i = -height; i < width + height; i += 18) {
      this.ctx.fillStyle = i % 36 === 0 ? "rgba(255, 107, 107, 0.82)" : "rgba(24, 26, 31, 0.78)";
      this.ctx.fillRect(x + i, y, 10, height + 10);
      this.ctx.translate(0, 0);
    }
    this.ctx.restore();
  }

  drawOccupantGlyph(x, y, color) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 7, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 8);
    this.ctx.lineTo(x, y + 24);
    this.ctx.moveTo(x - 10, y + 14);
    this.ctx.lineTo(x + 10, y + 14);
    this.ctx.moveTo(x, y + 24);
    this.ctx.lineTo(x - 8, y + 35);
    this.ctx.moveTo(x, y + 24);
    this.ctx.lineTo(x + 8, y + 35);
    this.ctx.stroke();
  }

  drawFixtureLabel(label, x, y, kind) {
    this.ctx.fillStyle = kind === "urinal" ? COLORS.cyan : COLORS.success;
    this.ctx.font = '700 14px "Avenir Next", sans-serif';
    this.ctx.textAlign = "center";
    this.ctx.fillText(label, x, y);
    this.ctx.textAlign = "left";
  }

  roundRect(x, y, width, height, radius, fill) {
    this.roundRectPath(x, y, width, height, radius);
    if (fill) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  roundRectPath(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + width, y, x + width, y + height, r);
    this.ctx.arcTo(x + width, y + height, x, y + height, r);
    this.ctx.arcTo(x, y + height, x, y, r);
    this.ctx.arcTo(x, y, x + width, y, r);
    this.ctx.closePath();
  }
}
