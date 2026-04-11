particlesJS("particles-js", {
  particles: {
    number: {
      value: 300,
      density: { enable: true, value_area: 1000 }
    },
    color: { value: "#000000" },
    shape: { type: "circle" },
    opacity: {
      value: 1,
      random: true,
      anim: { enable: true, speed: 0.5, opacity_min: 0.2, sync: false }
    },
    size: {
      value: 2,
      random: true
    },
    line_linked: {
      enable: false
    },
    move: {
      enable: true,
      speed: 0.6,
      direction: "bottom",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: { enable: false },
      onclick: { enable: false },
      resize: true
    }
  },
  retina_detect: true
});
