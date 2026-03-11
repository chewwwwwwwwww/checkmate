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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

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

  getRegionCenter(id) {
    const region = this.hitRegions.find((candidate) => candidate.id === id);
    if (!region) return null;

    return {
      x: region.x + region.width / 2,
      y: region.y + region.height / 2
    };
  }

  render(model) {
    this.hitRegions = [];
    this.clear();
    this.ctx.save();
    if (model.shake > 0.01) {
      const intensity = model.shake * 12;
      this.ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
    }

    this.drawBackdrop(model);
    const layout = this.getLayout();
    this.drawQueueLane(layout, model);
    this.drawRoomRows(layout, model);
    this.drawFixtures(layout, model.facilities, model);
    this.drawBurstEffects(model.bursts);
    this.drawQueue(layout, model.queue);
    this.drawFloatingTexts(model.effects);
    this.drawFooter(layout, model);

    if (model.screen === "paused" || model.screen === "gameover" || model.screen === "menu") {
      this.ctx.fillStyle = model.screen === "menu" ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.34)";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    this.ctx.restore();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  getLayout() {
    const mobile = this.width < 760;
    const compact = this.width < 560;
    const padding = compact ? 12 : mobile ? 18 : 24;
    const laneWidth = compact ? this.width - padding * 2 : mobile ? 126 : 178;
    const boardX = compact ? padding : laneWidth + padding * 2;
    const boardWidth = this.width - boardX - padding;
    const urinalGap = compact ? 6 : mobile ? 10 : Math.max(10, boardWidth * 0.03);
    const stallGap = compact ? 14 : mobile ? 20 : Math.max(20, boardWidth * 0.05);
    const urinalWidth = compact
      ? clamp((boardWidth - urinalGap * 6) / 5, 42, 76)
      : mobile
        ? 56
        : 76;
    const urinalHeight = compact ? 92 : mobile ? 100 : 126;
    const stallWidth = compact
      ? clamp((boardWidth - stallGap * 3) / 2, 92, 112)
      : mobile
        ? 84
        : 112;
    const stallHeight = compact ? 120 : mobile ? 118 : 148;
    const laneHeight = compact ? 112 : this.height - 140;
    const urinalWallY = compact ? 220 : mobile ? 128 : 126;
    const urinalY = compact ? 258 : mobile ? 176 : 184;
    const stallWallY = compact ? 404 : mobile ? 348 : 362;
    const stallY = compact ? 444 : mobile ? 410 : 430;

    return {
      mobile,
      compact,
      padding,
      lane: {
        x: padding,
        y: 92,
        width: laneWidth,
        height: laneHeight
      },
      board: {
        x: boardX,
        width: boardWidth
      },
      urinals: {
        y: urinalY,
        wallY: urinalWallY,
        width: urinalWidth,
        height: urinalHeight,
        gap: urinalGap
      },
      stalls: {
        y: stallY,
        wallY: stallWallY,
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
    this.roundRect(lane.x, lane.y, lane.width, lane.height, layout.compact ? 20 : 24, true);
    this.ctx.strokeStyle = "rgba(118, 227, 255, 0.2)";
    this.ctx.lineWidth = 1;
    this.roundRect(lane.x, lane.y, lane.width, lane.height, layout.compact ? 20 : 24, false);

    this.ctx.fillStyle = COLORS.cyan;
    this.ctx.font = layout.compact
      ? '700 13px "Avenir Next", sans-serif'
      : layout.mobile
        ? '700 14px "Avenir Next", sans-serif'
        : '700 16px "Avenir Next", sans-serif';
    this.ctx.fillText("QUEUE", lane.x + 16, lane.y + 26);

    this.ctx.fillStyle = COLORS.muted;
    this.ctx.font = layout.compact ? '600 11px "Avenir Next", sans-serif' : '600 12px "Avenir Next", sans-serif';
    this.ctx.fillText(`${model.queue.length} waiting`, lane.x + 16, lane.y + 46);
  }

  drawRoomRows(layout) {
    this.ctx.fillStyle = COLORS.wall;
    this.ctx.globalAlpha = 0.88;
    this.roundRect(
      layout.board.x - (layout.compact ? 6 : 10),
      layout.urinals.wallY,
      layout.board.width + (layout.compact ? 12 : 20),
      layout.compact ? 146 : 154,
      layout.compact ? 24 : 30,
      true
    );
    this.roundRect(
      layout.board.x - (layout.compact ? 6 : 10),
      layout.stalls.wallY,
      layout.board.width + (layout.compact ? 12 : 20),
      layout.compact ? 182 : 194,
      layout.compact ? 24 : 30,
      true
    );
    this.ctx.globalAlpha = 1;

    this.ctx.fillStyle = "rgba(6, 15, 24, 0.76)";
    const labelX = layout.board.x + (layout.compact ? 12 : 18);
    const urinalLabelWidth = layout.compact ? Math.min(128, layout.board.width - 24) : 148;
    const stallLabelWidth = layout.compact ? Math.min(142, layout.board.width - 24) : 162;
    this.roundRect(labelX, layout.urinals.wallY + 18, urinalLabelWidth, 34, 18, true);
    this.roundRect(labelX, layout.stalls.wallY + 18, stallLabelWidth, 34, 18, true);
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = layout.compact ? '700 14px "Avenir Next", sans-serif' : '700 16px "Avenir Next", sans-serif';
    this.ctx.fillText("URINAL GRID", labelX + 18, layout.urinals.wallY + 40);
    this.ctx.fillText("PRIVATE STALLS", labelX + 18, layout.stalls.wallY + 40);
  }

  drawFixtures(layout, facilities, model) {
    const urinals = facilities.filter((facility) => facility.kind === "urinal");
    const stalls = facilities.filter((facility) => facility.kind === "stall");

    urinals.forEach((facility, index) => {
      const x = layout.board.x + layout.urinals.gap + index * (layout.urinals.width + layout.urinals.gap);
      const y = layout.urinals.y;
      this.drawUrinal(
        facility,
        x,
        y,
        layout.urinals.width,
        layout.urinals.height,
        this.getFixturePreview(model, facilities, facility)
      );
    });

    stalls.forEach((facility, index) => {
      const x = layout.board.x + layout.stalls.gap + index * (layout.stalls.width + layout.stalls.gap);
      const y = layout.stalls.y;
      this.drawStall(
        facility,
        x,
        y,
        layout.stalls.width,
        layout.stalls.height,
        this.getFixturePreview(model, facilities, facility)
      );
    });
  }

  getFixturePreview(model, facilities, facility) {
    if (model.screen !== "playing" || model.queue.length === 0) return "none";
    if (facility.disabled || facility.occupiedBy) return "blocked";
    if (facility.kind === "stall") return "safe";

    const hasNeighbor = facilities.some(
      (candidate) =>
        candidate.kind === "urinal" &&
        candidate.id !== facility.id &&
        Math.abs(candidate.slot - facility.slot) === 1 &&
        candidate.occupiedBy
    );

    return hasNeighbor ? "danger" : "safe";
  }

  drawUrinal(facility, x, y, width, height, preview = "none") {
    this.drawFixturePreview(x, y, width, height, preview, 26);

    const tone = facility.disabled
      ? COLORS.fixture.disabled
      : facility.occupiedBy
        ? COLORS.fixture.occupied
        : COLORS.fixture.urinal;

    this.ctx.fillStyle = tone;
    this.roundRect(x, y, width, height, 26, true);
    this.ctx.fillStyle = "#eff6ff";
    this.roundRect(x + width * 0.18, y + 16, width - width * 0.36, height - 30, Math.min(18, width * 0.32), true);
    this.ctx.fillStyle = "rgba(14, 20, 26, 0.28)";
    this.roundRect(x + width / 2 - 5, y + height - 16, 10, 12, 5, true);
    this.ctx.strokeStyle = "rgba(7, 12, 16, 0.36)";
    this.ctx.lineWidth = 1;
    this.roundRect(x, y, width, height, 26, false);

    if (facility.occupiedBy) {
      this.drawUsageBar(x + 10, y + height + 12, width - 20, facility.occupiedTimer / facility.occupiedDuration, "#ff8d69");
      this.drawOccupantGlyph(x + width / 2, y + Math.min(48, y + height * 0.48 - y), COLORS.fixture.occupied, width);
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

  drawStall(facility, x, y, width, height, preview = "none") {
    this.drawFixturePreview(x, y, width, height, preview, 24);

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
      this.drawOccupantGlyph(x + width / 2, y + Math.min(54, y + height * 0.42 - y), "#fff4d8", width);
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
    const cardHeight = layout.compact ? 44 : layout.mobile ? 60 : 68;
    const visible = queue.slice(0, layout.compact ? 4 : 7);

    if (layout.compact) {
      const gap = 8;
      const cardWidth = (layout.lane.width - 24 - gap * (visible.length - 1)) / Math.max(1, visible.length);

      visible.forEach((patron, index) => {
        const x = layout.lane.x + 12 + index * (cardWidth + gap);
        const y = startY;
        const lifeRatio = patron.patience / patron.maxPatience;
        const urgent = index === 0 && lifeRatio < 0.32;
        const pulse = urgent ? 0.72 + Math.sin(performance.now() / 110) * 0.16 : 0;

        this.ctx.fillStyle = urgent
          ? `rgba(255, 107, 107, ${0.16 + pulse * 0.16})`
          : index === 0
            ? "rgba(255, 179, 71, 0.18)"
            : COLORS.panelSoft;
        this.roundRect(x, y, cardWidth, cardHeight, 14, true);
        this.ctx.strokeStyle = urgent
          ? `rgba(255, 107, 107, ${0.66 + pulse * 0.18})`
          : index === 0
            ? "rgba(255, 179, 71, 0.55)"
            : "rgba(255, 255, 255, 0.06)";
        this.roundRect(x, y, cardWidth, cardHeight, 14, false);

        this.ctx.fillStyle = COLORS.text;
        this.ctx.font = '700 12px "Avenir Next", sans-serif';
        this.ctx.fillText(`#${patron.id}`, x + 10, y + 16);

        this.ctx.fillStyle = COLORS.muted;
        this.ctx.font = '600 10px "Avenir Next", sans-serif';
        this.ctx.fillText(index === 0 ? "Next" : "Wait", x + 10, y + 29);

        this.drawUsageBar(
          x + 10,
          y + cardHeight - 10,
          cardWidth - 20,
          lifeRatio,
          lifeRatio < 0.25 ? COLORS.danger : lifeRatio < 0.5 ? COLORS.amber : COLORS.success
        );
      });

      if (queue.length > visible.length) {
        this.ctx.fillStyle = COLORS.muted;
        this.ctx.font = '600 10px "Avenir Next", sans-serif';
        this.ctx.textAlign = "right";
        this.ctx.fillText(`+${queue.length - visible.length} more`, layout.lane.x + layout.lane.width - 12, layout.lane.y + 26);
        this.ctx.textAlign = "left";
      }

      return;
    }

    visible.forEach((patron, index) => {
      const y = startY + index * (cardHeight + 10);
      const lifeRatio = patron.patience / patron.maxPatience;
      const cardX = layout.lane.x + 12;
      const cardWidth = layout.lane.width - 24;
      const urgent = index === 0 && lifeRatio < 0.32;
      const pulse = urgent ? 0.72 + Math.sin(performance.now() / 110) * 0.16 : 0;

      this.ctx.fillStyle = urgent
        ? `rgba(255, 107, 107, ${0.14 + pulse * 0.14})`
        : index === 0
          ? "rgba(255, 179, 71, 0.18)"
          : COLORS.panelSoft;
      this.roundRect(cardX, y, cardWidth, cardHeight, 18, true);
      this.ctx.strokeStyle = urgent
        ? `rgba(255, 107, 107, ${0.7 + pulse * 0.16})`
        : index === 0
          ? "rgba(255, 179, 71, 0.55)"
          : "rgba(255, 255, 255, 0.06)";
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
    this.ctx.font = layout.compact ? '600 11px "Avenir Next", sans-serif' : '600 12px "Avenir Next", sans-serif';
    this.ctx.fillText(
      layout.compact
        ? model.screen === "playing"
          ? "Tap a safe fixture for the front guest."
          : "Pick a difficulty, then start the shift."
        : model.screen === "playing"
          ? "Tap a fixture to route the first guest in line."
          : "Select a starting difficulty and begin the shift.",
      layout.board.x,
      this.height - 20
    );
  }

  drawBurstEffects(bursts) {
    bursts.forEach((burst) => {
      const center = this.getRegionCenter(burst.facilityId);
      if (!center) return;

      this.ctx.save();
      this.ctx.globalAlpha = burst.life;
      this.ctx.strokeStyle = burst.color;
      this.ctx.lineWidth = burst.lineWidth;
      this.ctx.shadowBlur = 16;
      this.ctx.shadowColor = burst.color;
      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, burst.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    });
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

  drawFixturePreview(x, y, width, height, preview, radius) {
    if (preview !== "safe" && preview !== "danger") return;

    this.ctx.save();
    this.ctx.strokeStyle = preview === "safe" ? "rgba(120, 242, 179, 0.8)" : "rgba(255, 107, 107, 0.88)";
    this.ctx.lineWidth = preview === "safe" ? 3 : 4;
    this.ctx.shadowBlur = preview === "safe" ? 18 : 12;
    this.ctx.shadowColor = preview === "safe" ? "rgba(120, 242, 179, 0.45)" : "rgba(255, 107, 107, 0.4)";
    this.roundRect(x - 4, y - 4, width + 8, height + 8, radius + 4, false);

    if (preview === "danger") {
      this.ctx.fillStyle = "rgba(255, 107, 107, 0.14)";
      this.roundRect(x - 4, y - 4, width + 8, height + 8, radius + 4, true);
    }

    this.ctx.restore();
  }

  drawOccupantGlyph(x, y, color, width = 76) {
    const scale = clamp(width / 76, 0.72, 1);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3 * scale;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 7 * scale, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 8 * scale);
    this.ctx.lineTo(x, y + 24 * scale);
    this.ctx.moveTo(x - 10 * scale, y + 14 * scale);
    this.ctx.lineTo(x + 10 * scale, y + 14 * scale);
    this.ctx.moveTo(x, y + 24 * scale);
    this.ctx.lineTo(x - 8 * scale, y + 35 * scale);
    this.ctx.moveTo(x, y + 24 * scale);
    this.ctx.lineTo(x + 8 * scale, y + 35 * scale);
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
