document.addEventListener("DOMContentLoaded", () => {
  const stage = document.querySelector("#eye-stage");
  const base = document.querySelector("#eye-base");

  if (!stage || !base) return;

  document.body.prepend(stage);

  const eyes = [...document.querySelectorAll(".tracked-eye")].map(
    (element, index) => ({
      element,
      pupil: element.querySelector("img"),

      sourceX: Number(element.dataset.x),
      sourceY: Number(element.dataset.y),
      sourceSize: Number(element.dataset.size),
      sourceTravelX: Number(element.dataset.travelX),
      sourceTravelY: Number(element.dataset.travelY),

      centerX: 0,
      centerY: 0,
      travelX: 0,
      travelY: 0,

      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,

      phase: index * 2.7
    })
  );

  const pointer = {
    x: 0,
    y: 0,
    active: false
  };

  function centerEyes() {
    pointer.active = false;

    eyes.forEach((eye) => {
      eye.targetX = 0;
      eye.targetY = 0;
    });
  }

  function positionEyes() {
    if (!base.naturalWidth || !base.naturalHeight) return;

    const viewportWidth = stage.clientWidth;
    const viewportHeight = stage.clientHeight;

    const scale = Math.max(
      viewportWidth / base.naturalWidth,
      viewportHeight / base.naturalHeight
    );

    const renderedWidth = base.naturalWidth * scale;
    const renderedHeight = base.naturalHeight * scale;

    const offsetX = (viewportWidth - renderedWidth) / 2;
    const offsetY = (viewportHeight - renderedHeight) / 2;

    eyes.forEach((eye) => {
      eye.centerX = offsetX + eye.sourceX * scale;
      eye.centerY = offsetY + eye.sourceY * scale;

      eye.travelX = eye.sourceTravelX * scale;
      eye.travelY = eye.sourceTravelY * scale;

      const displayedSize = eye.sourceSize * scale;

      eye.element.style.left = `${eye.centerX}px`;
      eye.element.style.top = `${eye.centerY}px`;
      eye.element.style.width = `${displayedSize}px`;
      eye.element.style.height = `${displayedSize}px`;
    });

    if (pointer.active) {
      aimEyes();
    } else {
      centerEyes();
    }
  }

  function aimEyes() {
    if (!pointer.active) return;

    eyes.forEach((eye) => {
      const deltaX = pointer.x - eye.centerX;
      const deltaY = pointer.y - eye.centerY;
      const distance = Math.hypot(deltaX, deltaY) || 1;

      const strength = Math.min(1, distance / 300);

      eye.targetX =
        (deltaX / distance) * eye.travelX * strength;

      eye.targetY =
        (deltaY / distance) * eye.travelY * strength;
    });
  }

  function animate(time) {
    eyes.forEach((eye) => {
      eye.currentX += (eye.targetX - eye.currentX) * 0.11;
      eye.currentY += (eye.targetY - eye.currentY) * 0.11;

      const jitterX =
        Math.sin(time * 0.009 + eye.phase) * 0.35;

      const jitterY =
        Math.cos(time * 0.011 + eye.phase) * 0.2;

      const rotation =
        Math.sin(time * 0.002 + eye.phase) * 0.7;

      eye.pupil.style.transform = `
        translate3d(
          ${eye.currentX + jitterX}px,
          ${eye.currentY + jitterY}px,
          0
        )
        rotate(${rotation}deg)
      `;
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;

    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;

    aimEyes();
  });

  document.documentElement.addEventListener(
    "pointerleave",
    centerEyes
  );

  window.addEventListener("blur", centerEyes);
  window.addEventListener("resize", positionEyes);

  if (base.complete) {
    positionEyes();
  } else {
    base.addEventListener("load", positionEyes);
  }

  requestAnimationFrame(animate);
});
