document.addEventListener("DOMContentLoaded", () => {
  const stage = document.querySelector("#eye-stage");
  const base = document.querySelector("#eye-base");

  if (!stage || !base) return;

  // Move the stage outside the theme container.
  document.body.prepend(stage);

  const eyes = [...document.querySelectorAll(".tracked-eye")].map(
    (element, index) => ({
      element,
      pupil: element.querySelector("img"),

      sourceX: Number(element.dataset.x),
      sourceY: Number(element.dataset.y),
      sourceSize: Number(element.dataset.size),
      sourceTravel: Number(element.dataset.travel),

      centerX: 0,
      centerY: 0,
      travel: 0,

      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,

      phase: index * 2.7
    })
  );

  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };

  function positionEyes() {
    if (!base.naturalWidth || !base.naturalHeight) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Matches object-fit: cover.
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
      eye.travel = eye.sourceTravel * scale;

      const displayedSize = eye.sourceSize * scale;

      eye.element.style.left = `${eye.centerX}px`;
      eye.element.style.top = `${eye.centerY}px`;
      eye.element.style.width = `${displayedSize}px`;
      eye.element.style.height = `${displayedSize}px`;
    });

    stage.classList.add("ready");
    aimEyes();
  }

  function aimEyes() {
    eyes.forEach((eye) => {
      const deltaX = pointer.x - eye.centerX;
      const deltaY = pointer.y - eye.centerY;
      const distance = Math.hypot(deltaX, deltaY) || 1;

      const movement = Math.min(eye.travel, distance * 0.08);

      eye.targetX = (deltaX / distance) * movement;
      eye.targetY = (deltaY / distance) * movement;
    });
  }

  function animate(time) {
    eyes.forEach((eye) => {
      // Slightly sluggish movement keeps it from looking overly clean.
      eye.currentX += (eye.targetX - eye.currentX) * 0.11;
      eye.currentY += (eye.targetY - eye.currentY) * 0.11;

      // Small uneven motion preserves the shabby/unnerving look.
      const jitterX = Math.sin(time * 0.009 + eye.phase) * 0.35;
      const jitterY = Math.cos(time * 0.011 + eye.phase) * 0.25;
      const rotation = Math.sin(time * 0.002 + eye.phase) * 0.7;

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
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    aimEyes();
  });

  window.addEventListener("resize", positionEyes);

  if (base.complete) {
    positionEyes();
  } else {
    base.addEventListener("load", positionEyes);
  }

  requestAnimationFrame(animate);
});
